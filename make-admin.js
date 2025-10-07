const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function makeUserAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/records-management');
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({}, 'name email role');
    console.log('\n📋 Current users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    // Make the first user admin
    const firstUser = users[0];
    await User.findByIdAndUpdate(firstUser._id, { role: 'admin' });
    
    console.log(`\n✅ Successfully promoted ${firstUser.name} (${firstUser.email}) to ADMIN`);
    console.log('\n🎉 You can now login with admin privileges!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

makeUserAdmin();
