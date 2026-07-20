import { Router, Request, Response, NextFunction } from 'express';
import * as controller from '../controllers/userController';

function wrap(fn: (req: Request, res: Response, params: any, body: any, user: any) => Promise<any> | any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, req.params, req.body, (req as any).currentUser)).catch(next);
  };
}

const router = Router();
router.get('/users', wrap(controller.getAll));
router.get('/users/me', wrap(controller.getMe));
router.put('/users/me', wrap(controller.updateMe));
router.get('/users/:id', wrap(controller.getById));
export default router;

