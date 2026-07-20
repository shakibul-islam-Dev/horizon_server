import { Router, Request, Response, NextFunction } from "express";
import * as controller from "../controllers/cartController";
// What is this
function wrap(
  fn: (
    req: Request,
    res: Response,
    params: any,
    body: any,
    user: any,
  ) => Promise<any> | any,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(
      fn(req, res, req.params, req.body, (req as any).currentUser),
    ).catch(next);
  };
}

const router = Router();

router.get("/carts", wrap(controller.getCart));
router.post("/carts/add", wrap(controller.addToCart));
router.put("/carts/update", wrap(controller.updateCart));
router.delete("/carts/remove/:itemId", wrap(controller.removeFromCart));
router.delete("/carts/clear", wrap(controller.clearCart));
router.get("/carts/total", wrap(controller.getCartTotal));

router.get("/wishlists", wrap(controller.getWishlist));
router.post("/wishlists", wrap(controller.addToWishlist));
router.delete("/wishlists/:itemId", wrap(controller.removeFromWishlist));
router.get("/wishlists/check/:itemId", wrap(controller.checkWishlist));
router.delete("/wishlists", wrap(controller.clearWishlist));

export default router;
