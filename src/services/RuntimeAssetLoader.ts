export interface RuntimeAsset {
  key: string;
  url: string;
}

export const PET_RUNTIME_ASSETS: readonly RuntimeAsset[] = [
  ...['mecha_cat', 'pixie_dragon', 'panda_cub', 'phoenix_chick'].flatMap(id =>
    ['idle', 'fly', 'cheer', 'thumbnail'].map(pose => ({
      key: `pet_${id}_${pose}`,
      url: `assets/pets/${id}/${pose}.png`,
    })),
  ),
];

export type RuntimeAssetGroupState = 'idle' | 'loading' | 'complete' | 'error';

export interface RuntimeAssetGroupResult {
  group: string;
  status: Exclude<RuntimeAssetGroupState, 'idle' | 'loading'>;
  loadedCount: number;
  failedKeys: string[];
}

interface LoaderLike {
  image(key: string, url: string): unknown;
  on(event: string, callback: (...args: any[]) => void): unknown;
  off?(event: string, callback: (...args: any[]) => void): unknown;
  isLoading?(): boolean;
  start(): unknown;
}

interface GroupRequest {
  assets: RuntimeAsset[];
  pending: Set<string>;
  failed: Set<string>;
  state: RuntimeAssetGroupState;
  promise: Promise<RuntimeAssetGroupResult>;
  resolve: (result: RuntimeAssetGroupResult) => void;
}

/** Coordinates Phaser's shared runtime queue without conflating asset groups. */
export class RuntimeAssetLoader {
  private readonly groups = new Map<string, GroupRequest>();
  private readonly onFileComplete = (key: string) => this.settleKey(key, false);
  private readonly onLoadError = (file: { key?: string }) => {
    if (file?.key) this.settleKey(file.key, true);
  };

  constructor(
    private readonly loader: LoaderLike,
    private readonly textureExists: (key: string) => boolean,
  ) {
    loader.on('filecomplete', this.onFileComplete);
    loader.on('loaderror', this.onLoadError);
  }

  public destroy(): void {
    this.loader.off?.('filecomplete', this.onFileComplete);
    this.loader.off?.('loaderror', this.onLoadError);
  }

  public getState(group: string): RuntimeAssetGroupState {
    return this.groups.get(group)?.state ?? 'idle';
  }

  public loadGroup(group: string, assets: readonly RuntimeAsset[]): Promise<RuntimeAssetGroupResult> {
    const existing = this.groups.get(group);
    if (existing?.state === 'loading' || existing?.state === 'complete') return existing.promise;

    const uniqueAssets = [...new Map(assets.map(asset => [asset.key, asset])).values()];
    let resolve!: (result: RuntimeAssetGroupResult) => void;
    const promise = new Promise<RuntimeAssetGroupResult>(done => { resolve = done; });
    const request: GroupRequest = {
      assets: uniqueAssets,
      pending: new Set(uniqueAssets.filter(asset => !this.textureExists(asset.key)).map(asset => asset.key)),
      failed: new Set(),
      state: 'loading',
      promise,
      resolve,
    };
    this.groups.set(group, request);

    if (request.pending.size === 0) {
      this.finish(group, request);
      return promise;
    }
    for (const asset of uniqueAssets) {
      if (request.pending.has(asset.key)) this.loader.image(asset.key, asset.url);
    }
    if (!this.loader.isLoading?.()) this.loader.start();
    return promise;
  }

  public retryGroup(group: string): Promise<RuntimeAssetGroupResult> {
    const request = this.groups.get(group);
    if (!request) return Promise.resolve({ group, status: 'complete', loadedCount: 0, failedKeys: [] });
    if (request.state === 'loading' || request.state === 'complete') return request.promise;
    return this.loadGroup(group, request.assets);
  }

  private settleKey(key: string, loaderFailed: boolean): void {
    for (const [group, request] of this.groups) {
      if (request.state !== 'loading' || !request.pending.has(key)) continue;
      request.pending.delete(key);
      if (loaderFailed || !this.textureExists(key)) request.failed.add(key);
      if (request.pending.size === 0) this.finish(group, request);
    }
  }

  private finish(group: string, request: GroupRequest): void {
    const missing = request.assets
      .filter(asset => !this.textureExists(asset.key))
      .map(asset => asset.key);
    request.failed = new Set([...request.failed, ...missing]);
    request.state = request.failed.size === 0 ? 'complete' : 'error';
    request.resolve({
      group,
      status: request.state,
      loadedCount: request.assets.filter(asset => this.textureExists(asset.key)).length,
      failedKeys: [...request.failed],
    });
  }
}
