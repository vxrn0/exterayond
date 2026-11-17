import contextMenuController from '@helpers/contextMenuController';
import {attachContextMenuListener} from '@helpers/dom/attachContextMenuListener';
import cancelEvent from '@helpers/dom/cancelEvent';
import ListenerSetter from '@helpers/listenerSetter';
import {getMiddleware, Middleware, MiddlewareHelper} from '@helpers/middleware';
import {Reaction} from '@layer';
import rootScope from '@lib/rootScope';
import {ButtonMenuItemOptionsVerifiable, ButtonMenuSync} from '@components/buttonMenu';
import ChatContextMenu from '@components/chat/contextMenu';
import {ChatReactionsMenu} from '@components/chat/reactionsMenu';
import {hotReloadGuard} from '@lib/solidjs/hotReloadGuardProvider';
import type {ButtonMenuDirection} from '@components/buttonMenuToggle';
import {getOverlayRoot} from '@helpers/appWindow';
import {positionMenuTrigger} from '@helpers/positionMenu';
import {bindManagersToSession} from '@lib/accounts/bindManagersToAccount';
import {exterayondSettings} from '@stores/exterayondSettings';

/**
 * A send button's menu lives in the overlay root like every other menu, placed against the button:
 * inside the composer or a popup it would be cut off by whatever clips them. Not being inside them, it
 * does not go away with them either, so it closes when `middleware` (its owner's) is cleaned
 */
export function mountSendMenu(element: HTMLElement, trigger: HTMLElement, direction: ButtonMenuDirection, middleware: Middleware) {
  getOverlayRoot().append(element);
  positionMenuTrigger(trigger, element, direction, {bottom: 8});
  middleware.onClean(() => {
    if(element.classList.contains('active')) contextMenuController.close();
  });
}

export default class SendMenu {
  private type: 'schedule' | 'reminder';
  private isPaid: boolean;
  private middlewareHelper: MiddlewareHelper;

  constructor(private options: {
    onSilentClick: () => void,
    onScheduleClick: () => void,
    onSendWhenOnlineClick?: () => void,
    middleware: Middleware,
    openSide: ButtonMenuDirection,
    onContextElement: HTMLElement,
    onOpen?: () => boolean,
    onToggle?: (open: boolean) => void,
    canSendWhenOnline?: () => boolean | Promise<boolean>,
    withEffects?: () => boolean,
    // * no room past the menu's end: the effects bar keeps over the menu, with no bubble at the button
    effectsWithinMenu?: () => boolean,
    effect?: () => DocId,
    onEffect?: (effect: DocId) => void
  }) {
    this.middlewareHelper = options.middleware.create();
    this.createMenu();

    // * GHOST-08: the menu builds its silent item at construction and again
    // * on every close — but the first open after a settings change would
    // * still show (and send) the stale direction, so the change itself
    // * rebuilds. The owner's middleware drops the listener with the chat.
    const onSettingsUpdated = ({key}: {key: string}) => {
      if(key === 'silentMessageByDefault') {
        this.createMenu();
      }
    };
    rootScope.addEventListener('exterayond_settings_updated', onSettingsUpdated);
    options.middleware.onClean(() => {
      rootScope.removeEventListener('exterayond_settings_updated', onSettingsUpdated);
    });
  }

  public setPeerParams(params: {peerId: PeerId, isPaid: boolean}) {
    this.type = params.peerId === rootScope.myId ? 'reminder' : 'schedule';
    this.isPaid = params.isPaid;
  }

