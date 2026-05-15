import type { Request, Response } from 'express';
import { createOrderSchema, orderService } from '../services/orderService';
import { kycService, kycSubmitSchema } from '../services/kycService';
import { HttpError } from '../utils/httpError';

function userId(req: Request): string {
  if (!req.user) throw HttpError.unauthorized();
  return req.user.sub;
}

export const checkoutController = {
  async submitKyc(req: Request, res: Response) {
    const body = kycSubmitSchema.parse(req.body);
    const result = await kycService.submit(userId(req), body);
    res.status(200).json(result);
  },

  async createOrder(req: Request, res: Response) {
    const body = createOrderSchema.parse(req.body);
    const order = await orderService.create(userId(req), body);
    res.status(201).json({ order });
  },

  async listOrders(req: Request, res: Response) {
    const orders = await orderService.listForUser(userId(req));
    res.json({ orders });
  },

  async getOrder(req: Request, res: Response) {
    const order = await orderService.getForUser(userId(req), String(req.params.id));
    res.json({ order });
  },
};
