import express from 'express';
import { cleanupEmptyRooms } from '../../jobs/roomCleanup.job.js';
import { success } from '../../utils/apiResponse.js';

const router = express.Router();

// Endpoint khusus testing untuk trigger cleanup job secara manual tanpa menunggu cron
router.post('/trigger-room-cleanup', async (req, res) => {
    await cleanupEmptyRooms();
    return success(res, null, 'Room cleanup job berhasil dijalankan manual');
});

export default router;