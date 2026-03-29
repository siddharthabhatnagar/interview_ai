import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrateExistingUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Find users without terms acceptance data
    const users = await User.find({
      $or: [
        { termsAccepted: { $exists: false } },
        { termsAcceptedAt: { $exists: false } },
      ],
    });

    console.log(`Found ${users.length} users to migrate`);

    for (const user of users) {
      user.termsAccepted = true;
      user.termsAcceptedAt = user.createdAt || new Date();
      user.termsVersion = '1.0';
      await user.save();
    }

    console.log(`Successfully migrated ${users.length} users`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateExistingUsers();
