const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const cloudinary = require('../config/cloudinary');
const Event = require('../models/Event');
const Photo = require('../models/Photo');
const Gallery = require('../models/Gallery');
const { sendSuccess, sendError } = require('../utils/response');

const galleryAccessTokens = new Map();

const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );

const buildFallbackImageUrl = (file) => {
  const safeName = (file.originalname || 'photo').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <rect width="1200" height="900" fill="#e2e8f0"/>
      <rect x="110" y="110" width="980" height="680" rx="28" fill="#ffffff" stroke="#94a3b8" stroke-width="6"/>
      <circle cx="420" cy="360" r="120" fill="#cbd5e1"/>
      <path d="M770 650L880 390L1010 650Z" fill="#94a3b8"/>
      <text x="600" y="820" font-family="Arial, sans-serif" font-size="60" text-anchor="middle" fill="#334155">${safeName}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

const isGalleryAccessTokenValid = (publicToken, token) => {
  const entry = galleryAccessTokens.get(token);
  return Boolean(entry && entry.publicToken === publicToken && Date.now() < entry.expiresAt);
};

const uploadPhotosToEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    if (req.user.role !== 'TEAM_MEMBER') {
      return sendError(res, 'Only team members can upload photos', 403);
    }

    const isAssigned = event.teamMembers.some((memberId) => memberId.toString() === req.user._id.toString());
    if (!isAssigned) {
      return sendError(res, 'You are not assigned to this event', 403);
    }

    const files = req.files || [];
    if (!files.length) {
      return sendError(res, 'At least one image file is required', 400);
    }

    const uploadedPhotos = [];

    for (const file of files) {
      let result = null;

      if (isCloudinaryConfigured()) {
        try {
          result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: 'trizenai-events',
                resource_type: 'image',
              },
              (error, uploaded) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(uploaded);
                }
              },
            );

            stream.end(file.buffer);
          });
        } catch (error) {
          console.warn('Cloudinary upload failed, using fallback image:', error.message);
        }
      }

      const photo = await Photo.create({
        eventId: event._id,
        uploadedBy: req.user._id,
        originalName: file.originalname,
        storageUrl: result?.secure_url || buildFallbackImageUrl(file),
        publicId: result?.public_id || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        fileSize: file.size,
      });

      uploadedPhotos.push(photo);
    }

    return sendSuccess(res, { photos: uploadedPhotos }, 201);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Unable to upload photos', 500);
  }
};

const getEventPhotos = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    if (req.user.role === 'ADMIN') {
      const isOwner = event.createdBy.toString() === req.user._id.toString();
      if (!isOwner) {
        return sendError(res, 'Forbidden', 403);
      }

      const photos = await Photo.find({ eventId: event._id }).populate('uploadedBy', 'name email role').sort({ createdAt: -1 });
      return sendSuccess(res, { photos });
    }

    if (req.user.role === 'TEAM_MEMBER') {
      const isAssigned = event.teamMembers.some((memberId) => memberId.toString() === req.user._id.toString());
      if (!isAssigned) {
        return sendError(res, 'Forbidden', 403);
      }

      const photos = await Photo.find({
        eventId: event._id,
        uploadedBy: req.user._id,
      }).populate('uploadedBy', 'name email role').sort({ createdAt: -1 });
      return sendSuccess(res, { photos });
    }

    return sendError(res, 'Forbidden', 403);
  } catch (error) {
    return sendError(res, 'Unable to fetch photos', 500);
  }
};

const getMyUploads = async (req, res) => {
  try {
    const photos = await Photo.find({ uploadedBy: req.user._id })
      .populate('eventId', 'name date')
      .sort({ createdAt: -1 });

    return sendSuccess(res, { photos });
  } catch (error) {
    return sendError(res, 'Unable to fetch your uploads', 500);
  }
};

