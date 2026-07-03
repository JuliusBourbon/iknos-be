import prisma from '../../config/db.js';

function registerRoomHandlers(io, socket) {
    socket.on('join_room', async (payload, callback) => {
        try {
            const { roomId } = payload;

            const member = await prisma.roomMember.findUnique({
                where: { roomId_userId: { roomId, userId: socket.userId } },
            });

            if (!member) {
                return callback?.({ success: false, message: 'Kamu bukan anggota Room ini' });
            }

            socket.join(roomId);

            // Kirim snapshot posisi seluruh member yang belum hidden ke user yang baru join socket
            const allMembers = await prisma.roomMember.findMany({
                where: { roomId, isHidden: false, lastLat: { not: null } },
                include: { user: { select: { id: true, username: true, avatarUrl: true } } },
            });

            const snapshot = allMembers.map((m) => ({
                userId: m.userId,
                username: m.user.username,
                avatarUrl: m.user.avatarUrl,
                lat: m.lastLat,
                lng: m.lastLng,
                lastUpdate: m.lastUpdate,
            }));

            callback?.({ success: true, message: 'Berhasil join room', snapshot });

            // Beri tahu member lain di room bahwa user ini online
            socket.to(roomId).emit('user_online', { userId: socket.userId, roomId });
        } catch (err) {
            callback?.({ success: false, message: 'Gagal join room' });
        }
    });

    socket.on('leave_room', ({ roomId }, callback) => {
        socket.leave(roomId);
        socket.to(roomId).emit('user_offline', { userId: socket.userId, roomId });
        callback?.({ success: true, message: 'Berhasil leave room (socket)' });
    });

    socket.on('toggle_hide', async ({ roomId, isHidden }, callback) => {
        try {
            const member = await prisma.roomMember.findUnique({
                where: { roomId_userId: { roomId, userId: socket.userId } },
            });

            if (!member) {
                return callback?.({ success: false, message: 'Kamu bukan anggota Room ini' });
            }

            await prisma.roomMember.update({
                where: { id: member.id },
                data: { isHidden },
            });

            // Beri tahu member lain di room bahwa user ini hide/unhide
            socket.to(roomId).emit('user_visibility_changed', {
                userId: socket.userId,
                roomId,
                isHidden,
            });

            callback?.({ success: true, message: isHidden ? 'Lokasi disembunyikan' : 'Lokasi ditampilkan kembali' });
        } catch (err) {
            callback?.({ success: false, message: 'Gagal mengubah visibility' });
        }
    });
}

export { registerRoomHandlers };