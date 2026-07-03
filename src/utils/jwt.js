import jwt from 'jsonwebtoken';
import env from '../config/env.js';

function signToken(payload) {
    return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function verifyToken(token) {
    return jwt.verify(token, env.jwtSecret);
}

export { signToken, verifyToken };