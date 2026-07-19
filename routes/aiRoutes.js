const { Router } = require('express');
const controller = require('../controllers/aiController');

function wrap(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, req.params, req.body, req.currentUser)).catch(next);
  };
}

const router = Router();

router.post('/ai/generate-content', wrap(controller.generateContent));
router.post('/ai/regenerate-content', wrap(controller.regenerateContent));
router.post('/ai/classify', wrap(controller.classify));

router.post('/ai/recommendations', wrap(controller.getRecommendations));
router.post('/ai/track-interaction', wrap(controller.trackInteraction));
router.post('/ai/recommend', wrap(controller.recommend));

router.post('/ai/analyze', wrap(controller.analyzeData));
router.get('/ai/analyses', wrap(controller.getAnalyses));
router.get('/ai/analyses/summary', wrap(controller.getAnalysisSummary));
router.get('/ai/analyses/:id', wrap(controller.getAnalysisById));

router.post('/ai/chat', wrap(controller.chat));
router.get('/ai/conversations', wrap(controller.getConversations));
router.get('/ai/conversations/:id', wrap(controller.getConversationById));
router.put('/ai/conversations/:id', wrap(controller.renameConversation));
router.patch('/ai/conversations/:id/status', wrap(controller.updateConversationStatus));
router.delete('/ai/conversations/:id', wrap(controller.deleteConversation));
router.delete('/ai/conversations', wrap(controller.deleteAllConversations));

module.exports = router;
