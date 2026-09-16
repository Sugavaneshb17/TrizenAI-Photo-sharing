const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const extension = (file.originalname || '').toLowerCase();
  const hasValidMimeType = allowedTypes.includes(file.mimetype);
  const hasValidExtension = /\.(jpe?g|png|webp)$/i.test(extension);

  if (!hasValidMimeType && !hasValidExtension) {
    return cb(new Error('Unsupported file type. Only JPEG, PNG, and WEBP images are allowed.'));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = upload;
