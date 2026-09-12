export type ViewportClass = 'compact' | 'medium' | 'wide';

/** Classify the CSS viewport used by the HTML presentation layer. */
export function getViewportClass(width: number, height: number): ViewportClass {
  const shortest = Math.min(Math.max(1, width), Math.max(1, height));
  if (shortest < 600 || width < 600) return 'compact';
  if (width < 1024 || height < 620) return 'medium';
  return 'wide';
}

export function getScreenHost(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return document.getElementById('screen-host');
}

export function clearScreenHost(): void {
  const host = getScreenHost();
  if (host) host.replaceChildren();
}

export function makeElement<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
}

export function addText<K extends keyof HTMLElementTagNameMap>(parent: HTMLElement, tag: K, text: string, className?: string): HTMLElementTagNameMap[K] {
  const element = makeElement(tag, className);
  element.textContent = text;
  parent.append(element);
  return element;
}

export interface ScreenHandle {
  destroy(): void;
}

export function emptyScreenHandle(): ScreenHandle {
  return { destroy: clearScreenHost };
}
