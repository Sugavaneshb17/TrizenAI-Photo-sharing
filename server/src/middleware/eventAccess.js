const Event = require('../models/Event');
const { sendError } = require('../utils/response');

const ensureEventAccess = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      return sendError(res, 'Event ID is required', 400);
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    const isAdmin = req.user.role === 'ADMIN' && event.createdBy.toString() === req.user._id.toString();
    const isTeamMember = req.user.role === 'TEAM_MEMBER' && event.teamMembers.some((memberId) => memberId.toString() === req.user._id.toString());

    if (!isAdmin && !isTeamMember) {
      return sendError(res, 'Forbidden', 403);
    }

    req.event = event;
    next();
  } catch (error) {
    return sendError(res, 'Unable to validate event access', 500);
  }
};

module.exports = { ensureEventAccess };
