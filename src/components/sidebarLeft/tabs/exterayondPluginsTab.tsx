import {createSignal, For, Show} from 'solid-js';
import RadioFieldTsx from '@components/radioFieldTsx';
import Row from '@components/rowTsx';
import Section from '@components/section';
import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import {I18n, i18n, LangPackKey} from '@lib/langPack';
import findUpClassName from '@helpers/dom/findUpClassName';
import {ROW_CHECKBOX_FIELD_TOGGLE_CLASS} from '@components/rowFieldClasses';
import {toastNew} from '@components/toast';
import {
  ENGINE_JS,
  ENGINE_PYTHON,
  pluginsManager,
  PluginRecord
} from '@plugins/manager';
import {
  describePermission,
  getEffectivePermissions,
  permissionStorage,
  PluginTrustLevel,
  trustLevel
} from '@plugins/permissions';
import {pluginsRuntime} from '@plugins/runtime';

/**
 * The Plugins category of the exteraless Preferences hub: install, enable,
 * trust, per-plugin settings — the management surface of the plugin contract.
 * The settings screen renders the models a plugin's `create_settings()` gave
 * (switch / selector / slider / input / text / headers), and Python plugins
 * show why they are not running instead of pretending to.
 */

const TRUST_LEVEL_NAMES: Record<number, string> = {
  [PluginTrustLevel.ISOLATED]: 'Exterayond.Plugins.Trust.Isolated',
  [PluginTrustLevel.GATED]: 'Exterayond.Plugins.Trust.Gated',
  [PluginTrustLevel.TRUSTED]: 'Exterayond.Plugins.Trust.Trusted'
};

const reloadPlugin = (record: PluginRecord) => {
  pluginsRuntime.unload(record.id);
  if(record.engine !== ENGINE_PYTHON) {
    pluginsRuntime.load(record.id);
  }
};

const PluginSettingsModels = (props: {record: PluginRecord}) => {
  const models = () => pluginsRuntime.getSettingsModels(props.record.id) as Array<Record<string, any>>;
  const settingOf = (model: Record<string, any>) => {
    const settings = pluginsManager.getSettings(props.record.id);
    return settings[model.key] !== undefined ? settings[model.key] : model.default;
  };

  return (
    <Show when={models().length}>
      <Section name="Exterayond.Plugins.Settings">
        {models().filter((model) => !!model && SETTINGS_MODEL_TYPES.has(model.type)).map((model) => {
          if(model.type === 'header') {
            return <Row><Row.Title>{model.text}</Row.Title></Row>;
          }
          if(model.type === 'divider') {
            return <Row><Row.Title>· · ·</Row.Title></Row>;
          }
          if(model.type === 'switch') {
            return (
              <Row>
                <Row.CheckboxFieldToggle>
                  <CheckboxFieldTsx
                    toggle
                    checked={!!settingOf(model)}
                    onChange={(value) => {
                      pluginsManager.setSetting(props.record.id, model.key, value);
                      reloadPlugin(props.record);
                    }}
                  />
                </Row.CheckboxFieldToggle>
                <Row.Title>{model.text}</Row.Title>
                {model.subtext && <Row.Subtitle>{model.subtext}</Row.Subtitle>}
              </Row>
            );
          }
          if(model.type === 'selector') {
            const items: string[] = model.items ?? [];
            return (
              <Section>
                <Row><Row.Title>{model.text}</Row.Title></Row>
                <For each={items}>{(item) => (
                  <Row clickable={() => {
                    pluginsManager.setSetting(props.record.id, model.key, item);
                    reloadPlugin(props.record);
                  }}>
                    <Row.RadioField>
                      <RadioFieldTsx
                        alignRight
                        class="disable-hover"
                        checked={settingOf(model) === item}
                        name={`plugin-${props.record.id}-${model.key}`}
                        value={item}
                        onChange={(checked) => {
                          if(!checked) return;
                          pluginsManager.setSetting(props.record.id, model.key, item);
                          reloadPlugin(props.record);
                        }}
                      />
                    </Row.RadioField>
                    <Row.Title>{item}</Row.Title>
                  </Row>
                )}</For>
              </Section>
            );
          }
          if(model.type === 'slider') {
            return (
              <Row>
                <Row.Title>{model.text}: {String(settingOf(model) ?? 0)}</Row.Title>
                {model.subtext && <Row.Subtitle>{model.subtext}</Row.Subtitle>}
              </Row>
            );
          }

          return (
            <Row>
              <Row.Title>{model.text}</Row.Title>
              <Row.Subtitle>{String(settingOf(model) ?? '')}</Row.Subtitle>
            </Row>
          );
        })}
      </Section>
    </Show>
  );
};

const SETTINGS_MODEL_TYPES = new Set(['switch', 'selector', 'slider', 'input', 'text', 'edit_text', 'header', 'divider']);

