import { deriveConversationKey as deriveKey } from "./crypto";

/**
 * Generate a deterministic group conversation key for all members
 * Uses all member IDs to create a unique key for the group
 */
export const deriveGroupConversationKey = async (groupId: string, memberIds: string[]): Promise<CryptoKey> => {
  // Sort member IDs to ensure consistent key generation
  const sortedIds = [...memberIds].sort();
  
  // Create passphrase using group ID and all member IDs
  const passphrase = `vrisa-group:${groupId}:${sortedIds.join(':')}`;
  
  // Generate deterministic salt from group ID and member IDs
  const saltString = `${groupId}${sortedIds.join('')}`;
  const saltBytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    saltBytes[i] = saltString.charCodeAt(i % saltString.length) ^ (i * 11); // XOR with prime
  }
  
  const textEncoder = new TextEncoder();
  const toBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  };

  const salt = toBase64(saltBytes.buffer);
  
  // Import passphrase as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  // Derive AES key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 310_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  
  return key;
};
