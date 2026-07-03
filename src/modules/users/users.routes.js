import express from 'express';
import * as controller from './users.controller.js';
import authMiddleware from '../../middlewares/authMiddleware.js';
import upload from '../../middlewares/upload.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/me', controller.me);
router.put('/me/avatar', upload.single('avatar'), controller.avatar);

export default router;