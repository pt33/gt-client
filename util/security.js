var crypto = require('crypto')

const SALT_PREFIX = '_SALT_';
const SALT_SUFFIX = 'I(C#A!R*E/';

exports.encryptWithSalt = function(salt, words, digest='sha1') {
    const fixSalt = new Buffer(SALT_PREFIX + salt + SALT_SUFFIX, 'base64');
    return crypto.pbkdf2Sync(words, fixSalt, 10000, 64, digest).toString('base64');
}
