import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  read: {
    type: Boolean,
    default: false
  },
  url: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

notificationSchema.index({ user_id: 1, read: 1 });
notificationSchema.index({ user_id: 1, created_at: -1 });
notificationSchema.index({ created_at: -1 });

notificationSchema.statics.createNotification = async function(userId, notificationData) {
  const notification = new this({
    user_id: userId,
    ...notificationData
  });
  return await notification.save();
};

notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type = null
  } = options;

  const query = { user_id: userId };

  if (unreadOnly) {
    query.read = false;
  }

  if (type) {
    query.type = type;
  }

  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    this.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    notifications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ user_id: userId, read: false });
};

notificationSchema.statics.markAsRead = async function(notificationId, userId) {
  return await this.findOneAndUpdate(
    { _id: notificationId, user_id: userId },
    { read: true, updated_at: new Date() },
    { new: true }
  );
};

notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { user_id: userId, read: false },
    { read: true, updated_at: new Date() }
  );
};

notificationSchema.statics.deleteNotification = async function(notificationId, userId) {
  return await this.findOneAndDelete({ _id: notificationId, user_id: userId });
};

notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  this.updated_at = new Date();
  return await this.save();
};

notificationSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

export { Notification };
export default Notification;
