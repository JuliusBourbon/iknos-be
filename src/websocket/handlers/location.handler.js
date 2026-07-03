import prisma from '../../config/db.js';
import { canUpdateLocation } from '../rateLimiter.js';

function registerLocationHandlers(io, socket) {
    socket.on('location_update', async ({ roomId, lat, lng }, callback) => {
        try {
            if (typeof lat !== 'number' || typeof lng !== 'number') {
                return callback?.({ success: false, message: 'Koordinat tidak valid' });
            }

            const member = await prisma.roomMember.findUnique({
                where: { roomId_userId: { roomId, userId: socket.userId } },
            });

            if (!member) {
                return callback?.({ success: false, message: 'Kamu bukan anggota Room ini' });
            }

            if (!canUpdateLocation(socket.userId, roomId)) {
                return callback?.({ success: false, message: 'Update terlalu cepat, tunggu interval berikutnya' });
            }

            const now = new Date();

            await prisma.roomMember.update({
                where: { id: member.id },
                data: { lastLat: lat, lastLng: lng, lastUpdate: now },
            });

            callback?.({ success: true });

            // Jika user  hide, jangan broadcast posisinya ke member lain
            if (member.isHidden) return;

            socket.to(roomId).emit('location_broadcast', {
                userId: socket.userId,
                roomId,
                lat,
                lng,
                timestamp: now,
            });
        } catch (err) {
            callback?.({ success: false, message: 'Gagal update lokasi' });
        }
    });
}

export { registerLocationHandlers };