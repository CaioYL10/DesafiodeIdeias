const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return { salt, hash: Buffer.from(hash).toString('hex') };
}

async function verifyPassword(password, salt, expectedHash) {
  const actualHash = Buffer.from(await scryptAsync(password, salt, KEY_LENGTH));
  const storedHash = Buffer.from(expectedHash, 'hex');

  return storedHash.length === actualHash.length && timingSafeEqual(storedHash, actualHash);
}

module.exports = { hashPassword, verifyPassword };
