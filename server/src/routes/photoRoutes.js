const express = require('express');
const { getMyUploads, togglePhotoSelection } = require('../controllers/photoController');
const { authenticateUser, requireRole } = require('../middleware/auth');
const { USER_ROLES } = require('../models/User');

const router = express.Router();

router.get('/my-uploads', authenticateUser, getMyUploads);
router.patch('/:photoId/select', authenticateUser, requireRole(USER_ROLES.ADMIN), togglePhotoSelection);

module.exports = router;
