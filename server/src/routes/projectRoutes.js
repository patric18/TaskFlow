import { Router } from 'express';
import * as projectController from '../controllers/projectController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  createProjectSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from '../validators/project.js';

const router = Router();

router.use(authMiddleware);

router.get('/', validateQuery(listProjectsQuerySchema), projectController.listProjects);
router.post('/', validateBody(createProjectSchema), projectController.createProject);
router.get('/:id', projectController.getProject);
router.patch('/:id', validateBody(updateProjectSchema), projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

export default router;
