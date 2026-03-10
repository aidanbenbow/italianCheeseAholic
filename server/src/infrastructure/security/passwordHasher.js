import crypto from "crypto";

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
    const [salt, storedKey] = stored.split(":");

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
