import { clearScreenHost, getScreenHost, type ScreenHandle } from './responsive';

/** Owns responsive HTML presentation and guarantees one active view. */
export class ScreenHost {
  private static current: ScreenHandle | null = null;

  public static mount(render: (host: HTMLElement) => ScreenHandle | void): ScreenHandle | null {
    const host = getScreenHost();
    if (!host) return null;
    ScreenHost.current?.destroy();
    clearScreenHost();
    const result = render(host) ?? { destroy: clearScreenHost };
    ScreenHost.current = result;
    return result;
  }

  public static clear(): void {
    ScreenHost.current?.destroy();
    ScreenHost.current = null;
    clearScreenHost();
  }
}
