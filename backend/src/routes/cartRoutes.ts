import { Router } from 'express';
import { cartController } from '../controllers/cartController';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

router.get('/', cartController.get);
router.post('/items', cartController.add);
router.patch('/items/:itemId', cartController.update);
router.delete('/items/:itemId', cartController.remove);
router.delete('/', cartController.clear);

export default router;
