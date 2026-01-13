
export enum EditorTool {
  ADJUST = 'adjust',
  FILTER = 'filter',
  AI = 'ai',
  TRANSFORM = 'transform',
  MORE = 'more',
  GEN_EXPAND = 'gen_expand',
  BG_REMOVE = 'bg_remove',
  PORTRAIT_LIGHT = 'portrait_light',
  NONE = 'none'
}

export interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  vignette: number;
  sharpness: number;
}

export interface Filter {
  id: string;
  name: string;
  css: string;
}

export const FILTERS: Filter[] = [
  { id: 'original', name: 'Original', css: '' },
  { id: 'vivid', name: 'Vívido', css: 'saturate(1.6) contrast(1.15) brightness(1.05)' },
  { id: 'warm', name: 'Cálido', css: 'sepia(0.3) saturate(1.3) hue-rotate(-10deg)' },
  { id: 'cool', name: 'Frío', css: 'hue-rotate(15deg) saturate(1.25) brightness(1.05)' },
  { id: 'bw', name: 'B y N', css: 'grayscale(1) contrast(1.2)' },
  { id: 'cinematic', name: 'Cine', css: 'contrast(1.3) saturate(0.8) sepia(0.2)' },
  { id: 'dreamy', name: 'Ensueño', css: 'brightness(1.1) saturate(1.2) blur(0.5px) contrast(0.9)' },
  { id: 'retro', name: 'Retro', css: 'sepia(0.4) contrast(0.8) hue-rotate(-20deg) brightness(1.1)' }
];

export enum NanoBananaModel {
  FAST = 'fast',
  FAST_3 = 'fast_3',
  PRO = 'pro',
  ULTRA = 'ultra'
}
