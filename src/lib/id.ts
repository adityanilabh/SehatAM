import * as Crypto from 'expo-crypto';

/** A random UUID, generated on the device so rows stay unique once cloud sync exists. */
export function newId(): string {
  return Crypto.randomUUID();
}
