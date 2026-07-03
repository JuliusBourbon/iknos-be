function validateCreateRoom(body) {
    const errors = [];
    if (!body.name || body.name.trim().length < 3) {
        errors.push('Nama Room minimal 3 karakter');
    }
    return errors;
}

function validateJoinRoom(body) {
    const errors = [];
    if (!body.code || body.code.trim().length === 0) {
        errors.push('Kode Room wajib diisi');
    }
    return errors;
}

export { validateCreateRoom, validateJoinRoom };