const Event = require('../models/Event');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

const createEvent = async (req, res) => {
  try {
    const { name, description, date } = req.body;

    if (!name || !date) {
      return sendError(res, 'Event name and date are required', 400);
    }

    const event = await Event.create({
      name,
      description: description || '',
      date: new Date(date),
      createdBy: req.user._id,
      teamMembers: [],
    });

    return sendSuccess(res, { event }, 201);
  } catch (error) {
    return sendError(res, 'Unable to create event', 500);
  }
};

const getEvents = async (req, res) => {
  try {
    const query = req.user.role === 'ADMIN'
      ? { createdBy: req.user._id }
      : { teamMembers: req.user._id };

    const events = await Event.find(query)
      .populate('createdBy', 'name email role')
      .populate('teamMembers', 'name email role')
      .sort({ createdAt: -1 });

    return sendSuccess(res, { events });
  } catch (error) {
    return sendError(res, 'Unable to fetch events', 500);
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('createdBy', 'name email role')
      .populate('teamMembers', 'name email role');

    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    if (req.user.role === 'ADMIN' && event.createdBy._id.toString() === req.user._id.toString()) {
      return sendSuccess(res, { event });
    }

    if (req.user.role === 'TEAM_MEMBER' && event.teamMembers.some((member) => member._id.toString() === req.user._id.toString())) {
      return sendSuccess(res, { event });
    }

    return sendError(res, 'Forbidden', 403);
  } catch (error) {
    return sendError(res, 'Unable to fetch event', 500);
  }
};

const addTeamMemberToEvent = async (req, res) => {
  try {
    const { userId, email } = req.body;
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    if (event.createdBy.toString() !== req.user._id.toString()) {
      return sendError(res, 'Forbidden', 403);
    }

    let member;
    if (userId) {
      member = await User.findById(userId);
    } else if (email) {
      member = await User.findOne({ email: String(email).toLowerCase() });
    }

    if (!member || member.role !== 'TEAM_MEMBER') {
      return sendError(res, 'Team member not found', 404);
    }

    if (event.teamMembers.some((id) => id.toString() === member._id.toString())) {
      return sendError(res, 'User already assigned to this event', 409);
    }

    event.teamMembers.push(member._id);
    await event.save();

    return sendSuccess(res, { event }, 200);
  } catch (error) {
    return sendError(res, 'Unable to assign team member', 500);
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  addTeamMemberToEvent,
};
