const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');
const { USER_ROLES } = require('../models/User');

const createTeamMember = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Name, email and password are required', 400);
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (existingUser.role !== USER_ROLES.TEAM_MEMBER) {
        return sendError(res, 'User already exists', 409);
      }

      return sendSuccess(res, {
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
        },
      }, 200);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: USER_ROLES.TEAM_MEMBER,
    });

    return sendSuccess(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, 201);
  } catch (error) {
    return sendError(res, 'Unable to create team member', 500);
  }
};

module.exports = {
  createTeamMember,
};
