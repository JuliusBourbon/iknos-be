function validateRegister(body) {
    const errors = [];
    if (!body.username || body.username.trim().length < 3) {
        errors.push('Username minimal 3 karakter');
    }
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        errors.push('Email tidak valid');
    }
    if (!body.password || body.password.length < 6) {
        errors.push('Password minimal 6 karakter');
    }
    return errors;
}

function validateLogin(body) {
    const errors = [];
    if (!body.email) errors.push('Email wajib diisi');
    if (!body.password) errors.push('Password wajib diisi');
    return errors;
}

export { validateRegister, validateLogin };