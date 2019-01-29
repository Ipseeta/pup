const express = require('express'),
router = express.Router(),
FeatureController = require('../controllers/pupfeature.controller');

router.route('/screenshot').post(FeatureController.getScreenshot);
router.route('/content').post(FeatureController.getContent);
router.route('/pdf').post(FeatureController.makePdf);
router.route('/wsendpoint').get(FeatureController.getWSEndpoint);
router.route('/stats').post(FeatureController.getStats);
router.route('/screencast').get(FeatureController.getScreencast);//TODO
router.route('/extract').post(FeatureController.extractPage);
router.route('/embed').get(FeatureController.embed);

module.exports = router;