const togglePhotoSelection = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.photoId).populate('eventId');
    if (!photo) {
      return sendError(res, 'Photo not found', 404);
    }

    const event = photo.eventId;
    const isOwner = event.createdBy.toString() === req.user._id.toString();
    if (req.user.role !== 'ADMIN' || !isOwner) {
      return sendError(res, 'Forbidden', 403);
    }

    photo.isSelected = !photo.isSelected;
    await photo.save();

    return sendSuccess(res, { photo });
  } catch (error) {
    return sendError(res, 'Unable to update photo selection', 500);
  }
};

const publishGallery = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    if (req.user.role !== 'ADMIN' || event.createdBy.toString() !== req.user._id.toString()) {
      return sendError(res, 'Forbidden', 403);
    }

    const { pin } = req.body;
    if (!pin || String(pin).trim().length < 4) {
      return sendError(res, 'A valid PIN is required', 400);
    }

    const selectedPhotos = await Photo.find({ eventId: event._id, isSelected: true });
    const token = crypto.randomBytes(24).toString('hex');
    const pinHash = await bcrypt.hash(String(pin), 10);

    const gallery = await Gallery.findOneAndUpdate(
      { eventId: event._id },
      {
        eventId: event._id,
        publicToken: token,
        pinHash,
        published: true,
        publishedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    const frontendBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    return sendSuccess(res, {
      galleryUrl: `${frontendBaseUrl}/gallery/${gallery.publicToken}`,
      publicToken: gallery.publicToken,
      selectedCount: selectedPhotos.length,
    });
  } catch (error) {
    return sendError(res, 'Unable to publish gallery', 500);
  }
};

const getGalleryStatus = async (req, res) => {
  try {
    const gallery = await Gallery.findOne({ eventId: req.params.eventId });
    if (!gallery) {
      return sendSuccess(res, { published: false, requiresPin: false });
    }

    return sendSuccess(res, {
      published: gallery.published,
      requiresPin: gallery.published,
    });
  } catch (error) {
    return sendError(res, 'Unable to load gallery status', 500);
  }
};

const verifyPublicGallery = async (req, res) => {
  try {
    const { publicToken } = req.params;
    const gallery = await Gallery.findOne({ publicToken });
    if (!gallery || !gallery.published) {
      return sendError(res, 'Gallery is not available', 403);
    }

    const { pin } = req.body;
    if (!pin) {
      return sendError(res, 'PIN is required', 400);
    }

    const isValid = await bcrypt.compare(String(pin), gallery.pinHash);
    if (!isValid) {
      return sendError(res, 'Invalid PIN', 401);
    }

    const accessToken = crypto.randomBytes(20).toString('hex');
    galleryAccessTokens.set(accessToken, {
      publicToken,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    return sendSuccess(res, { accessToken, galleryToken: accessToken });
  } catch (error) {
    return sendError(res, 'Unable to verify gallery PIN', 500);
  }
};

const getPublicGalleryPhotos = async (req, res) => {
  try {
    const { publicToken } = req.params;
    const gallery = await Gallery.findOne({ publicToken });
    if (!gallery || !gallery.published) {
      return sendError(res, 'Gallery is not available', 403);
    }

    const authHeader = req.headers.authorization || '';
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

    if (!accessToken || !isGalleryAccessTokenValid(publicToken, accessToken)) {
      return sendError(res, 'Gallery access is required', 401);
    }

    const event = await Event.findById(gallery.eventId);
    if (!event) {
      return sendError(res, 'Gallery not found', 404);
    }

    const photos = await Photo.find({ eventId: event._id, isSelected: true })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    return sendSuccess(res, {
      event: {
        name: event.name,
        description: event.description,
        date: event.date,
      },
      photos,
    });
  } catch (error) {
    return sendError(res, 'Unable to fetch gallery photos', 500);
  }
};

module.exports = {
  uploadPhotosToEvent,
  getEventPhotos,
  getMyUploads,
  togglePhotoSelection,
  publishGallery,
  getGalleryStatus,
  verifyPublicGallery,
  getPublicGalleryPhotos,
};
