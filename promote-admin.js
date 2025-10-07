const mongoose = require('mongoose');
const User = require('./models/User');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promoteToAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/records-management');
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({}, 'name email role');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    console.log('\n📋 Current users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    // Ask which user to promote
    rl.question('\nEnter the number of the user you want to make admin (or press Enter for first user): ', async (answer) => {
      try {
        let userIndex = 0;
        if (answer.trim()) {
          userIndex = parseInt(answer) - 1;
          if (userIndex < 0 || userIndex >= users.length) {
            console.log('❌ Invalid selection');
            rl.close();
            await mongoose.disconnect();
            return;
          }
        }

        const selectedUser = users[userIndex];
        await User.findByIdAndUpdate(selectedUser._id, { role: 'admin' });
        
        console.log(`\n✅ Successfully promoted ${selectedUser.name} (${selectedUser.email}) to ADMIN`);
        console.log('\n🎉 You can now login with admin privileges!');
        
      } catch (error) {
        console.error('❌ Error:', error.message);
      } finally {
        rl.close();
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    await mongoose.disconnect();
  }
}

promoteToAdmin();
