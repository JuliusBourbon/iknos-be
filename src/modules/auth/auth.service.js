import prisma from '../../config/db.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { signToken } from '../../utils/jwt.js';

async function register({ username, email, password }) {
    const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
    });
    if (existing) {
        const field = existing.email === email ? 'Email' : 'Username';
        throw { statusCode: 409, message: `${field} sudah digunakan` };
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
        data: { username, email, passwordHash },
        select: { id: true, username: true, email: true, createdAt: true },
    });

    const token = signToken({ userId: user.id });
    return { user, token };
}

async function login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw { statusCode: 401, message: 'Email atau password salah' };

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) throw { statusCode: 401, message: 'Email atau password salah' };

    const token = signToken({ userId: user.id });
    return {
        user: { id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl },
        token,
    };
}

export { register, login };