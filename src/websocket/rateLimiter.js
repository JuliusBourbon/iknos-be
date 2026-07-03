import env from '../config/env.js';

// In-memory store: key = `${userId}:${roomId}`, value = timestamp update terakhir
const lastUpdateMap = new Map();

function canUpdateLocation(userId, roomId) {
    const key = `${userId}:${roomId}`;
    const now = Date.now();
    const lastUpdate = lastUpdateMap.get(key);
    const minIntervalMs = env.location.updateIntervalSec * 1000;

    if (lastUpdate && now - lastUpdate < minIntervalMs) {
        return false;
    }

    lastUpdateMap.set(key, now);
    return true;
}

// Bersihkan entry lama secara berkala supaya Map tidak membengkak
function cleanupStaleEntries() {
    const now = Date.now();
    // 10x interval
    const staleThreshold = env.location.updateIntervalSec * 1000 * 10;

    for (const [key, timestamp] of lastUpdateMap.entries()) {
        if (now - timestamp > staleThreshold) {
            lastUpdateMap.delete(key);
        }
    }
}

// cleanup tiap 1 menit
setInterval(cleanupStaleEntries, 60_000);

export { canUpdateLocation };