import { Router } from "express";
import userRoutes from "./user.routes";
import itemRoutes from "./item.routes";
import categoryRoutes from "./category.routes";
import reviewRoutes from "./review.routes";
import aiRoutes from "./ai.routes";
import chatRoutes from "./chat.routes";
import blogPostRoutes from "./blogPost.routes";
import commentRoutes from "./comment.routes";
import paymentRoutes from "./payment.routes";
import transactionRoutes from "./transaction.routes";
import wishlistRoutes from "./wishlist.routes";
import cartRoutes from "./cart.routes";
import aboutRoutes from "./about.routes";

const router = Router();

router.use("/users", userRoutes);
router.use("/items", itemRoutes);
router.use("/categories", categoryRoutes);
router.use("/reviews", reviewRoutes);
router.use("/ai", aiRoutes);
router.use("/ai", chatRoutes);
router.use("/blog-posts", blogPostRoutes);
router.use("/comments", commentRoutes);
router.use("/payments", paymentRoutes);
router.use("/transactions", transactionRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/cart", cartRoutes);
router.use("/about", aboutRoutes);

export default router;
