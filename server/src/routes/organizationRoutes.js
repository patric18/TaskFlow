import { Router } from 'express';
import * as organizationController from '../controllers/organizationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validate.js';
import {
  inviteMemberSchema,
  updateMemberRoleSchema,
  updateOrganizationSchema,
} from '../validators/organization.js';

const router = Router();

router.use(authMiddleware);

router.get('/', organizationController.listOrganizations);
router.get('/:id/members', organizationController.listMembers);
router.post(
  '/:id/members/invite',
  validateBody(inviteMemberSchema),
  organizationController.inviteMember,
);
router.patch(
  '/:id/members/:userId',
  validateBody(updateMemberRoleSchema),
  organizationController.updateMemberRole,
);
router.delete('/:id/members/:userId', organizationController.removeMember);
router.patch('/:id', validateBody(updateOrganizationSchema), organizationController.updateOrganization);
router.get('/:id', organizationController.getOrganization);

export default router;
