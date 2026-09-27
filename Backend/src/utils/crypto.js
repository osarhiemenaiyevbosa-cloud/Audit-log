const crypto = require('crypto');

function getKey() {
    const raw = process.env.WHISTLEBLOWER_ENCRYPTION_KEY || '';
    if (!raw) throw new Error('WHISTLEBLOWER_ENCRYPTION_KEY is missing');
    return Buffer.from(raw, 'hex');
}
function encrypt(text) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}
function decrypt(value) {
    const [ivHex, tagHex, encryptedHex] = value.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8');
}
module.exports = { encrypt, decrypt };