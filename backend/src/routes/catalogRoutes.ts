import { Router } from 'express';
import { catalogController } from '../controllers/catalogController';

const router = Router();

router.get('/categories', catalogController.listCategories);
router.get('/products', catalogController.listProducts);
router.get('/products/:slug', catalogController.getProduct);
router.get('/products/:slug/pricing', catalogController.getPricing);

export default router;
