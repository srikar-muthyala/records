const mongoose = require('mongoose');
require('dotenv').config();

const Record = require('./models/Record');

async function createIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/records', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Create text index for full-text search
    console.log('Creating text index...');
    await Record.collection.createIndex({ 
      title: 'text', 
      description: 'text', 
      name: 'text' 
    });

    // Create individual indexes for better performance
    console.log('Creating individual indexes...');
    await Record.collection.createIndex({ employeeId: 1 });
    await Record.collection.createIndex({ ppoUniqueId: 1 });
    await Record.collection.createIndex({ category: 1 });
    await Record.collection.createIndex({ status: 1 });
    await Record.collection.createIndex({ createdAt: -1 });

    // Create compound indexes for common query patterns
    console.log('Creating compound indexes...');
    await Record.collection.createIndex({ status: 1, category: 1 });
    await Record.collection.createIndex({ status: 1, createdAt: -1 });

    console.log('All indexes created successfully!');
    
    // List all indexes
    const indexes = await Record.collection.getIndexes();
    console.log('Current indexes:');
    console.log(JSON.stringify(indexes, null, 2));

  } catch (error) {
    console.error('Error creating indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createIndexes();
