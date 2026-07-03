import * as notesService from './notes.service.js';
import { validateUpsertNote } from './notes.validation.js';
import { success, error } from '../../utils/apiResponse.js';

async function upsert(req, res) {
    const errors = validateUpsertNote(req.body, req.file);
    if (errors.length) return error(res, 'Validasi gagal', 422, errors);

    try {
        const note = await notesService.upsertNote(req.userId, req.params.roomId, req.body, req.file);
        return success(res, note, 'Note berhasil disimpan');
    } catch (err) {
        return error(res, err.message, err.statusCode || 500);
    }
}

async function list(req, res) {
    try {
        const notes = await notesService.getRoomNotes(req.userId, req.params.roomId);
        return success(res, notes);
    } catch (err) {
        return error(res, err.message, err.statusCode || 500);
    }
}

async function remove(req, res) {
    try {
        const result = await notesService.deleteNote(req.userId, req.params.roomId);
        return success(res, result);
    } catch (err) {
        return error(res, err.message, err.statusCode || 500);
    }
}

export { upsert, list, remove };