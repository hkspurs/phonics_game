import { describe, expect, it } from 'vitest';
import { RuntimeAssetLoader } from './RuntimeAssetLoader';

class LoaderStub {
  loading = false;
  queued: Array<{ key: string; url: string }> = [];
  listeners = new Map<string, Array<(...args: any[]) => void>>();
  image(key: string, url: string) { this.queued.push({ key, url }); return this; }
  on(event: string, callback: (...args: any[]) => void) {
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), callback]);
    return this;
  }
  off(event: string, callback: (...args: any[]) => void) {
    this.listeners.set(event, (this.listeners.get(event) ?? []).filter(listener => listener !== callback));
    return this;
  }
  isLoading() { return this.loading; }
  start() { this.loading = true; return this; }
  emit(event: string, ...args: any[]) {
    for (const callback of this.listeners.get(event) ?? []) callback(...args);
  }
}

describe('RuntimeAssetLoader', () => {
  it('keeps overlapping groups independent and shares the same group request', async () => {
    const loader = new LoaderStub();
    const loaded = new Set<string>();
    const runtime = new RuntimeAssetLoader(loader, key => loaded.has(key));
    const wardrobe = runtime.loadGroup('wardrobe', [{ key: 'dress', url: '/dress.png' }]);
    const sameWardrobe = runtime.loadGroup('wardrobe', [{ key: 'dress', url: '/dress.png' }]);
    const pets = runtime.loadGroup('pets', [{ key: 'pet', url: '/pet.png' }]);
    expect(sameWardrobe).toBe(wardrobe);
    expect(loader.queued.map(asset => asset.key)).toEqual(['dress', 'pet']);

    loaded.add('dress');
    loader.emit('filecomplete', 'dress');
    await expect(wardrobe).resolves.toMatchObject({ status: 'complete', loadedCount: 1 });
    expect(runtime.getState('pets')).toBe('loading');
    loaded.add('pet');
    loader.emit('filecomplete', 'pet');
    await expect(pets).resolves.toMatchObject({ status: 'complete', loadedCount: 1 });
  });

  it('reports partial failure and retries only missing textures', async () => {
    const loader = new LoaderStub();
    const loaded = new Set<string>();
    const runtime = new RuntimeAssetLoader(loader, key => loaded.has(key));
    const first = runtime.loadGroup('wardrobe', [
      { key: 'ready', url: '/ready.png' },
      { key: 'missing', url: '/missing.png' },
    ]);
    loaded.add('ready');
    loader.emit('filecomplete', 'ready');
    loader.emit('loaderror', { key: 'missing' });
    await expect(first).resolves.toMatchObject({ status: 'error', loadedCount: 1, failedKeys: ['missing'] });

    loader.queued = [];
    loader.loading = false;
    const retry = runtime.retryGroup('wardrobe');
    expect(loader.queued).toEqual([{ key: 'missing', url: '/missing.png' }]);
    loaded.add('missing');
    loader.emit('filecomplete', 'missing');
    await expect(retry).resolves.toMatchObject({ status: 'complete', loadedCount: 2, failedKeys: [] });
  });

  it('does not report completion until every requested texture exists', async () => {
    const loader = new LoaderStub();
    const runtime = new RuntimeAssetLoader(loader, () => false);
    const result = runtime.loadGroup('pets', [{ key: 'pet', url: '/pet.png' }]);
    loader.emit('filecomplete', 'pet');
    await expect(result).resolves.toMatchObject({ status: 'error', loadedCount: 0, failedKeys: ['pet'] });
  });

  it('releases loader listeners before a scene creates a replacement loader', () => {
    const loader = new LoaderStub();
    const first = new RuntimeAssetLoader(loader, () => false);
    expect(loader.listeners.get('filecomplete')).toHaveLength(1);
    expect(loader.listeners.get('loaderror')).toHaveLength(1);

    first.destroy();
    expect(loader.listeners.get('filecomplete')).toHaveLength(0);
    expect(loader.listeners.get('loaderror')).toHaveLength(0);

    new RuntimeAssetLoader(loader, () => false);
    expect(loader.listeners.get('filecomplete')).toHaveLength(1);
    expect(loader.listeners.get('loaderror')).toHaveLength(1);
  });
});
