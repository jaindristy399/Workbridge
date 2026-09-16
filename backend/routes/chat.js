const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

// Generate a consistent room ID from two user IDs
const getRoomId = (id1, id2) => [id1, id2].sort().join('_');

// GET /api/chat/unread — total unread count for current user (used by Navbar badge)
router.get('/unread', protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiver: req.user._id, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/chat/rooms — get all chat conversations for current user
router.get('/rooms', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Find unique room IDs where user participated
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .populate('sender', 'name role')
      .populate('receiver', 'name role')
      .sort({ createdAt: -1 });

    // Deduplicate by roomId, keep latest message per room
    const rooms = {};
    for (const msg of messages) {
      if (!rooms[msg.roomId]) {
        rooms[msg.roomId] = {
          roomId: msg.roomId,
          lastMessage: msg.text,
          lastTime: msg.createdAt,
          otherUser: msg.sender._id.toString() === userId ? msg.receiver : msg.sender
        };
      }
    }

    // Attach per-room unread counts
    const roomList = Object.values(rooms);
    const unreadCounts = await Promise.all(
      roomList.map(r => Message.countDocuments({ roomId: r.roomId, receiver: userId, read: false }))
    );
    roomList.forEach((r, i) => { r.unread = unreadCounts[i]; });

    res.json(roomList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/chat/:otherUserId — get message history with another user
router.get('/:otherUserId', protect, async (req, res) => {
  try {
    const roomId = getRoomId(req.user._id.toString(), req.params.otherUserId);
    const messages = await Message.find({ roomId })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { roomId, receiver: req.user._id, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/chat/:otherUserId — send a message (also saved for persistence)
router.post('/:otherUserId', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const roomId = getRoomId(req.user._id.toString(), req.params.otherUserId);

    const message = await Message.create({
      roomId,
      sender: req.user._id,
      receiver: req.params.otherUserId,
      text
    });

    const populated = await Message.findById(message._id).populate('sender', 'name');

    // Emit via socket for real-time delivery
    const io = req.app.get('io');
    io.to(roomId).emit('receive_message', populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