  private createButtons(): ButtonMenuItemOptionsVerifiable[] {
    // * GHOST-08: with `silentMessageByDefault` on, ordinary sends go without
    // * sound, so the menu item is the explicit escape in the opposite
    // * direction (Android's send popup: "Send with Sound", notify icon on).
    // * The item re-reads the store on construction, on every close-triggered
    // * rebuild and on the setting change itself (see the constructor).
    const silentByDefault = !!exterayondSettings.silentMessageByDefault;
    return [{
      icon: silentByDefault ? 'unmute' : 'mute',
      text: silentByDefault ? 'Chat.Send.WithSound' : 'Chat.Send.WithoutSound',
      onClick: this.options.onSilentClick,
      verify: () => this.type === 'schedule'
    }, {
      icon: 'schedule',
      text: 'Chat.Send.ScheduledMessage',
      onClick: this.options.onScheduleClick,
      verify: () => this.type === 'schedule' && !this.isPaid
    }, {
      icon: 'schedule',
      text: 'Chat.Send.SetReminder',
      onClick: this.options.onScheduleClick,
      verify: () => this.type === 'reminder'
    }, {
      icon: 'online',
      text: 'Schedule.SendWhenOnline',
      onClick: this.options.onSendWhenOnlineClick,
      verify: async() => this.type === 'schedule' && (await this.options.canSendWhenOnline?.()) && !this.isPaid
    }, {
      icon: 'crossround',
      text: 'Effect.Remove',
      danger: true,
      onClick: () => this.options.onEffect(undefined),
      verify: () => !!this.options.effect?.()
    }];
  }

  private createMenu() {
    this.middlewareHelper.clean();
    const menuMiddleware = this.middlewareHelper.get();

    const listenerSetter = new ListenerSetter();
    menuMiddleware.onClean(() => {
      listenerSetter.removeAll();
    });

    this.createButtons();
    const buttons = this.createButtons();
    const element = ButtonMenuSync({buttons, listenerSetter});
    element.classList.add('menu-send', this.options.openSide);

    attachContextMenuListener({
      element: this.options.onContextElement,
      callback: async(e) => {
        const managers = bindManagersToSession(rootScope.managers);
        if(this.options.onOpen && !this.options.onOpen()) {
          return;
        }

        cancelEvent(e);
        await Promise.all(buttons.map(async(button) => {
          const result = await button.verify();
          button.element.classList.toggle('hide', !result);
        }));

        const middlewareHelper = getMiddleware();
        const middleware = middlewareHelper.get();

        const reactionsMenuPosition = 'horizontal';
        let reactionsMenu: ChatReactionsMenu;
        if(this.options.withEffects?.()) {
          reactionsMenu = new ChatReactionsMenu({
            managers,
            type: reactionsMenuPosition,
            middleware,
            onFinish: async(reaction) => {
              contextMenuController.close();
              reaction = await reaction;
              if(!reaction) {
                return;
              }

              const stickerDocId = (reaction as Reaction.reactionCustomEmoji).document_id;
              if(!rootScope.premium && !reactionsMenu.freeCustomEmoji.has(stickerDocId)) {
                hotReloadGuard.showPremiumPopup({feature: 'premium_stickers'});
                return;
              }

              const availableEffects = await managers.appReactionsManager.getAvailableEffects();
              const availableEffect = availableEffects.find((effect) => effect.effect_sticker_id === stickerDocId);
              this.options.onEffect(availableEffect.id);
            },
            getOpenPosition: (hasMenu) => ChatContextMenu.getReactionsOpenPosition(reactionsMenu, hasMenu),
            isEffects: true
          });

          await reactionsMenu.init();

          // const menuPadding = ChatContextMenu.getReactionsMenuPadding(reactionsMenuPosition);
        }

        // * the owner went away while the menu was being built
        if(!menuMiddleware()) {
          middlewareHelper.destroy();
          return;
        }

        const trigger = this.options.onContextElement;
        element.classList.toggle('effects-within-menu', !!this.options.effectsWithinMenu?.());
        mountSendMenu(element, trigger, this.options.openSide, menuMiddleware);
        const reactionsCallbacks = reactionsMenu && ChatContextMenu.appendReactionsMenu({element: element, reactionsMenu, reactionsMenuPosition});

        this.options.onToggle?.(true);
        contextMenuController.openBtnMenu(element, () => {
          this.options.onToggle?.(false);
          reactionsCallbacks?.onClose();
          middlewareHelper.destroy();
          // * not when it closes because its owner is being destroyed
          if(menuMiddleware()) this.createMenu();
          setTimeout(() => {
            element.remove();
          }, 400);
        }, trigger);

        reactionsCallbacks?.onAfterInit();
      },
      listenerSetter
    });
  }
};
