import { createHash } from "node:crypto";

if (!globalThis.crypto) {
  globalThis.crypto = {};
}

if (typeof globalThis.crypto.hash !== "function") {
  globalThis.crypto.hash = async (algorithm, data) => {
    const buffer = data instanceof ArrayBuffer ? Buffer.from(data) : Buffer.from(new Uint8Array(data));
    return createHash(algorithm).update(buffer).digest();
  };
}
