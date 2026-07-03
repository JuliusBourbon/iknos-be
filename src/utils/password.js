import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async function hashPassword(plain) {
    return bcrypt.hash(plain, SALT_ROUNDS);
}

async function comparePassword(plain, hash) {
    return bcrypt.compare(plain, hash);
}

export { hashPassword, comparePassword };