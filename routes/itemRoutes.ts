import { Router, Request, Response, NextFunction } from 'express';
import * as controller from '../controllers/itemController';

function wrap(fn: (req: Request, res: Response, params: any, body: any, user: any) => Promise<any> | any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, req.params, req.body, (req as any).currentUser)).catch(next);
  };
}

const router = Router();

router.get('/items', wrap(controller.getItems));
router.get('/items/my', wrap(controller.getMyItems));
router.get('/items/tags', wrap(controller.getTags));
router.post('/items', wrap(controller.createItem));
router.get('/items/:id', wrap(controller.getItemById));
router.put('/items/:id', wrap(controller.updateItem));
router.delete('/items/:id', wrap(controller.deleteItem));

router.get('/reviews', wrap(controller.getReviews));
router.get('/reviews/my', wrap(controller.getMyReviews));
router.get('/reviews/item/:itemId', wrap(controller.getReviewsByItem));
router.get('/reviews/stats/:itemId', wrap(controller.getReviewStats));
router.get('/reviews/user/:userId', wrap(controller.getReviewsByUser));
router.post('/reviews', wrap(controller.createReview));
router.put('/reviews/:id', wrap(controller.updateReview));
router.delete('/reviews/:id', wrap(controller.deleteReview));

export default router;

