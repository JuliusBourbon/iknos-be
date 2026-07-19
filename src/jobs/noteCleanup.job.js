import cron from 'node-cron';
import prisma from '../config/db.js';

async function cleanupExpiredNotes() {
    try {
        const result = await prisma.instaNote.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });

        if (result.count > 0) {
            console.log(`[NoteCleanup] Berhasil menghapus ${result.count} note yang sudah kedaluwarsa`);
        } else {
            console.log('[NoteCleanup] Tidak ada note yang perlu dihapus');
        }
    } catch (err) {
        console.error('[NoteCleanup] Gagal menjalankan cleanup:', err.message);
    }
}

function startNoteCleanupJob() {
    // Jalankan setiap 30 menit
    cron.schedule('*/30 * * * *', () => {
        console.log('[NoteCleanup] Menjalankan pengecekan note kadaluwarsa...');
        cleanupExpiredNotes();
    });

    // Jalankan sekali saat server startup untuk membersihkan note lama yang mungkin tertinggal
    cleanupExpiredNotes();

    console.log('[NoteCleanup] Job terjadwal setiap 30 menit');
}

export { startNoteCleanupJob, cleanupExpiredNotes };
