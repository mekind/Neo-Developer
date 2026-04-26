export const DEFAULT_UNSAFE_PATTERNS = [
  /ignore (all )?previous instructions/i,
  /system prompt/i,
  /bypass/i,
  /you are not/i,
];

/**
 * Checks if the input matches any known unsafe patterns (e.g. prompt injection attempts).
 */
export function matchesUnsafePattern(input: string, patterns = DEFAULT_UNSAFE_PATTERNS): boolean {
  if (!input) return false;
  return patterns.some(pattern => pattern.test(input));
}

/**
 * Checks if the input matches any of the given boundary keywords.
 * This can be used to either enforce that the input must contain a boundary topic (whitelist),
 * or that it must not contain a boundary topic (blacklist), depending on the caller's logic.
 */
export function matchesAnyBoundary(input: string, boundaries: string[]): boolean {
  if (!input || !boundaries || boundaries.length === 0) return false;
  const lowerInput = input.toLowerCase();
  return boundaries.some(boundary => lowerInput.includes(boundary.toLowerCase()));
}

export type Formality = 'polite' | 'casual';

/**
 * Returns an out-of-scope rejection message based on the desired formality.
 */
export function pickOutOfScopePhrase(formality: Formality = 'polite'): string {
  if (formality === 'casual') {
    return "I can't help with that. Let's stick to the topic!";
  }
  return "I apologize, but I am unable to assist with that request as it falls outside my defined boundaries.";
}
