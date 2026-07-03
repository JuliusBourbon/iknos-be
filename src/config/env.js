import 'dotenv/config';

const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

requiredEnv.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
});

export default {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    room: {
        codeLength: parseInt(process.env.ROOM_CODE_LENGTH || '6', 10),
        maxRoomPerUser: parseInt(process.env.MAX_ROOM_PER_USER || '5', 10),
        maxMemberPerRoom: parseInt(process.env.MAX_MEMBER_PER_ROOM || '10', 10),
        emptyGracePeriodMin: parseInt(process.env.ROOM_EMPTY_GRACE_PERIOD_MIN || '30', 10),
    },
    location: {
        updateIntervalSec: parseInt(process.env.LOCATION_UPDATE_INTERVAL_SEC || '10', 10),
    },
};