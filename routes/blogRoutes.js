const { Router } = require('express');
const controller = require('../controllers/blogController');

function wrap(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, req.params, req.body, req.currentUser)).catch(next);
  };
}

const router = Router();

router.get('/blogposts', wrap(controller.getBlogPosts));
router.get('/blogposts/my', wrap(controller.getMyPosts));
router.post('/blogposts', wrap(controller.createBlogPost));
router.get('/blogposts/slug/:slug', wrap(controller.getBlogPostBySlug));
router.get('/blogposts/:id', wrap(controller.getBlogPostById));
router.put('/blogposts/:id', wrap(controller.updateBlogPost));
router.delete('/blogposts/:id', wrap(controller.deleteBlogPost));
router.post('/blogposts/:id/like', wrap(controller.likeBlogPost));

router.get('/comments/item/:itemId', wrap(controller.getCommentsByItem));
router.get('/comments/blog/:blogPostId', wrap(controller.getCommentsByBlog));
router.post('/comments', wrap(controller.createComment));
router.put('/comments/:id', wrap(controller.updateComment));
router.delete('/comments/:id', wrap(controller.deleteComment));
router.post('/comments/:id/like', wrap(controller.toggleCommentLike));

module.exports = router;
