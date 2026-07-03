import * as authService from './auth.service.js';
import { validateRegister, validateLogin } from './auth.validation.js';
import { success, error } from '../../utils/apiResponse.js';

async function register(req, res) {
    const errors = validateRegister(req.body);
    if (errors.length) return error(res, 'Validasi gagal', 422, errors);

    try {
        const result = await authService.register(req.body);
        return success(res, result, 'Registrasi berhasil', 201);
    } catch (err) {
        return error(res, err.message || 'Registrasi gagal', err.statusCode || 500);
    }
}

async function login(req, res) {
    const errors = validateLogin(req.body);
    if (errors.length) return error(res, 'Validasi gagal', 422, errors);

    try {
        const result = await authService.login(req.body);
        return success(res, result, 'Login berhasil');
    } catch (err) {
        return error(res, err.message || 'Login gagal', err.statusCode || 500);
    }
}

export { register, login };