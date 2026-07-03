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

export { updateAvatar, getMe };