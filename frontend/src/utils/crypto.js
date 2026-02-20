/**
 * AES-256-GCM Client-Side Encryption
 * 
 * Encrypts the password before it leaves the browser.
 * Network panel will show ciphertext, NEVER the plain password.
 * The backend holds the shared key and decrypts before hashing.
 */

const ENC_KEY_STRING = import.meta.env.VITE_ENCRYPTION_KEY || "12345678901234567890123456789012";

async function getKey() {
  const keyBytes = new TextEncoder().encode(ENC_KEY_STRING.slice(0, 32)); // exactly 32 bytes
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt"]);
}

/**
 * Encrypts a plain-text password using AES-256-GCM.
 * Returns { iv, data, tag } — all base64 encoded.
 */
export async function encryptPassword(plainText) {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const encoded = new TextEncoder().encode(plainText);

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  // AES-GCM appends 16-byte auth tag at the end of ciphertext
  const cipherWithTag = new Uint8Array(encrypted);
  const ciphertext = cipherWithTag.slice(0, cipherWithTag.length - 16);
  const tag = cipherWithTag.slice(cipherWithTag.length - 16);

  return {
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...ciphertext)),
    tag: btoa(String.fromCharCode(...tag)),
  };
}
