const { Router } = require('express');
const controller = require('../controllers/categoryController');

function wrap(fn: any) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, req.params, req.body, req.currentUser)).catch(next);
  };
}

const router = Router();

router.get('/categories', wrap(controller.getAll));
router.get('/categories/:id', wrap(controller.getById));
router.post('/categories', wrap(controller.create));
router.put('/categories/:id', wrap(controller.update));
router.delete('/categories/:id', wrap(controller.remove));

module.exports = router;
