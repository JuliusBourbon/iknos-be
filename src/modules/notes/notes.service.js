import prisma from '../../config/db.js';
import { uploadBufferToCloudinary } from '../../utils/cloudinaryUpload.js';

async function upsertNote(userId, roomId, { text } = {}, file) {
    const member = await prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId, userId } },
    });
    if (!member) throw { statusCode: 403, message: 'Kamu bukan anggota Room ini' };

    let imageUrl;
    if (file) {
        const result = await uploadBufferToCloudinary(file.buffer, 'iknos/insta_notes');
        imageUrl = result.secure_url;
    }

    // Note otomatis kedaluwarsa 24 jam setelah dibuat/diperbarui
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const note = await prisma.instaNote.upsert({
        where: { roomId_userId: { roomId, userId } },
        update: {
            text: text ?? null,
            imageUrl: imageUrl ?? null,
            expiresAt,
        },
        create: {
            roomId,
            userId,
            text: text ?? null,
            imageUrl: imageUrl ?? null,
            expiresAt,
        },
    });

    return note;
}

async function getRoomNotes(userId, roomId) {
    const member = await prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId, userId } },
    });
    if (!member) throw { statusCode: 403, message: 'Kamu bukan anggota Room ini' };

    // Hanya kembalikan note yang belum kedaluwarsa
    return prisma.instaNote.findMany({
        where: { roomId, expiresAt: { gt: new Date() } },
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        orderBy: { updatedAt: 'desc' },
    });
}

async function deleteNote(userId, roomId) {
    const note = await prisma.instaNote.findUnique({
        where: { roomId_userId: { roomId, userId } },
    });
    if (!note) throw { statusCode: 404, message: 'Note tidak ditemukan' };

    await prisma.instaNote.delete({ where: { id: note.id } });
    return { message: 'Note berhasil dihapus' };
}

export { upsertNote, getRoomNotes, deleteNote };