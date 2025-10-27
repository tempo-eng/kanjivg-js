// Utility functions for color handling and styling

/**
 * Get color for a stroke based on stroke number and color configuration
 */
export function getStrokeColor(
  strokeNumber: number,
  colors: string | string[],
  isRadical: boolean = false
): string {
  if (typeof colors === 'string') {
    return colors;
  }
  
  if (Array.isArray(colors)) {
    return colors[(strokeNumber - 1) % colors.length];
  }
  
  return 'black'; // Default fallback
}

/**
 * Parse CSS color value and return valid CSS color
 */
export function parseColor(color: string): string {
  // Basic validation - could be enhanced
  if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl')) {
    return color;
  }
  
  // Named colors
  const namedColors: Record<string, string> = {
    black: '#000000',
    white: '#ffffff',
    red: '#ff0000',
    green: '#00ff00',
    blue: '#0000ff',
    yellow: '#ffff00',
    cyan: '#00ffff',
    magenta: '#ff00ff',
  };
  
  return namedColors[color.toLowerCase()] || color;
}

/**
 * Convert stroke thickness to SVG stroke-width
 */
export function getStrokeWidth(thickness: number): number {
  return Math.max(0.5, thickness); // Minimum 0.5px
}

/**
 * Convert radius to SVG stroke-linecap
 */
export function getStrokeLinecap(radius: number): 'butt' | 'round' | 'square' {
  if (radius > 2) return 'round';
  if (radius > 0) return 'square';
  return 'butt';
}
