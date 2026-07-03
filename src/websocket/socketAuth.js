import { verifyToken } from '../utils/jwt.js';

function socketAuthMiddleware(socket, next) {
    const token = socket.handshake.auth?.token;

    if (!token) {
        return next(new Error('Token tidak ditemukan'));
    }

    try {
        const decoded = verifyToken(token);
        socket.userId = decoded.userId;
        next();
    } catch (err) {
        next(new Error('Token tidak valid atau kedaluwarsa'));
    }
}

export default socketAuthMiddleware;