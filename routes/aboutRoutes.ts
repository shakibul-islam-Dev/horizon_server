const { Router } = require('express');
const controller = require('../controllers/aboutController');

function wrap(fn: any) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, req.params, req.body, req.currentUser)).catch(next);
  };
}

const router = Router();

router.get('/abouts', wrap(controller.get));
router.put('/abouts', wrap(controller.update));

module.exports = router;
