import type { Request, Response } from 'express';
import { addItemSchema, cartService, updateItemSchema } from '../services/cartService';
import { HttpError } from '../utils/httpError';

function userId(req: Request): string {
  if (!req.user) throw HttpError.unauthorized();
  return req.user.sub;
}

export const cartController = {
  async get(req: Request, res: Response) {
    const cart = await cartService.getCart(userId(req));
    res.json({ cart });
  },

  async add(req: Request, res: Response) {
    const body = addItemSchema.parse(req.body);
    const cart = await cartService.addItem(userId(req), body);
    res.status(201).json({ cart });
  },

  async update(req: Request, res: Response) {
    const body = updateItemSchema.parse(req.body);
    const cart = await cartService.updateItem(userId(req), String(req.params.itemId), body);
    res.json({ cart });
  },

  async remove(req: Request, res: Response) {
    const cart = await cartService.removeItem(userId(req), String(req.params.itemId));
    res.json({ cart });
  },

  async clear(req: Request, res: Response) {
    const cart = await cartService.clearCart(userId(req));
    res.json({ cart });
  },
};
