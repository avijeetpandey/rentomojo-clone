import type { Request, Response } from 'express';
import { authService, loginSchema, registerSchema } from '../services/authService';
import { HttpError } from '../utils/httpError';

export const authController = {
  async register(req: Request, res: Response) {
    const parsed = registerSchema.parse(req.body);
    const result = await authService.register(parsed);
    res.status(201).json(result);
  },

  async login(req: Request, res: Response) {
    const parsed = loginSchema.parse(req.body);
    const result = await authService.login(parsed);
    res.json(result);
  },

  async me(req: Request, res: Response) {
    if (!req.user) throw HttpError.unauthorized();
    const user = await authService.getProfile(req.user.sub);
    res.json({ user });
  },
};
