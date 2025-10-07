const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Records Management System...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  const envContent = `MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/records-management
JWT_SECRET=your_jwt_secret_key_here_${Math.random().toString(36).substring(2, 15)}
NODE_ENV=development`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created with default values');
  console.log('⚠️  Please update MONGODB_URI with your actual MongoDB connection string\n');
} else {
  console.log('✅ .env file already exists\n');
}

console.log('📋 Setup Instructions:');
console.log('1. Update your .env file with your MongoDB Atlas connection string');
console.log('2. Make sure you have a MongoDB Atlas cluster set up');
console.log('3. Run "npm run dev" to start both frontend and backend');
console.log('4. Open http://localhost:3000 in your browser');
console.log('5. Register your first admin account\n');

console.log('🔧 Available Commands:');
console.log('- npm run dev: Start both frontend and backend');
console.log('- npm run server: Start only backend');
console.log('- npm run client: Start only frontend');
console.log('- npm run build: Build for production\n');

console.log('🌐 Deployment:');
console.log('1. Push your code to GitHub');
console.log('2. Connect to Netlify');
console.log('3. Set build command: npm run build');
console.log('4. Set publish directory: client/dist');
console.log('5. Add environment variables in Netlify dashboard\n');

console.log('✨ Setup complete! Happy coding!');
