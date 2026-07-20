import { Router, Request, Response, NextFunction } from 'express';
import * as controller from '../controllers/categoryController';

function wrap(fn: (req: Request, res: Response, params: any, body: any, user: any) => Promise<any> | any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, req.params, req.body, (req as any).currentUser)).catch(next);
  };
}

const router = Router();

router.get('/categories', wrap(controller.getAll));
router.get('/categories/:id', wrap(controller.getById));
router.post('/categories', wrap(controller.create));
router.put('/categories/:id', wrap(controller.update));
router.delete('/categories/:id', wrap(controller.remove));

export default router;

