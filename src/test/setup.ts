// Mock browser globals for Phaser imports under Node environment in unit tests
if (typeof window === 'undefined') {
  (globalThis as any).window = globalThis;
  (globalThis as any).navigator = {
    userAgent: 'node',
    maxTouchPoints: 0,
  };
  (globalThis as any).document = {
    documentElement: {},
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        return {
          getContext: () => ({
            fillRect: () => {},
            clearRect: () => {},
            getImageData: () => ({ data: [] }),
            putImageData: () => {},
            createImageData: () => [],
            setTransform: () => {},
            drawImage: () => {},
            save: () => {},
            fillText: () => {},
            restore: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            closePath: () => {},
            stroke: () => {},
            translate: () => {},
            scale: () => {},
            rotate: () => {},
            arc: () => {},
            fill: () => {},
          }),
          style: {},
          width: 800,
          height: 600,
        };
      }
      return {
        style: {},
      };
    },
    getElementById: () => null,
  };
  (globalThis as any).HTMLCanvasElement = class {};
  (globalThis as any).HTMLVideoElement = class {};
  (globalThis as any).Image = class {};
}
