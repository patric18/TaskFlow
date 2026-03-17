import { Router } from 'express';
import * as billingController from '../controllers/billingController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validate.js';
import { billingOrganizationSchema } from '../validators/billing.js';

const router = Router();

router.get('/plans', billingController.getPlans);

router.use(authMiddleware);

router.post('/checkout', validateBody(billingOrganizationSchema), billingController.createCheckout);
router.post('/portal', validateBody(billingOrganizationSchema), billingController.createPortal);
router.post('/dev-upgrade', validateBody(billingOrganizationSchema), billingController.devUpgrade);
router.post('/dev-downgrade', validateBody(billingOrganizationSchema), billingController.devDowngrade);

export default router;
