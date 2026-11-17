/**
 * GHOST-10/GHOST-11's shared ghost pictogram: Android's `ayu_ghost` drawable
 * (exteraless revision 8b7ec40) ported verbatim as an inline SVG. The web
 * icon pipeline compiles `src/assets/icons/*.svg` into the tgico font through
 * the icomoon web service, which is unavailable here — the two surfaces that
 * carry the pictogram (the burger-menu item and the topbar indicator) take
 * plain elements, so the paths ride inline instead of the font.
 */
const GHOST_PATHS = [
  'M10 10.5C10 11.328 9.552 12 9 12C8.448 12 8 11.328 8 10.5C8 9.672 8.448 9 9 9C9.552 9 10 9.672 10 10.5Z',
  'M16 10.5C16 11.328 15.552 12 15 12C14.448 12 14 11.328 14 10.5C14 9.672 14.448 9 15 9C15.552 9 16 9.672 16 10.5Z',
  'M12 1.25C6.042 1.25 1.25 6.219 1.25 12.301V19.723C1.25 21.569 3.162 22.846 4.843 21.981C5.524 21.63 6.335 21.681 6.972 22.118C8.199 22.961 9.801 22.961 11.028 22.118L11.381 21.876C11.757 21.618 12.243 21.618 12.619 21.876L12.972 22.118C14.199 22.961 15.801 22.961 17.028 22.118C17.665 21.681 18.476 21.63 19.157 21.981C20.837 22.846 22.75 21.569 22.75 19.723V12.301C22.75 6.219 17.958 1.25 12 1.25ZM2.75 12.301C2.75 7.005 6.912 2.75 12 2.75C17.088 2.75 21.25 7.005 21.25 12.301V19.723C21.25 20.521 20.461 20.965 19.844 20.647C18.67 20.042 17.269 20.133 16.179 20.882C15.464 21.373 14.536 21.373 13.821 20.882L13.468 20.639C12.58 20.03 11.42 20.03 10.532 20.639L10.179 20.882C9.464 21.373 8.536 21.373 7.821 20.882C6.731 20.133 5.33 20.042 4.156 20.647C3.539 20.965 2.75 20.521 2.75 19.723V12.301Z'
] as const;

/** The evenOdd body path (the third); the first two are the filled eyes. */
const GHOST_BODY_PATH = GHOST_PATHS[2];

export function createGhostIcon(className?: string): HTMLElement {
  const span = document.createElement('span');
  span.classList.add('extera-ghost-icon');
  if(className) span.classList.add(className);
  span.setAttribute('aria-hidden', 'true');

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');

  for(const d of GHOST_PATHS) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'currentColor');
    if(d === GHOST_BODY_PATH) {
      path.setAttribute('fill-rule', 'evenodd');
      path.setAttribute('clip-rule', 'evenodd');
    }
    svg.append(path);
  }

  span.append(svg);
  return span;
}
