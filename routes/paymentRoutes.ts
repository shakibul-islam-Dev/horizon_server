import { Router, Request, Response, NextFunction } from 'express';
import * as controller from '../controllers/paymentController';

function wrap(fn: (req: Request, res: Response, params: any, body: any, user: any) => Promise<any> | any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, req.params, req.body, (req as any).currentUser)).catch(next);
  };
}

const router = Router();

router.get('/payments/config', wrap(controller.getConfig));
router.post('/payments/create-payment-intent', wrap(controller.createPaymentIntent));
router.get('/payments/my', wrap(controller.getMyPayments));
router.get('/payments/item/:itemId', wrap(controller.getPaymentsByItem));
router.get('/payments/:id', wrap(controller.getPaymentById));
router.post('/payments', wrap(controller.createPayment));
router.patch('/payments/:id/status', wrap(controller.updatePaymentStatus));
router.post('/payments/webhook', wrap(controller.webhook));

router.get('/transactions/buyer', wrap(controller.getBuyerTransactions));
router.get('/transactions/seller', wrap(controller.getSellerTransactions));
router.get('/transactions/:id', wrap(controller.getTransactionById));
router.post('/transactions', wrap(controller.createTransaction));
router.patch('/transactions/:id/status', wrap(controller.updateTransactionStatus));

export default router;

