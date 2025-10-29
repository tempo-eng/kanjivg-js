// Browser-safe utility functions (no fs/path imports)

export function toUnicode(input: string): string {
  if (input.length === 1) {
    const code = input.codePointAt(0);
    if (!code) {
      throw new Error(`Invalid character: ${input}`);
    }
    return code.toString(16).padStart(5, '0');
  } else if (input.length >= 2 && input.length <= 5) {
    return input.toLowerCase().padStart(5, '0');
  } else {
    throw new Error(`Invalid input format: ${input}`);
  }
}

export function unicodeToChar(unicode: string): string {
  const code = parseInt(unicode, 16);
  return String.fromCodePoint(code);
}

/**
 * Calculate the length of an SVG path string
 * Uses Path2D API in browser, or approximates from path commands
 */
export function getPathLength(pathData: string): number {
  if (typeof window === 'undefined') {
    // Node.js fallback: approximate from path commands
    return approximatePathLength(pathData);
  }

  // Browser: use SVG element for accurate measurement
  try {
    // Create a temporary SVG element to measure
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', pathData);
    svg.appendChild(pathEl);
    // Append to body temporarily (or use an off-screen container)
    if (document.body) {
      document.body.appendChild(svg);
    } else {
      // If no body, create one
      const body = document.createElement('body');
      body.appendChild(svg);
      document.documentElement.appendChild(body);
    }
    
    const length = pathEl.getTotalLength();
    
    // Clean up
    if (document.body && svg.parentNode === document.body) {
      document.body.removeChild(svg);
    }
    
    // If getTotalLength returns 0 or NaN, fall back to approximation
    if (length > 0 && !Number.isNaN(length)) {
      return length;
    }
  } catch (error) {
    // Fallback to approximation if DOM API fails
  }
  
  // Fallback to approximation
  return approximatePathLength(pathData);
}

/**
 * Approximate path length by parsing path commands
 * Simple approximation - works for lines, basic curves
 */
function approximatePathLength(pathData: string): number {
  if (!pathData || pathData.trim().length === 0) {
    return 0;
  }
  
  let totalLength = 0;
  let currentX = 0;
  let currentY = 0;
  
  // Parse path commands: M, L, C, Q, A, etc.
  // Match command letter followed by everything until next command letter or end
  const commands = pathData.match(/[MLCQAZmlcqaz][^MLCQAZmlcqaz]*/gi) || [];
  
  commands.forEach(cmd => {
    if (cmd.length === 0) return;
    
    const isRelative = cmd[0] === cmd[0].toLowerCase();
    const command = cmd[0].toUpperCase();
    // Extract all numbers from the command (handles commas, spaces, negatives)
    const coords = cmd.slice(1).match(/-?\d+\.?\d*/g)?.map(Number).filter(n => !isNaN(n)) || [];
    
    switch (command) {
      case 'M': // Move
        if (coords.length >= 2) {
          if (isRelative) {
            currentX += coords[0];
            currentY += coords[1];
          } else {
            currentX = coords[0];
            currentY = coords[1];
          }
        }
        break;
      case 'L': // Line
        if (coords.length >= 2) {
          let endX, endY;
          if (isRelative) {
            endX = currentX + coords[0];
            endY = currentY + coords[1];
          } else {
            endX = coords[0];
            endY = coords[1];
          }
          const dx = endX - currentX;
          const dy = endY - currentY;
          totalLength += Math.sqrt(dx * dx + dy * dy);
          currentX = endX;
          currentY = endY;
        }
        break;
      case 'C': // Cubic Bezier - approximate as straight line from start to end
        if (coords.length >= 6) {
          let endX, endY;
          if (isRelative) {
            endX = currentX + coords[4];
            endY = currentY + coords[5];
          } else {
            endX = coords[4];
            endY = coords[5];
          }
          const dx = endX - currentX;
          const dy = endY - currentY;
          totalLength += Math.sqrt(dx * dx + dy * dy);
          currentX = endX;
          currentY = endY;
        } else if (coords.length >= 2) {
          // Partial curve data - approximate using what we have (last 2 coords as end point)
          let endX, endY;
          if (isRelative) {
            endX = currentX + coords[coords.length - 2];
            endY = currentY + coords[coords.length - 1];
          } else {
            endX = coords[coords.length - 2];
            endY = coords[coords.length - 1];
          }
          const dx = endX - currentX;
          const dy = endY - currentY;
          totalLength += Math.sqrt(dx * dx + dy * dy);
          currentX = endX;
          currentY = endY;
        } else if (coords.length === 1) {
          // Very incomplete curve - use single value as small movement estimate
          const estLength = Math.abs(coords[0]);
          totalLength += estLength;
          if (isRelative) {
            currentX += coords[0];
          } else {
            currentX = coords[0];
          }
        }
        break;
      case 'Q': // Quadratic Bezier - approximate as straight line from start to end
        if (coords.length >= 4) {
          let endX, endY;
          if (isRelative) {
            endX = currentX + coords[2];
            endY = currentY + coords[3];
          } else {
            endX = coords[2];
            endY = coords[3];
          }
          const dx = endX - currentX;
          const dy = endY - currentY;
          totalLength += Math.sqrt(dx * dx + dy * dy);
          currentX = endX;
          currentY = endY;
        }
        break;
      case 'Z': // Close path - line back to start
        // Length already accounted for
        break;
    }
  });
  
  return totalLength;
}


