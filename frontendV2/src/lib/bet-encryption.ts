/**
 * Bet direction encryption using NaCl box (ECDH + XSalsa20-Poly1305).
 *
 * Only the oracle can decrypt — it holds the matching secret key.
 * The frontend only ever sees the oracle's public key (safe to expose).
 *
 * Wire format written to the chain:
 *   [0..31]  ephemeral Curve25519 public key  (32 bytes)
 *   [32..55] nonce                             (24 bytes)
 *   [56..]   ciphertext                        (variable)
 */

import nacl from "tweetnacl";
import { encodeBase64, decodeBase64 } from "tweetnacl-util";

export { encodeBase64, decodeBase64 };

/**
 * Encrypt a bet direction ("YES" | "NO") for the oracle.
 * Returns a 0x-prefixed hex string ready for `placeBet(encryptedCommitment, ...)`.
 */
export function encryptBetDirection(
  direction: "YES" | "NO",
  oraclePublicKeyB64: string,
): `0x${string}` {
  const oraclePublicKey = decodeBase64(oraclePublicKeyB64);
  const ephemeral = nacl.box.keyPair();
  const nonce     = nacl.randomBytes(nacl.box.nonceLength);   // 24 bytes
  const message   = new TextEncoder().encode(direction);

  const ciphertext = nacl.box(message, nonce, oraclePublicKey, ephemeral.secretKey);

  // Pack: ephemeralPub(32) + nonce(24) + ciphertext
  const packed = new Uint8Array(32 + 24 + ciphertext.length);
  packed.set(ephemeral.publicKey, 0);
  packed.set(nonce, 32);
  packed.set(ciphertext, 56);

  return `0x${Buffer.from(packed).toString("hex")}` as `0x${string}`;
}
