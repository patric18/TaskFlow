import { Router } from 'express';
import * as taskController from '../controllers/taskController.js';
import * as commentController from '../controllers/commentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createCommentSchema } from '../validators/comment.js';
import {
  createTaskSchema,
  listTasksQuerySchema,
  updateTaskPositionSchema,
  updateTaskSchema,
} from '../validators/task.js';

const router = Router();

router.use(authMiddleware);

router.get('/', validateQuery(listTasksQuerySchema), taskController.listTasks);
router.post('/', validateBody(createTaskSchema), taskController.createTask);
router.get('/:id/comments', commentController.listComments);
router.post('/:id/comments', validateBody(createCommentSchema), commentController.createComment);
router.get('/:id', taskController.getTask);
router.patch('/:id', validateBody(updateTaskSchema), taskController.updateTask);
router.patch('/:id/position', validateBody(updateTaskPositionSchema), taskController.updateTaskPosition);
router.delete('/:id', taskController.deleteTask);

export default router;
