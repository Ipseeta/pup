const express = require('express'),
router = express.Router(),
FeatureController = require('../controllers/pupfeature.controller');

router.route('/screenshot').post(FeatureController.getScreenshot);
router.route('/content').post(FeatureController.getContent);
router.route('/pdf').post(FeatureController.makePdf);
router.route('/wsendpoint').get(FeatureController.getWSEndpoint);

module.exports = router;
