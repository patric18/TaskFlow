import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validate.js';
import { updateUserSchema } from '../validators/project.js';

const router = Router();

router.use(authMiddleware);

router.get('/me', userController.getMe);
router.patch('/me', validateBody(updateUserSchema), userController.updateMe);
router.post('/me/complete-onboarding', userController.completeOnboarding);

export default router;
