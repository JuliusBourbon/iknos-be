import express from 'express';
import * as controller from './rooms.controller.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', controller.create);
router.get('/', controller.listMine);
router.post('/join', controller.join);

router.get('/:roomId', controller.detail);
router.delete('/:roomId/leave', controller.leave);
router.get('/:roomId/requests', controller.pendingRequests);
router.patch('/requests/:requestId', controller.respondRequest);

export default router;