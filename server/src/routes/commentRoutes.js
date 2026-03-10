import { Router } from 'express';
import * as commentController from '../controllers/commentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.delete('/:id', commentController.deleteComment);

export default router;
