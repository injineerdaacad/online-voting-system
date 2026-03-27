import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../config/dbConfig.js';
import { Notification, User } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const sampleNotifications = [
  {
    title: 'Welcome to Online Voting System',
    message: 'Welcome to the Online Voting System! Your account has been created successfully. You can now participate in elections.',
    type: 'success',
    url: '/dashboard',
    metadata: {
      type: 'account_created',
      system: true
    }
  },
  {
    title: 'New Election Available',
    message: 'A new election "Student Council 2026" has been created and is now active. You can cast your vote now.',
    type: 'info',
    url: '/elections',
    metadata: {
      type: 'election_started',
      electionId: 'sample-election-1',
      electionTitle: 'Student Council 2026'
    }
  },
  {
    title: 'Voting Reminder',
    message: 'Don\'t forget to vote in the ongoing "Faculty Representative" election. Voting ends in 2 days.',
    type: 'warning',
    url: '/elections',
    metadata: {
      type: 'voting_reminder',
      electionId: 'sample-election-2',
      electionTitle: 'Faculty Representative',
      daysLeft: 2
    }
  },
  {
    title: 'System Update',
    message: 'The voting system has been updated with new security features and improved performance.',
    type: 'info',
    url: '/updates',
    metadata: {
      type: 'system_update',
      version: '2.1.0',
      features: ['Enhanced Security', 'Better Performance']
    }
  },
  {
    title: 'Election Results Available',
    message: 'Results for "Department Head Election" are now available for viewing.',
    type: 'success',
    url: '/results',
    metadata: {
      type: 'results_published',
      electionId: 'sample-election-3',
      electionTitle: 'Department Head Election'
    }
  },
  {
    title: 'Account Security Alert',
    message: 'We noticed a login from a new device. If this wasn\'t you, please secure your account immediately.',
    type: 'error',
    url: '/security',
    metadata: {
      type: 'security_alert',
      device: 'Unknown Device',
      location: 'Unknown Location'
    }
  }
];

const seedNotifications = async () => {
  try {
    await connectDB();

    const users = await User.find({}).select('_id full_name name email role');
    if (users.length === 0) {
      console.error("❌ Error: No users found. Please seed users first");
      return;
    }

    await Notification.deleteMany({});

    let totalNotifications = 0;
    for (const user of users) {
      const numNotifications = Math.floor(Math.random() * 3) + 2;
      const selectedNotifications = sampleNotifications
        .sort(() => 0.5 - Math.random())
        .slice(0, numNotifications);
      for (const notificationData of selectedNotifications) {
        const isRead = Math.random() > 0.4;
        const randomDaysAgo = Math.floor(Math.random() * 7);
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - randomDaysAgo);
        createdAt.setHours(
          Math.floor(Math.random() * 24),
          Math.floor(Math.random() * 60),
          Math.floor(Math.random() * 60)
        );
        const notification = new Notification({
          user_id: user._id,
          ...notificationData,
          read: isRead,
          created_at: createdAt,
          updated_at: createdAt
        });
        await notification.save();
        totalNotifications++;
      }
    }

  } catch (error) {
    console.error("❌ Error seeding notifications:", error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  seedNotifications();
}

export default seedNotifications;