const PluginRow = (props: {record: PluginRecord, onChanged: () => void}) => {
  const [expanded, setExpanded] = createSignal(false);
  const record = () => props.record;
  const effective = () => getEffectivePermissions(record().id);

  const cycleTrust = () => {
    const next = (trustLevel.getLevel(record().id) + 1) % 3;
    trustLevel.setLevel(record().id, next);
    reloadPlugin(record());
    setExpanded(true);
  };

  return (
    <>
      <Row clickable={(e) => {
        // * the toggle sits inside the clickable row: its click must not also
        // * expand the details
        if(findUpClassName(e.target as HTMLElement, ROW_CHECKBOX_FIELD_TOGGLE_CLASS)) return;
        setExpanded(!expanded());
      }}>
        <Row.CheckboxFieldToggle>
          <CheckboxFieldTsx
            toggle
            checked={pluginsManager.isEnabled(record().id)}
            onChange={(value) => {
              pluginsManager.setEnabled(record().id, value);
              if(value) reloadPlugin(record());
              else pluginsRuntime.unload(record().id);
              props.onChanged();
            }}
          />
        </Row.CheckboxFieldToggle>
        <Row.Title titleRight={`${record().version}${record().beta ? ' β' : ''}`} titleRightSecondary>
          {record().name}
        </Row.Title>
        <Row.Subtitle>{
          record().engine === ENGINE_PYTHON ?
            record().unsupportedReason :
            effective().map(describePermission).join(', ')
        }</Row.Subtitle>
      </Row>
      <Show when={expanded()}>
        <Section>
          <Row clickable={cycleTrust}>
            <Row.Icon icon="lock" />
            <Row.Title titleRight={I18n.format(TRUST_LEVEL_NAMES[trustLevel.getLevel(record().id)] as LangPackKey, true)} titleRightSecondary>
              {i18n('Exterayond.Plugins.TrustLevel')}
            </Row.Title>
            <Row.Subtitle>{i18n('Exterayond.Plugins.TrustLevel.Info')}</Row.Subtitle>
          </Row>
          <Row clickable={() => {
            if(window.confirm(I18n.format('Exterayond.Plugins.Delete', true))) {
              pluginsRuntime.unload(record().id);
              pluginsManager.uninstall(record().id);
              toastNew({langPackKey: 'Exterayond.Plugins.Deleted'});
              setExpanded(false);
              props.onChanged();
            }
          }}>
            <Row.Icon icon="delete" />
            <Row.Title class="danger">{i18n('Exterayond.Plugins.Delete')}</Row.Title>
          </Row>
        </Section>
        <PluginSettingsModels record={record()} />
      </Show>
    </>
  );
};

const ExterayondPlugins = () => {
  // * the manager's reads are plain localStorage — the version signal makes
  // * the tab's list (and its enable states) re-read after every mutation
  const [recordsVersion, bumpRecordsVersion] = createSignal(0);
  const records = () => {
    recordsVersion();
    return pluginsManager.getRecords();
  };

  const install = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.plugin,.py,.js,.elyx,.eaf';
    input.multiple = true;
    input.onchange = () => {
      for(const file of Array.from(input.files ?? [])) {
        const reader = new FileReader();
        reader.onload = () => {
          const result = pluginsManager.install(file.name, String(reader.result ?? ''));
          if(!result.ok) {
            toastNew({langPackKey: 'Exterayond.Plugins.InstallFailed', langPackArguments: [result.error ?? '']});
            return;
          }

          toastNew({langPackKey: 'Exterayond.Plugins.Installed', langPackArguments: [result.record!.name]});
          reloadPlugin(result.record!);
          bumpRecordsVersion();
        };
        reader.readAsText(file);
      }
    };

    input.click();
  };

  return (
    <>
      <Section caption="Exterayond.Plugins.Info">
        <Row clickable={install}>
          <Row.Icon icon="add" />
          <Row.Title>{i18n('Exterayond.Plugins.Install')}</Row.Title>
        </Row>
      </Section>
      <Show when={records().length} fallback={
        <Section>
          <Row>
            <Row.Title>{i18n('Exterayond.Plugins.Empty')}</Row.Title>
          </Row>
        </Section>
      }>
        <Section name="Exterayond.Plugins">
          {records().map((record) => <PluginRow record={record} onChanged={bumpRecordsVersion} />)}
        </Section>
      </Show>
      <Section name="Exterayond.Plugins.SafeMode">
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={pluginsManager.isSafeMode()}
              onChange={(value) => {
                pluginsManager.setSafeMode(value);
                // * safe mode is a runtime state, not just a flag: on stops
                // * every loaded plugin, off reloads them (the runtime's
                // * documented safe-mode recovery — until now it existed
                // * only on the next page load)
                for(const record of pluginsManager.getRecords()) {
                  if(record.engine !== ENGINE_JS) continue;
                  if(value) pluginsRuntime.unload(record.id);
                  else pluginsRuntime.load(record.id);
                }
              }}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.Plugins.SafeMode')}</Row.Title>
          <Row.Subtitle>{i18n('Exterayond.Plugins.SafeMode.Info')}</Row.Subtitle>
        </Row>
      </Section>
    </>
  );
};

export default ExterayondPlugins;
