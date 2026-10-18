// Readable temporary passwords: no look-alike characters (0/O, 1/l/I).
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

export function generatePassword(length = 10): string {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  let out = '';
  for (const v of values) out += ALPHABET[v % ALPHABET.length];
  // Split into two halves for easier reading aloud: abcde-fghij
  return `${out.slice(0, 5)}-${out.slice(5)}`;
}
