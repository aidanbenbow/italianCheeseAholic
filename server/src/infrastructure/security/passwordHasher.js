import crypto from "crypto";
import bcrypt from "bcryptjs";

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

export const passwordHasher = {
  async hash(password) {
    const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");

    const derivedKey = await new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, KEY_LENGTH, (err, key) => {
        if (err) reject(err);
        else resolve(key.toString("hex"));
      });
    });

    return `${salt}:${derivedKey}`;
  },

  async compare(password, stored) {
    if (String(stored ?? "").startsWith("$2")) {
      return bcrypt.compare(password, stored);
    }

    const [salt, storedKey] = stored.split(":");

    if (!salt || !storedKey) {
      return false;
    }

    const derivedKey = await new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, KEY_LENGTH, (err, key) => {
        if (err) reject(err);
        else resolve(key.toString("hex"));
      });
    });

    return crypto.timingSafeEqual(
      Buffer.from(storedKey, "hex"),
      Buffer.from(derivedKey, "hex")
    );
  }
};
