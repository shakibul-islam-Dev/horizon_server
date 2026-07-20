const { Router } = require('express');
const controller = require('../controllers/userController');

function wrap(fn: any) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, req.params, req.body, req.currentUser)).catch(next);
  };
}

const router = Router();
router.get('/users', wrap(controller.getAll));
router.get('/users/me', wrap(controller.getMe));
router.put('/users/me', wrap(controller.updateMe));
router.get('/users/:id', wrap(controller.getById));
module.exports = router;
