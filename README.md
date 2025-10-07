# Records Management System

A comprehensive MERN stack application for managing records with admin and user access levels.

## Features

### Admin Features
- Dashboard with statistics and recent requests
- User management (add, edit, delete users)
- Record management (add, edit, delete records)
- Excel file import for bulk record creation
- Request approval/rejection system
- View all requests and their status

### User Features
- View all available records
- Search and filter records by category
- Request records for borrowing
- View current borrowed records
- Track request status
- Return records

### Technical Features
- JWT authentication
- Role-based access control
- Responsive design
- Real-time updates
- Excel file parsing
- MongoDB integration

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- JWT authentication
- Multer for file uploads
- XLSX for Excel parsing

### Frontend
- React 18
- Vite
- React Router
- React Query
- React Toastify
- React Icons

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account (free tier)
- Git

### Backend Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd records-management
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/records-management
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

4. Start the backend server:
```bash
npm run server
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

### Full Development Setup

To run both frontend and backend simultaneously:
```bash
npm run dev
```

## Deployment

### MongoDB Atlas Setup

1. Create a free MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for all IPs)
5. Get your connection string and update the MONGODB_URI in your .env file

### Netlify Deployment

1. Push your code to GitHub
2. Connect your GitHub repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `client/dist`
5. Add environment variables in Netlify dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`

### Environment Variables for Production

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/records-management
JWT_SECRET=your_production_jwt_secret
NODE_ENV=production
```

## Usage

### Admin Account
- Register the first admin account through the registration page
- Admin accounts can manage all users and records
- Admins can approve/reject record requests

### User Account
- Regular users can register and request records
- Users can view their current borrowed records
- Users can track their request status

### Excel Import Format
When importing records via Excel, use the following column headers:
- title (required)
- category (required)
- description (optional)
- author (optional)
- year (optional)
- isbn (optional)
- publisher (optional)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Records
- `GET /api/records` - Get all records
- `GET /api/records/:id` - Get single record
- `POST /api/records` - Create record (admin)
- `PUT /api/records/:id` - Update record (admin)
- `DELETE /api/records/:id` - Delete record (admin)
- `POST /api/records/import` - Import from Excel (admin)

### User Routes
- `GET /api/user/records` - Get records with search/filter
- `GET /api/user/my-requests` - Get user's requests
- `GET /api/user/my-records` - Get user's borrowed records
- `POST /api/user/requests` - Create request
- `POST /api/user/return/:id` - Request return

### Admin Routes
- `GET /api/admin/dashboard` - Get dashboard stats
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/requests` - Get all requests
- `PUT /api/admin/requests/:id` - Approve/reject request

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
