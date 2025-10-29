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


