function validateUpsertNote(body = {}, file) {
    const errors = [];
    const hasText = body && body.text && body.text.trim().length > 0;
    const hasImage = !!file;

    if (!hasText && !hasImage) {
        errors.push('Note harus berisi teks atau gambar (minimal salah satu)');
    }
    if (body.text && body.text.length > 280) {
        errors.push('Teks maksimal 280 karakter');
    }

    return errors;
}

export { validateUpsertNote };