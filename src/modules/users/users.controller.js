import * as usersService from './users.service.js';
import { success, error } from '../../utils/apiResponse.js';

async function me(req, res) {
    try {
        const user = await usersService.getMe(req.userId);
        return success(res, user);
    } catch (err) {
        return error(res, err.message, err.statusCode || 500);
    }
}

async function avatar(req, res) {
    try {
        const user = await usersService.updateAvatar(req.userId, req.file);
        return success(res, user, 'Foto profil berhasil diperbarui');
    } catch (err) {
        return error(res, err.message, err.statusCode || 500);
    }
}

export { me, avatar };