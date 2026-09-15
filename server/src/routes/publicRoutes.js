const express = require('express');
const { verifyPublicGallery, getPublicGalleryPhotos } = require('../controllers/photoController');

const router = express.Router();

router.post('/gallery/:publicToken/verify', verifyPublicGallery);
router.get('/gallery/:publicToken/photos', getPublicGalleryPhotos);

module.exports = router;
