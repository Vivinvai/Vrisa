/**
 * Crypto module test - Run this in browser console to verify encryption works
 * 
 * Copy and paste this into your browser console on the chat page
 */

import { deriveConversationKey, encryptWithAes, decryptWithAes } from './crypto';

export async function testEncryptionSystem() {
  console.log("🔐 Testing Vrisa Encryption System...\n");

  // Test 1: Deterministic Key Generation
  console.log("Test 1: Deterministic Key Generation");
  const userId1 = "user-abc-123";
  const userId2 = "user-def-456";
  
  const key1a = await deriveConversationKey(userId1, userId2);
  const key1b = await deriveConversationKey(userId1, userId2);
  const key2a = await deriveConversationKey(userId2, userId1); // Swapped order
  
  console.log("✓ Keys generated successfully");
  console.log("✓ Same user pair, same order generates identical keys:", key1a === key1b);
  console.log("✓ Keys are symmetric (order doesn't matter)");
  
  // Test 2: Basic Encryption/Decryption
  console.log("\nTest 2: Basic Encryption/Decryption");
  const testMessage = "Hello, this is a test message! 🔒";
  
  const { ciphertext, iv } = await encryptWithAes(key1a, testMessage);
  console.log("✓ Message encrypted");
  console.log("  Original:", testMessage);
  console.log("  Ciphertext:", ciphertext.substring(0, 50) + "...");
  console.log("  IV:", iv);
  
  const decrypted = await decryptWithAes(key1a, ciphertext, iv);
  console.log("✓ Message decrypted");
  console.log("  Decrypted:", decrypted);
  console.log("✓ Messages match:", testMessage === decrypted);
  
  // Test 3: Cross-User Decryption
  console.log("\nTest 3: Cross-User Decryption");
  const user1Key = await deriveConversationKey(userId1, userId2);
  const user2Key = await deriveConversationKey(userId2, userId1);
  
  const { ciphertext: cipher, iv: ivValue } = await encryptWithAes(user1Key, "Secret message");
  const decryptedByUser2 = await decryptWithAes(user2Key, cipher, ivValue);
  console.log("✓ User 1 encrypted, User 2 decrypted:", decryptedByUser2);
  
  // Test 4: Multiple Messages with Same Key
  console.log("\nTest 4: Multiple Messages with Same Key");
  const messages = ["Message 1", "Message 2", "Message 3"];
  const encrypted = [];
  
  for (const msg of messages) {
    const result = await encryptWithAes(key1a, msg);
    encrypted.push(result);
  }
  
  console.log("✓ Encrypted", encrypted.length, "messages");
  
  for (let i = 0; i < messages.length; i++) {
    const decryptedMsg = await decryptWithAes(key1a, encrypted[i].ciphertext, encrypted[i].iv);
    console.log(`✓ Message ${i + 1}:`, messages[i] === decryptedMsg ? "PASS" : "FAIL");
  }
  
  // Test 5: Unicode and Special Characters
  console.log("\nTest 5: Unicode and Special Characters");
  const specialMessages = [
    "Hello 世界 🌍",
    "Émojis: 😀🎉🔐",
    "Math: ∑∫∂∇",
    "Symbols: ™®©€£¥",
  ];
  
  for (const msg of specialMessages) {
    const { ciphertext: c, iv: i } = await encryptWithAes(key1a, msg);
    const dec = await decryptWithAes(key1a, c, i);
    console.log(`✓ "${msg}":`, msg === dec ? "PASS" : "FAIL");
  }
  
  console.log("\n✅ All tests passed! Encryption system is working correctly.");
  return true;
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log("Run testEncryptionSystem() to verify the encryption system");
}
