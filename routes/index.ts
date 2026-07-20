import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../helpers/response';
import userRoutes from './userRoutes';
import itemRoutes from './itemRoutes';
import blogRoutes from './blogRoutes';
import paymentRoutes from './paymentRoutes';
import cartRoutes from './cartRoutes';
import categoryRoutes from './categoryRoutes';
import aboutRoutes from './aboutRoutes';
import aiRoutes from './aiRoutes';

function wrap(fn: (req: Request, res: Response, params: any, body: any, user: any) => Promise<any> | any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, req.params, req.body, (req as any).currentUser)).catch(next);
  };
}

const router = Router();

router.get('/health', wrap((req: Request, res: Response) => {
  sendSuccess(res, 'Server is running', {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
}));

router.use(userRoutes);
router.use(itemRoutes);
router.use(blogRoutes);
router.use(paymentRoutes);
router.use(cartRoutes);
router.use(categoryRoutes);
router.use(aboutRoutes);
router.use(aiRoutes);

export default router;

