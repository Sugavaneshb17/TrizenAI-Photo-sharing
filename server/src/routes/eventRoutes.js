const express = require('express');
const upload = require('../config/multer');
const { createEvent, getEvents, getEventById, addTeamMemberToEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { uploadPhotosToEvent, getEventPhotos, publishGallery, getGalleryStatus } = require('../controllers/photoController');
const { authenticateUser, requireRole } = require('../middleware/auth');
const { USER_ROLES } = require('../models/User');

const router = express.Router();

router.post('/', authenticateUser, requireRole(USER_ROLES.ADMIN), createEvent);
router.get('/', authenticateUser, getEvents);
router.patch('/:eventId', authenticateUser, requireRole(USER_ROLES.ADMIN), updateEvent);
router.delete('/:eventId', authenticateUser, requireRole(USER_ROLES.ADMIN), deleteEvent);
router.get('/:eventId', authenticateUser, getEventById);
router.post('/:eventId/members', authenticateUser, requireRole(USER_ROLES.ADMIN), addTeamMemberToEvent);
router.post('/:eventId/photos', authenticateUser, requireRole(USER_ROLES.TEAM_MEMBER), upload.array('photos', 10), uploadPhotosToEvent);
router.get('/:eventId/photos', authenticateUser, getEventPhotos);
router.post('/:eventId/gallery/publish', authenticateUser, requireRole(USER_ROLES.ADMIN), publishGallery);
router.get('/:eventId/gallery', authenticateUser, getGalleryStatus);

module.exports = router;
