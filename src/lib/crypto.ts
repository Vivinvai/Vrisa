const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const fromBase64 = (value: string): Uint8Array => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const asArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
};

export const generateAesKey = async () =>
  crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

export const exportAesKey = async (key: CryptoKey) => {
  const raw = await crypto.subtle.exportKey("raw", key);
  return toBase64(raw);
};

export const importAesKey = async (rawKey: string) => {
  const bytes = fromBase64(rawKey);
  return crypto.subtle.importKey(
    "raw",
    asArrayBuffer(bytes),
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
};

export const deriveAesKeyFromPassphrase = async (
  passphrase: string,
  saltBase64?: string,
) => {
  const saltBytes = saltBase64
    ? fromBase64(saltBase64)
    : crypto.getRandomValues(new Uint8Array(16));
  const saltBuffer = asArrayBuffer(saltBytes);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 310_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  return { key, salt: toBase64(saltBuffer) };
};

export const encryptWithAes = async (key: CryptoKey, plaintext: string) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(plaintext),
  );

  return { ciphertext: toBase64(cipher), iv: toBase64(iv.buffer) };
};

export const decryptWithAes = async (
  key: CryptoKey,
  ciphertext: string,
  iv: string,
) => {
  const cipherBytes = fromBase64(ciphertext);
  const ivBytes = fromBase64(iv);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(ivBytes) },
    key,
    asArrayBuffer(cipherBytes),
  );

  return textDecoder.decode(plainBuffer);
};

export const generateRsaKeyPair = async () =>
  crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: "SHA-256",
    },
    true,
    ["wrapKey", "unwrapKey"],
  );

export const exportRsaPublicKey = async (key: CryptoKey) => {
  const spki = await crypto.subtle.exportKey("spki", key);
  return toBase64(spki);
};

export const exportRsaPrivateKey = async (key: CryptoKey) => {
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", key);
  return toBase64(pkcs8);
};

export const importRsaPublicKey = async (rawKey: string) => {
  const bytes = fromBase64(rawKey);
  return crypto.subtle.importKey(
    "spki",
    asArrayBuffer(bytes),
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["wrapKey"],
  );
};

export const importRsaPrivateKey = async (rawKey: string) => {
  const bytes = fromBase64(rawKey);
  return crypto.subtle.importKey(
    "pkcs8",
    asArrayBuffer(bytes),
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["unwrapKey"],
  );
};

export const wrapAesKeyWithRsa = async (aesKey: CryptoKey, rsaPublicKey: CryptoKey) => {
  const wrapped = await crypto.subtle.wrapKey("raw", aesKey, rsaPublicKey, "RSA-OAEP");
  return toBase64(wrapped);
};

export const unwrapAesKeyWithRsa = async (wrappedKey: string, rsaPrivateKey: CryptoKey) => {
  const wrapped = fromBase64(wrappedKey);
  return crypto.subtle.unwrapKey(
    "raw",
    asArrayBuffer(wrapped),
    rsaPrivateKey,
    "RSA-OAEP",
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
};

export const formatKeyPreview = (value?: string | null) => {
  if (!value) return "";
  return `${value.slice(0, 16)}...${value.slice(-8)}`;
};

/**
 * Generate a deterministic conversation key for two users.
 * Both users will always derive the same key regardless of who initiates the conversation.
 * This ensures messages can be encrypted and decrypted by both parties consistently.
 */
export const deriveConversationKey = async (userId1: string, userId2: string): Promise<CryptoKey> => {
  // Sort IDs alphabetically to ensure both users generate the same passphrase
  const [id1, id2] = [userId1, userId2].sort();
  
  // Create a unique passphrase for this conversation
  const passphrase = `vrisa-conv:${id1}:${id2}`;
  
  // Generate deterministic salt from sorted IDs (16 bytes required for PBKDF2)
  const saltString = `${id1}${id2}vrisa`;
  const saltBytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    saltBytes[i] = saltString.charCodeAt(i % saltString.length) ^ (i * 7); // XOR for better distribution
  }
  
  // Convert salt to base64 for the key derivation function
  const salt = toBase64(saltBytes.buffer);
  
  // Derive the AES key using PBKDF2 with the passphrase and salt
  const { key } = await deriveAesKeyFromPassphrase(passphrase, salt);
  return key;
};
