/**
 * Cross-platform shadow utility
 * ─────────────────────────────
 * Returns `boxShadow` (CSS string) on web and native shadow* + elevation props
 * on iOS/Android. Eliminates the react-native-web deprecation warning:
 *   "shadow*" style props are deprecated. Use "boxShadow".
 */
import { Platform, ViewStyle } from 'react-native';

interface ShadowOptions {
  color?: string;
  offsetX?: number;
  offsetY?: number;
  opacity?: number;
  radius?: number;
  elevation?: number;
}

function hexToRgba(hex: string, alpha: number): string {
  // Handle rgba/rgb strings – replace the alpha channel
  const rgbaMatch = hex.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbaMatch) {
    return `rgba(${rgbaMatch[1]},${rgbaMatch[2]},${rgbaMatch[3]},${alpha})`;
  }
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function shadow(opts: ShadowOptions = {}): ViewStyle {
  const {
    color = '#000',
    offsetX = 0,
    offsetY = 2,
    opacity = 0.1,
    radius = 4,
    elevation = 2,
  } = opts;

  if (Platform.OS === 'web') {
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px ${hexToRgba(color, opacity)}`,
    } as unknown as ViewStyle;
  }
  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}
