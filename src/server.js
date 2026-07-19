import http from 'http';
import app from './app.js';
import env from './config/env.js';
import { initSocket } from './websocket/index.js';
import { startRoomCleanupJob } from './jobs/roomCleanup.job.js';
import { startNoteCleanupJob } from './jobs/noteCleanup.job.js';

const server = http.createServer(app);
initSocket(server);
startRoomCleanupJob();
startNoteCleanupJob();

server.listen(env.port, () => {
    console.log(`Iknos backend running on port ${env.port}`);
});