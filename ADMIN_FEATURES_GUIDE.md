# 🔧 Admin Features Guide

## 📍 **Location of Admin Functionality**

### **1. User Management Features**

#### **Frontend Location:** `client/src/pages/AdminDashboard.jsx`
- **Lines 237-294:** Users tab with table display
- **Lines 242-247:** "Add User" button
- **Lines 287-301:** Edit and Delete buttons for each user
- **Lines 421-491:** Add User Modal
- **Lines 493-576:** Edit User Modal (NEW!)

#### **Backend Location:** `routes/admin.js`
- **Lines 15-25:** GET `/api/admin/users` - Get all users
- **Lines 27-60:** POST `/api/admin/users` - Create new user
- **Lines 62-95:** PUT `/api/admin/users/:id` - Update user
- **Lines 97-108:** DELETE `/api/admin/users/:id` - Delete user

#### **User Management Capabilities:**
✅ **Create Users:** Name, Email, Password, Role (Admin/User)
✅ **Edit Users:** Update name, email, role, and active status
✅ **Delete Users:** Remove users from system
✅ **View All Users:** Table with name, email, role, status
✅ **Role Management:** Assign admin or user roles
✅ **Status Management:** Activate/deactivate users

---

### **2. Record Management Features**

#### **Frontend Location:** `client/src/pages/AdminDashboard.jsx`
- **Lines 296-350:** Records tab with table display
- **Lines 302-307:** "Add Record" button
- **Lines 308-313:** "Import Excel" button
- **Lines 578-626:** Add Record Modal
- **Lines 628-670:** Import Excel Modal

#### **Backend Location:** `routes/records.js`
- **Lines 15-45:** GET `/api/records` - Get all records
- **Lines 47-70:** POST `/api/records` - Create new record
- **Lines 72-100:** PUT `/api/records/:id` - Update record
- **Lines 102-112:** DELETE `/api/records/:id` - Delete record
- **Lines 114-150:** POST `/api/records/import` - Import from Excel

#### **Record Management Capabilities:**
✅ **Add Records Manually:** Title, Category, Description
✅ **Import from Excel:** Bulk import with Excel file parsing
✅ **Edit Records:** Update record information
✅ **Delete Records:** Remove records from system
✅ **View All Records:** Table with status and current holder
✅ **Excel Import:** Supports .xlsx and .xls files

---

### **3. Request Management Features**

#### **Frontend Location:** `client/src/pages/AdminDashboard.jsx`
- **Lines 352-418:** Requests tab with table display
- **Lines 212-224:** Approve/Reject buttons in dashboard
- **Lines 390-410:** Approve/Reject buttons in requests tab

#### **Backend Location:** `routes/admin.js`
- **Lines 110-120:** GET `/api/admin/requests` - Get all requests
- **Lines 122-160:** PUT `/api/admin/requests/:id` - Approve/reject requests

#### **Request Management Capabilities:**
✅ **View All Requests:** See all pending, approved, rejected requests
✅ **Approve Requests:** Grant access to records
✅ **Reject Requests:** Deny access with admin response
✅ **Request History:** Track all request activities
✅ **User Information:** See who made each request

---

### **4. Dashboard Overview**

#### **Frontend Location:** `client/src/pages/AdminDashboard.jsx`
- **Lines 120-235:** Dashboard tab with statistics
- **Lines 16-25:** Dashboard data fetching

#### **Backend Location:** `routes/admin.js`
- **Lines 162-185:** GET `/api/admin/dashboard` - Dashboard statistics

#### **Dashboard Features:**
✅ **Statistics Cards:** Total users, records, available records, borrowed records, pending requests
✅ **Recent Requests:** Latest 5 pending requests
✅ **Quick Actions:** Approve/reject from dashboard
✅ **Real-time Updates:** Live data refresh

---

## 🚀 **How to Access Admin Features**

### **Step 1: Login as Admin**
1. Start the application: `npm run dev`
2. Go to http://localhost:3000
3. Register first user (will be regular user)
4. Manually promote to admin in database OR modify registration logic

### **Step 2: Navigate Admin Dashboard**
1. Login with admin credentials
2. You'll see the admin dashboard with tabs:
   - **Dashboard:** Overview and statistics
   - **Users:** User management
   - **Records:** Record management  
   - **Requests:** Request approval

### **Step 3: Use Admin Features**

#### **User Management:**
- Click "Users" tab
- Click "Add User" to create new users
- Click "Edit" to modify user details
- Click "Delete" to remove users

#### **Record Management:**
- Click "Records" tab
- Click "Add Record" to create records manually
- Click "Import Excel" to bulk import records
- Use the sample CSV file provided

#### **Request Management:**
- Click "Requests" tab
- View all pending requests
- Click approve/reject buttons
- Add admin responses

---

## 📊 **Excel Import Format**

Use the provided `sample-records.csv` file as a template. Required columns:
- `title` (required)
- `category` (required)
- `description` (optional)
- `author` (optional)
- `year` (optional)
- `isbn` (optional)
- `publisher` (optional)

---

## 🔐 **Admin Privileges**

Admins can:
- ✅ Create, edit, delete users
- ✅ Create, edit, delete records
- ✅ Import records from Excel
- ✅ Approve/reject all requests
- ✅ View dashboard statistics
- ✅ Manage user roles and status
- ✅ Access all system features

Regular users can:
- ✅ View available records
- ✅ Request records
- ✅ View their own requests
- ✅ Return records
- ❌ Cannot access admin features

---

## 🛠️ **Technical Implementation**

### **Authentication:**
- JWT tokens for secure authentication
- Role-based middleware (`adminAuth`)
- Protected admin routes

### **Database:**
- MongoDB with Mongoose ODM
- User, Record, Request models
- Proper relationships and validation

### **Frontend:**
- React with modern hooks
- React Query for data fetching
- Toast notifications
- Modal-based forms
- Responsive design

### **File Upload:**
- Multer for file handling
- XLSX library for Excel parsing
- Support for .xlsx and .xls formats

All admin functionality is fully implemented and ready to use! 🎉
