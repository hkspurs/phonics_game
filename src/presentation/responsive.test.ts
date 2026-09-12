import { describe, expect, it } from 'vitest';
import { getViewportClass } from './responsive';

describe('responsive presentation viewport classification', () => {
  it('uses compact layout for narrow phone viewports', () => {
    expect(getViewportClass(390, 844)).toBe('compact');
    expect(getViewportClass(844, 390)).toBe('compact');
  });

  it('uses medium layout for tablets and wider short screens', () => {
    expect(getViewportClass(768, 1024)).toBe('medium');
    expect(getViewportClass(1280, 619)).toBe('medium');
  });

  it('uses wide layout for a full desktop viewport', () => {
    expect(getViewportClass(1280, 800)).toBe('wide');
  });
});
