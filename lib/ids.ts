import { randomBytes } from "node:crypto";

// No 0/O/1/I to keep IDs readable when students read them aloud or type them.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomToken(length: number, rand: () => number = secureRandom) {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  return out;
}

function secureRandom() {
  return randomBytes(4).readUInt32BE(0) / 2 ** 32;
}

export function confirmationId(rand?: () => number) {
  return `CP-${randomToken(6, rand)}`;
}

/** Ambassador code: first 4 letters of the name + 3 random chars, e.g. PRIY7K2. */
export function ambassadorCode(name: string, rand?: () => number) {
  const stem = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4).padEnd(4, "X");
  return `${stem}${randomToken(3, rand)}`;
}
