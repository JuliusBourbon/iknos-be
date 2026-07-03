import { verifyToken } from '../utils/jwt.js';
import { error } from '../utils/apiResponse.js';

export default function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return error(res, 'Token tidak ditemukan', 401);
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = verifyToken(token);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return error(res, 'Token tidak valid atau kedaluwarsa', 401);
    }
}