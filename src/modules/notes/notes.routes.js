import express from 'express';
import * as controller from './notes.controller.js';
import authMiddleware from '../../middlewares/authMiddleware.js';
import upload from '../../middlewares/upload.js';

const router = express.Router();

router.use(authMiddleware);

router.put('/:roomId', upload.single('image'), controller.upsert);
router.get('/:roomId', controller.list);
router.delete('/:roomId', controller.remove);

export default router;