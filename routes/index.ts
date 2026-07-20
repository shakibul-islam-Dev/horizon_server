const { Router } = require('express');
const { sendSuccess } = require('../helpers/response');

function wrap(fn: any) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, req.params, req.body, req.currentUser)).catch(next);
  };
}

const router = Router();

router.get('/health', wrap((req: any, res: any) => {
  sendSuccess(res, 'Server is running', {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
}));

router.use(require('./userRoutes'));
router.use(require('./itemRoutes'));
router.use(require('./blogRoutes'));
router.use(require('./paymentRoutes'));
router.use(require('./cartRoutes'));
router.use(require('./categoryRoutes'));
router.use(require('./aboutRoutes'));
router.use(require('./aiRoutes'));


module.exports = router;
