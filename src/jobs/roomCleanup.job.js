import cron from 'node-cron';
import prisma from '../config/db.js';
import env from '../config/env.js';

async function cleanupEmptyRooms() {
    const gracePeriodMs = env.room.emptyGracePeriodMin * 60 * 1000;
    const threshold = new Date(Date.now() - gracePeriodMs);

    try {
        const roomsToDelete = await prisma.room.findMany({
            where: {
                emptiedAt: { not: null, lt: threshold },
            },
            select: { id: true, name: true, emptiedAt: true },
        });

        if (roomsToDelete.length === 0) {
            console.log('[RoomCleanup] Tidak ada Room yang perlu dihapus');
            return;
        }

        const stillEmptyRoomIds = [];
        for (const room of roomsToDelete) {
            const memberCount = await prisma.roomMember.count({ where: { roomId: room.id } });
            if (memberCount === 0) stillEmptyRoomIds.push(room.id);
        }

        if (stillEmptyRoomIds.length === 0) {
            console.log('[RoomCleanup] Semua kandidat Room sudah terisi kembali, tidak jadi dihapus');
            return;
        }

        const result = await prisma.room.deleteMany({
            where: { id: { in: stillEmptyRoomIds } },
        });

        console.log(`[RoomCleanup] Berhasil menghapus ${result.count} Room kosong:`, stillEmptyRoomIds);
    } catch (err) {
        console.error('[RoomCleanup] Gagal menjalankan cleanup:', err.message);
    }
}

function startRoomCleanupJob() {
    cron.schedule('*/5 * * * *', () => {
        console.log('[RoomCleanup] Menjalankan pengecekan Room kosong...');
        cleanupEmptyRooms();
    });

    console.log('[RoomCleanup] Job terjadwal setiap 5 menit');
}

export { startRoomCleanupJob, cleanupEmptyRooms };