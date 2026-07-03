import * as roomsService from './rooms.service.js';
import { validateCreateRoom, validateJoinRoom } from './rooms.validation.js';
import { success, error } from '../../utils/apiResponse.js';

async function create(req, res) {
    const errors = validateCreateRoom(req.body);
    if (errors.length) return error(res, 'Validasi gagal', 422, errors);

    try {
        const room = await roomsService.createRoom(req.userId, req.body);
        return success(res, room, 'Room berhasil dibuat', 201);
    } catch (err) {
        return error(res, err.message, err.statusCode || 500);
    }
}

async function join(req, res) {
    const errors = validateJoinRoom(req.body);
    if (errors.length) return error(res, 'Validasi gagal', 422, errors);

    try {
        const request = await roomsService.requestJoinRoom(req.userId, req.body);
        return success(res, request, 'Permintaan bergabung terkirim, menunggu approval owner', 201);
    } catch (err) {
        return error(res, err.message, err.statusCode || 500);
    }
}

async function pendingRequests(req, res) {
    try {
        const requests = await roomsService.listPendingRequests(req.userId, req.params.roomId);
        return success(res, requests);
    } catch (err) {
        return error(res, err.message, err.statusCode || 500);
    }
}

async function respondRequest(req, res) {
    const { action } = req.body;
    try {
        const result = await roomsService.respondJoinRequest(req.userId, req.params.requestId, action);
        return success(res, result, `Permintaan berhasil di-${action === 'approve' ? 'setujui' : 'tolak'}`);
    } catch (err) {
        return error(res, err.message, err.statusCode || 500);
    }
}

async function leave(req, res) {
    try {
        const result = await roomsService.leaveRoom(req.userId, req.params.roomId);
        return success(res, result);
    } catch (err) {
        return error(res, err.message, err.statusCode || 500);
    }
}

async function listMine(req, res) {
    try {
        const rooms = await roomsService.listMyRooms(req.userId);
        return success(res, rooms);
    } catch (err) {
        return error(res, err.message, err.statusCode || 500);
    }
}

async function detail(req, res) {
    try {
        const room = await roomsService.getRoomDetail(req.userId, req.params.roomId);
        return success(res, room);
    } catch (err) {
        return error(res, err.message, err.statusCode || 500);
    }
}

export { create, join, pendingRequests, respondRequest, leave, listMine, detail };