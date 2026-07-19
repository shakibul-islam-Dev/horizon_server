const { Router } = require('express');
const controller = require('../controllers/cartController');

function wrap(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, req.params, req.body, req.currentUser)).catch(next);
  };
}

const router = Router();

router.get('/carts', wrap(controller.getCart));
router.post('/carts/add', wrap(controller.addToCart));
router.put('/carts/update', wrap(controller.updateCart));
router.delete('/carts/remove/:itemId', wrap(controller.removeFromCart));
router.delete('/carts/clear', wrap(controller.clearCart));
router.get('/carts/total', wrap(controller.getCartTotal));

router.get('/wishlists', wrap(controller.getWishlist));
router.post('/wishlists', wrap(controller.addToWishlist));
router.delete('/wishlists/:itemId', wrap(controller.removeFromWishlist));
router.get('/wishlists/check/:itemId', wrap(controller.checkWishlist));
router.delete('/wishlists', wrap(controller.clearWishlist));

module.exports = router;
