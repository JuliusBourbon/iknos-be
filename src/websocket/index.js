import { Server } from 'socket.io';
import socketAuthMiddleware from './socketAuth.js';
import { registerRoomHandlers } from './handlers/room.handler.js';
import { registerLocationHandlers } from './handlers/location.handler.js';

function initSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: { origin: '*' },
    });

    io.use(socketAuthMiddleware);

    io.on('connection', (socket) => {
        console.log(`Socket connected: userId=${socket.userId}, socketId=${socket.id}`);

        registerRoomHandlers(io, socket);
        registerLocationHandlers(io, socket);

        socket.on('disconnect', () => {
            // Leave room permanen tetap hanya lewat REST endpoint DELETE /api/rooms/:roomId/leave
            console.log(`Socket disconnected: userId=${socket.userId}`);
        });
    });

    return io;
}

export { initSocket };