const express = require('express');
const { getMyUploads, deletePhoto, togglePhotoSelection } = require('../controllers/photoController');
const { authenticateUser, requireRole } = require('../middleware/auth');
const { USER_ROLES } = require('../models/User');

const router = express.Router();

router.get('/my-uploads', authenticateUser, getMyUploads);
router.delete('/:photoId', authenticateUser, deletePhoto);
router.patch('/:photoId/select', authenticateUser, requireRole(USER_ROLES.ADMIN), togglePhotoSelection);

module.exports = router;
