import prisma from '../../config/db.js';
import { uploadBufferToCloudinary } from '../../utils/cloudinaryUpload.js';

async function updateAvatar(userId, file) {
    if (!file) throw { statusCode: 422, message: 'File gambar wajib diunggah' };

    const result = await uploadBufferToCloudinary(file.buffer, 'iknos/avatars');

    const user = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: result.secure_url },
        select: { id: true, username: true, email: true, avatarUrl: true },
    });

    return user;
}

async function getMe(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, email: true, avatarUrl: true, createdAt: true },
    });
    if (!user) throw { statusCode: 404, message: 'User tidak ditemukan' };
    return user;
}

async function updateUsername(userId, username) {
    if (!username || username.trim().length === 0) {
        throw { statusCode: 422, message: 'Username tidak boleh kosong' };
    }
    if (username.trim().length < 3) {
        throw { statusCode: 422, message: 'Username minimal 3 karakter' };
    }

    // Cek apakah username sudah dipakai oleh user lain
    const existing = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (existing && existing.id !== userId) {
        throw { statusCode: 409, message: 'Username sudah digunakan' };
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data: { username: username.trim() },
        select: { id: true, username: true, email: true, avatarUrl: true },
    });

    return user;
}

export { updateAvatar, getMe, updateUsername };