import { clearScreenHost, getScreenHost, type ScreenHandle } from './responsive';

/** Owns responsive HTML presentation and guarantees one active view. */
export class ScreenHost {
  private static current: ScreenHandle | null = null;

  private static setViewState(active: boolean): void {
    if (typeof document === 'undefined' || !document.body) return;
    document.body.classList.toggle('has-screen-view', active);
  }

  public static mount(render: (host: HTMLElement) => ScreenHandle | void): ScreenHandle | null {
    const host = getScreenHost();
    if (!host) return null;
    ScreenHost.current?.destroy();
    clearScreenHost();
    const result = render(host) ?? { destroy: clearScreenHost };
    ScreenHost.current = result;
    ScreenHost.setViewState(true);
    return result;
  }

  public static clear(): void {
    ScreenHost.current?.destroy();
    ScreenHost.current = null;
    clearScreenHost();
    ScreenHost.setViewState(false);
  }
}
