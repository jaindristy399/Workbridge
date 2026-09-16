const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const User     = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// ── Multer setup ─────────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const safe = Date.now() + '_' + Math.random().toString(36).substr(2, 6) + ext;
    cb(null, safe);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  allowed.includes(ext) ? cb(null, true) : cb(new Error('Only JPG, PNG, PDF allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ── POST /api/verification/submit ─────────────────────────────────────────────
// Provider: requires idProof + workProof
// Customer: requires idProof (optional workProof)
router.post(
  '/submit',
  protect,
  upload.fields([
    { name: 'idProof',   maxCount: 1 },
    { name: 'workProof', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);

      if (user.verificationStatus === 'pending') {
        return res.status(400).json({ message: 'Verification already submitted and under review' });
      }
      if (user.verificationStatus === 'verified') {
        return res.status(400).json({ message: 'Account is already verified' });
      }

      const { phone, experience } = req.body;

      const idProofFile   = req.files?.idProof?.[0];
      const workProofFile = req.files?.workProof?.[0];

      if (!idProofFile) {
        return res.status(400).json({ message: 'ID proof document is required' });
      }

      if (user.role === 'provider' && !workProofFile) {
        return res.status(400).json({ message: 'Work proof document is required for providers' });
      }

      user.verificationStatus        = 'pending';
      user.verificationSubmittedAt   = new Date();
      user.verificationNote          = '';
      user.verificationDocuments.idProof   = idProofFile.filename;
      if (workProofFile) user.verificationDocuments.workProof = workProofFile.filename;
      if (phone)      user.phone      = phone;
      if (experience) user.experience = experience;

      await user.save();
      res.json({ message: 'Verification submitted successfully', verificationStatus: 'pending' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ── GET /api/verification/status ──────────────────────────────────────────────
// Returns current user's verification status
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('verificationStatus verificationNote verificationSubmittedAt verificationDocuments phone experience');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/verification/requests ───────────────────────────────────────────
// Admin only — all pending/all requests
router.get('/requests', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query; // 'pending' | 'verified' | 'rejected' | undefined = all
    const filter = { verificationStatus: { $ne: 'none' } };
    if (status) filter.verificationStatus = status;

    const users = await User.find(filter)
      .select('name email role phone experience verificationStatus verificationDocuments verificationNote verificationSubmittedAt createdAt')
      .sort({ verificationSubmittedAt: -1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/verification/:userId/approve ─────────────────────────────────────
router.put('/:userId/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { verificationStatus: 'verified', isVerified: true, verificationNote: '' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User verified successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/verification/:userId/reject ──────────────────────────────────────
router.put('/:userId/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { verificationStatus: 'rejected', isVerified: false, verificationNote: reason || 'Documents not acceptable' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User rejected', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/verification/docs/:filename ──────────────────────────────────────
// Admin only — serve uploaded document files
router.get('/docs/:filename', protect, authorize('admin'), (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });
  res.sendFile(filePath);
});

module.exports = router;
