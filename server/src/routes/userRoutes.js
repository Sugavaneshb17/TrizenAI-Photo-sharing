const express = require('express');
const { createTeamMember } = require('../controllers/userController');
const { authenticateUser, requireRole } = require('../middleware/auth');
const { USER_ROLES } = require('../models/User');

const router = express.Router();

router.post('/team-members', authenticateUser, requireRole(USER_ROLES.ADMIN), createTeamMember);

module.exports = router;
