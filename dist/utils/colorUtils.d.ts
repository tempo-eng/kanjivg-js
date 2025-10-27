/**
 * Get color for a stroke based on stroke number and color configuration
 */
export declare function getStrokeColor(strokeNumber: number, colors: string | string[], isRadical?: boolean): string;
/**
 * Parse CSS color value and return valid CSS color
 */
export declare function parseColor(color: string): string;
/**
 * Convert stroke thickness to SVG stroke-width
 */
export declare function getStrokeWidth(thickness: number): number;
/**
 * Convert radius to SVG stroke-linecap
 */
export declare function getStrokeLinecap(radius: number): 'butt' | 'round' | 'square';
//# sourceMappingURL=colorUtils.d.ts.map