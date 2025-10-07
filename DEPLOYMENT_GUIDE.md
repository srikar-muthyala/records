# Deployment Guide

## Problem
Netlify only serves static files and cannot run Node.js servers. Your app needs separate deployment for frontend and backend.

## Solution: Deploy Backend Separately

### Option 1: Railway (Recommended - Free tier available)

1. **Deploy Backend to Railway:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Initialize project
   railway init
   
   # Deploy
   railway up
   ```

2. **Set Environment Variables in Railway Dashboard:**
   - `NODE_ENV=production`
   - `MONGODB_URI=your_mongodb_connection_string`
   - `CORS_ORIGIN=https://your-netlify-app.netlify.app`
   - `JWT_SECRET=your_secure_secret`

3. **Get your Railway URL** (e.g., `https://your-app.railway.app`)

### Option 2: Render (Free tier available)

1. **Connect your GitHub repo to Render**
2. **Create a new Web Service**
3. **Configure:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`
4. **Set Environment Variables** (same as Railway)

### Option 3: Heroku (Paid)

1. **Install Heroku CLI**
2. **Create Heroku app:**
   ```bash
   heroku create your-app-name
   ```
3. **Deploy:**
   ```bash
   git push heroku main
   ```

## Update Frontend Configuration

1. **Update `netlify.toml`:**
   ```toml
   [build.environment]
     VITE_API_URL = "https://your-backend-url.railway.app"
   ```

2. **Or set in Netlify Dashboard:**
   - Go to Site Settings > Environment Variables
   - Add `VITE_API_URL` with your backend URL

## Database Setup

### MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a cluster
3. Get connection string
4. Add to your backend environment variables

### Alternative: Railway MongoDB
Railway also offers MongoDB add-ons.

## Testing

1. **Backend:** Visit `https://your-backend-url.railway.app/api/auth/login`
2. **Frontend:** Your Netlify app should now connect to the backend

## Troubleshooting

- **CORS errors:** Make sure `CORS_ORIGIN` matches your Netlify URL exactly
- **Database connection:** Verify MongoDB URI is correct
- **Environment variables:** Check all variables are set in your backend service
