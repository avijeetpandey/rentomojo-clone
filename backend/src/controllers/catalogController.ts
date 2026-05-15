import type { Request, Response } from 'express';
import { catalogService, pricingQuerySchema, productListQuerySchema } from '../services/catalogService';

export const catalogController = {
  async listCategories(_req: Request, res: Response) {
    const items = await catalogService.listCategories();
    res.json({ items });
  },

  async listProducts(req: Request, res: Response) {
    const q = productListQuerySchema.parse(req.query);
    const result = await catalogService.listProducts({
      city: q.city,
      categorySlug: q.category,
      search: q.search,
      take: q.take,
      skip: q.skip,
    });
    res.json(result);
  },

  async getProduct(req: Request, res: Response) {
    const product = await catalogService.getProduct(String(req.params.slug));
    res.json({ product });
  },

  async getPricing(req: Request, res: Response) {
    const q = pricingQuerySchema.parse(req.query);
    const pricing = await catalogService.getPricing(String(req.params.slug), q.tenure, q.quantity);
    res.json({ pricing });
  },
};
