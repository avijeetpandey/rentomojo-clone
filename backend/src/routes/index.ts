import { Router } from 'express';
import authRoutes from './authRoutes';
import catalogRoutes from './catalogRoutes';
import cartRoutes from './cartRoutes';
import checkoutRoutes from './checkoutRoutes';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    name: 'Rentomojo Clone API',
    version: '0.5.0',
    endpoints: {
      auth: ['POST /api/v1/auth/register', 'POST /api/v1/auth/login', 'GET /api/v1/auth/me'],
      catalog: [
        'GET /api/v1/categories',
        'GET /api/v1/products',
        'GET /api/v1/products/:slug',
        'GET /api/v1/products/:slug/pricing',
      ],
      cart: [
        'GET /api/v1/cart',
        'POST /api/v1/cart/items',
        'PATCH /api/v1/cart/items/:itemId',
        'DELETE /api/v1/cart/items/:itemId',
        'DELETE /api/v1/cart',
      ],
      checkout: [
        'POST /api/v1/checkout/kyc',
        'POST /api/v1/checkout/orders',
        'GET /api/v1/checkout/orders',
        'GET /api/v1/checkout/orders/:id',
      ],
    },
  });
});

router.use('/auth', authRoutes);
router.use('/', catalogRoutes);
router.use('/cart', cartRoutes);
router.use('/checkout', checkoutRoutes);

export default router;
