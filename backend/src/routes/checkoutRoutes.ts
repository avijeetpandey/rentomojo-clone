import { Router } from 'express';
import { checkoutController } from '../controllers/checkoutController';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();
router.use(requireAuth);

router.post('/kyc', checkoutController.submitKyc);
router.post('/orders', checkoutController.createOrder);
router.get('/orders', checkoutController.listOrders);
router.get('/orders/:id', checkoutController.getOrder);

export default router;
