import React, { useState, useEffect } from 'react'

import { useQuery } from 'react-query'

import axios from 'axios'

import { toast } from 'react-toastify'

import { FiUsers, FiBook, FiX, FiPlus, FiUpload, FiEdit, FiTrash2, FiRefreshCw } from 'react-icons/fi'
import SimpleModal from '../components/SimpleModal'

import SimpleFormField from '../components/SimpleFormField'
import { useAuth } from '../contexts/AuthContext'



const AdminDashboard = () => {
  const { user, checkPasswordStatus } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')

  const [showAddUser, setShowAddUser] = useState(false)

  const [showEditUser, setShowEditUser] = useState(false)

  const [editingUser, setEditingUser] = useState(null)

  const [showAddRecord, setShowAddRecord] = useState(false)

  const [showEditRecord, setShowEditRecord] = useState(false)

  const [editingRecord, setEditingRecord] = useState(null)

  const [showImportModal, setShowImportModal] = useState(false)

  const [selectedFile, setSelectedFile] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')

  // User records modal state
  const [showUserRecordsModal, setShowUserRecordsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  // Password change functionality
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Check if user needs to change password (for users with default credentials)
  useEffect(() => {
    const checkPasswordReset = async () => {
      if (user && !user.usingDefaultPassword) {
        // Only check if we don't already know the status
        const isUsingDefaultPassword = await checkPasswordStatus();
        if (isUsingDefaultPassword) {
          setShowPasswordChangeModal(true);
        }
      } else if (user && user.usingDefaultPassword) {
        // If we already know they're using default password, show modal
        setShowPasswordChangeModal(true);
      }
    };

    checkPasswordReset();
  }, [user, checkPasswordStatus]);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      await axios.put('/api/user/change-password', {
        newPassword,
        confirmPassword
      })
      toast.success('Password changed successfully')
      setShowPasswordChangeModal(false)
      setNewPassword('')
      setConfirmPassword('')
      
      // Update user object to clear default password flag
      if (user) {
        const updatedUser = { ...user, usingDefaultPassword: false }
        // You might need to update the user in AuthContext here
        // For now, refresh the page to ensure clean state
        window.location.reload()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    }
  }

  // Dashboard stats

  const { data: dashboardData, isLoading: dashboardLoading, refetch: refetchDashboard } = useQuery(

    'adminDashboard',

    () => axios.get('/api/admin/dashboard'),

    {

      select: (data) => data.data

    }

  )



  // Users

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery(

    'users',

    () => axios.get('/api/admin/users-with-records'),

    {

      select: (data) => data.data

    }

  )

  // User records query
  const { data: userRecordsData, isLoading: userRecordsLoading, refetch: refetchUserRecords } = useQuery(
    ['userRecords', selectedUser?._id],
    () => axios.get(`/api/admin/users/${selectedUser._id}/records`),
    {
      select: (data) => data.data,
      enabled: !!selectedUser
    }
  )



  // Records

  const { data: recordsData, isLoading: recordsLoading, refetch: refetchRecords } = useQuery(

    ['adminRecords', currentPage, recordsPerPage, searchTerm],
    () => {
      const params = new URLSearchParams({
        page: currentPage,
        limit: recordsPerPage
      });
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      return axios.get(`/api/records?${params.toString()}`);
    },
    {

      select: (data) => data.data

    }

  )






  const handleEditUser = (user) => {

    setEditingUser(user)

    setShowEditUser(true)

  }

  const handleUserClick = (user) => {
    setSelectedUser(user)
    setShowUserRecordsModal(true)
  }



  const handleDeleteUser = async (userId) => {

    if (window.confirm('Are you sure you want to delete this user?')) {

      try {

        await axios.delete(`/api/admin/users/${userId}`)

        toast.success('User deleted successfully')

        refetchUsers()

      } catch (error) {

        toast.error(error.response?.data?.message || 'Failed to delete user')

      }

    }

  }



  const handleDeleteRecord = async (recordId) => {

    if (window.confirm('Are you sure you want to delete this record?')) {

      try {

        await axios.delete(`/api/records/${recordId}`)

        toast.success('Record deleted successfully')

        refetchRecords()

      } catch (error) {

        toast.error(error.response?.data?.message || 'Failed to delete record')

      }

    }

  }



  const handleEditRecord = (record) => {

    setEditingRecord(record)

    setShowEditRecord(true)

  }



  const handleFileUpload = async (e) => {

    e.preventDefault()

    if (!selectedFile) {

      toast.error('Please select a file')

      return

    }



    const formData = new FormData()

    formData.append('file', selectedFile)



    try {

      const response = await axios.post('/api/records/import', formData, {

        headers: { 'Content-Type': 'multipart/form-data' }

      })

      
      const { imported, totalRows, skipped, errors } = response.data
      
      if (skipped > 0) {
        toast.warning(`Imported ${imported} records. ${skipped} records skipped due to errors.`)
        if (errors.length > 0) {
          console.log('Import errors:', errors.slice(0, 5)) // Show first 5 errors in console
        }
      } else {
        toast.success(`Successfully imported ${imported} records`)
      }
      
      setShowImportModal(false)

      setSelectedFile(null)

      refetchRecords()

    } catch (error) {

      toast.error(error.response?.data?.message || 'Failed to import records')

    }

  }



  if (dashboardLoading) {

    return <div className="loading"><div className="spinner"></div></div>

  }



  return (

    <div className="admin-container" style={{ padding: '24px 0' }}>
      <style>

        {`

          @keyframes fadeIn {

            from {

              opacity: 0;

              transform: translateY(8px);

            }

            to {

              opacity: 1;

              transform: translateY(0);

            }

          }

          
          /* Global overflow fix */
          * {
            box-sizing: border-box;
          }
          
          body {
            overflow-x: hidden;
          }
          
          .nav-button {
            transition: all 0.3s ease;
          }
          
          .nav-button:hover:not(.active) {
            background-color: #f3f4f6 !important;
            color: #374151 !important;
          }
          
          .nav-button.active {
            background-color: #3b82f6 !important;
            color: white !important;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
            transform: scale(1.02);
          }
          
          .action-button {
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            border: none;
            font-weight: 500;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            white-space: nowrap;
          }
          
          .action-button:hover {
            transform: translateY(-1px);
          }
          
          .action-button.primary {
            background-color: #3b82f6;
            color: white;
          }
          
          .action-button.primary:hover {
            background-color: #2563eb;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }
          
          .action-button.success {
            background-color: #10b981;
            color: white;
          }
          
          .action-button.success:hover {
            background-color: #059669;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          }
          
          .action-button.warning {
            background-color: #f59e0b;
            color: white;
          }
          
          .action-button.warning:hover {
            background-color: #d97706;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
          }
          
          .action-button.danger {
            background-color: #ef4444;
            color: white;
          }
          
          .action-button.danger:hover {
            background-color: #dc2626;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          }
          
          /* Desktop Styles - Keep left alignment for stats */
          @media (min-width: 769px) {
            .stat-card {
              text-align: left !important;
            }
            
            .admin-container {
              max-width: 100% !important;
              overflow-x: hidden !important;
            }
            
            .nav-container {
              max-width: 100% !important;
              overflow-x: hidden !important;
            }
            
            .nav-buttons {
              flex-wrap: wrap !important;
              max-width: 100% !important;
            }
            
            .section-header {
              max-width: 100% !important;
              overflow-x: hidden !important;
            }
            
            .section-actions {
              flex-wrap: wrap !important;
              max-width: 100% !important;
            }
          }
          
          /* Responsive Design */
          @media (max-width: 768px) {
            .admin-container {
              padding: 16px 12px !important;
              max-width: 100vw !important;
              overflow-x: hidden !important;
            }
            
            .admin-header {
              margin-bottom: 24px !important;
              padding-bottom: 16px !important;
            }
            
            .admin-title {
              font-size: 24px !important;
              margin-bottom: 4px !important;
            }
            
            .admin-subtitle {
              font-size: 14px !important;
            }
            
            .nav-container {
              margin-bottom: 20px !important;
              padding: 6px !important;
              max-width: 100% !important;
              overflow-x: hidden !important;
            }
            
            .nav-buttons {
              flex-direction: column !important;
              gap: 4px !important;
              width: 100% !important;
            }
            
            .nav-button {
              width: 100% !important;
              justify-content: center !important;
              padding: 12px 16px !important;
              font-size: 14px !important;
              box-sizing: border-box !important;
            }
            
            .section-header {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 16px !important;
              margin-bottom: 20px !important;
              padding-bottom: 12px !important;
              width: 100% !important;
            }
            
            .section-title {
              font-size: 20px !important;
              margin-bottom: 4px !important;
            }
            
            .section-subtitle {
              font-size: 13px !important;
            }
            
            .section-actions {
              width: 100% !important;
              flex-direction: column !important;
              gap: 8px !important;
            }
            
            .action-button {
              width: 100% !important;
              justify-content: center !important;
              padding: 12px 16px !important;
              font-size: 14px !important;
              box-sizing: border-box !important;
            }
            
            .stats-grid {
              grid-template-columns: 1fr !important;
              gap: 16px !important;
              margin-bottom: 24px !important;
              width: 100% !important;
            }
            
            .stat-card {
              padding: 20px !important;
              text-align: left !important;
              width: 100% !important;
              box-sizing: border-box !important;
            }
            
            .stat-number {
              font-size: 32px !important;
              margin-bottom: 8px !important;
            }
            
            .stat-label {
              font-size: 14px !important;
            }
            
            .table-responsive {
              overflow-x: auto !important;
              -webkit-overflow-scrolling: touch !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            
            .table {
              min-width: 600px !important;
              font-size: 13px !important;
            }
            
            .table th,
            .table td {
              padding: 12px 8px !important;
              white-space: nowrap !important;
            }
            
            .table th {
              font-size: 12px !important;
              font-weight: 600 !important;
            }
            
            .badge {
              font-size: 11px !important;
              padding: 4px 8px !important;
            }
            
            .action-buttons {
              flex-direction: column !important;
              gap: 4px !important;
            }
            
            .action-buttons button {
              width: 100% !important;
              padding: 8px 12px !important;
              font-size: 11px !important;
            }
            
            /* Search Bar Mobile Styles */
            .search-container {
              flex-direction: column !important;
              gap: 16px !important;
              padding: 16px 0 !important;
              margin-bottom: 20px !important;
            }
            
            .search-input-container {
              max-width: 100% !important;
            }
            
            .search-input {
              font-size: 16px !important;
              padding: 14px 16px 14px 48px !important;
              border-radius: 10px !important;
            }
            
            .search-clear-button {
              width: 100% !important;
              padding: 14px 20px !important;
              font-size: 16px !important;
              justify-content: center !important;
            }
            
            .modal-content {
              margin: 16px !important;
              max-height: calc(100vh - 32px) !important;
              overflow-y: auto !important;
            }
            
            .modal-header {
              padding: 16px 20px !important;
            }
            
            .modal-title {
              font-size: 18px !important;
            }
            
            .modal-body {
              padding: 20px !important;
            }
            
            .form-group {
              margin-bottom: 16px !important;
            }
            
            .form-label {
              font-size: 13px !important;
              margin-bottom: 6px !important;
            }
            
            .form-control {
              padding: 10px 12px !important;
              font-size: 14px !important;
            }
            
            .modal-footer {
              padding: 16px 20px !important;
              flex-direction: column !important;
              gap: 8px !important;
            }
            
            .modal-footer button {
              width: 100% !important;
              padding: 12px 16px !important;
              font-size: 14px !important;
            }
          }
          
          @media (max-width: 480px) {
            .admin-container {
              padding: 12px 0 !important;
            }
            
            .admin-title {
              font-size: 20px !important;
            }
            
            .admin-subtitle {
              font-size: 13px !important;
            }
            
            .section-title {
              font-size: 18px !important;
            }
            
            .section-subtitle {
              font-size: 12px !important;
            }
            
            .nav-button {
              padding: 10px 12px !important;
              font-size: 13px !important;
            }
            
            .action-button {
              padding: 10px 12px !important;
              font-size: 13px !important;
            }
            
            .stat-card {
              padding: 16px !important;
            }
            
            .stat-number {
              font-size: 32px !important;
            }
            
            .stat-label {
              font-size: 14px !important;
            }
            
            .table {
              font-size: 12px !important;
            }
            
            .table th,
            .table td {
              padding: 8px 6px !important;
            }
            
            .badge {
              font-size: 10px !important;
              padding: 3px 6px !important;
            }
          }
        `}

      </style>

      <div className="admin-header" style={{
        marginBottom: '32px',

        paddingBottom: '24px',

        borderBottom: '1px solid #e5e7eb'

      }}>

        <h1 className="admin-title" style={{
          fontSize: '32px',

          fontWeight: '800',

          color: '#1f2937',

          margin: '0 0 8px 0',

          letterSpacing: '-0.025em'

        }}>

          Admin Dashboard

        </h1>

        <p className="admin-subtitle" style={{
          fontSize: '16px',

          color: '#6b7280',

          margin: '0',

          fontWeight: '400'

        }}>

          Manage users, records, and requests across the system

        </p>

      </div>



      {/* Navigation Tabs */}

      <div className="nav-container" style={{
        backgroundColor: 'white',

        borderRadius: '12px',

        padding: '8px',

        marginBottom: '24px',

        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',

        border: '1px solid #e5e7eb'

      }}>

        <div className="nav-buttons" style={{ display: 'flex', gap: '4px' }}>
          <button 

            className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            style={{

              backgroundColor: activeTab === 'dashboard' ? '#3b82f6' : 'transparent',

              color: activeTab === 'dashboard' ? 'white' : '#6b7280',

              padding: '12px 20px',

              borderRadius: '8px',

              border: 'none',

              fontSize: '14px',

              fontWeight: '500',

              cursor: 'pointer',

              display: 'flex',

              alignItems: 'center',

              gap: '8px'
            }}

            onClick={() => setActiveTab('dashboard')}

          >

            <FiUsers size={16} />

            Dashboard

          </button>

          <button 

            className={`nav-button ${activeTab === 'users' ? 'active' : ''}`}
            style={{

              backgroundColor: activeTab === 'users' ? '#3b82f6' : 'transparent',

              color: activeTab === 'users' ? 'white' : '#6b7280',

              padding: '12px 20px',

              borderRadius: '8px',

              border: 'none',

              fontSize: '14px',

              fontWeight: '500',

              cursor: 'pointer',

              display: 'flex',

              alignItems: 'center',

              gap: '8px'
            }}

            onClick={() => setActiveTab('users')}

          >

            <FiUsers size={16} />

            Users

          </button>

        </div>

      </div>



      {/* Dashboard Tab */}

      {activeTab === 'dashboard' && (

        <div style={{

          animation: 'fadeIn 0.3s ease-in-out',

          opacity: 1

        }}>

          <div className="stats-grid" style={{
            display: 'grid',

            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',

            gap: '20px',

            marginBottom: '32px'

          }}>

            <div 

              className="stat-card"
              style={{

                backgroundColor: 'white',

                borderRadius: '12px',

                padding: '24px',

                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',

                border: '1px solid #e5e7eb',

                cursor: 'pointer',

                transition: 'all 0.2s ease'

              }}

              onClick={() => setActiveTab('users')}

              onMouseOver={(e) => {

                e.target.style.transform = 'translateY(-2px)'

                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'

                e.target.style.borderColor = '#3b82f6'

              }}

              onMouseOut={(e) => {

                e.target.style.transform = 'translateY(0)'

                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'

                e.target.style.borderColor = '#e5e7eb'

              }}

            >

              <div className="stat-number" style={{
                fontSize: '32px',

                fontWeight: '700',

                color: '#3b82f6',

                marginBottom: '8px',

                lineHeight: '1',

                pointerEvents: 'none'

              }}>

                {dashboardData?.stats?.totalUsers || 0}

              </div>

              <div className="stat-label" style={{
                fontSize: '14px',

                color: '#6b7280',

                fontWeight: '500',

                pointerEvents: 'none'

              }}>

                Total Users

              </div>

            </div>

            <div 

              style={{

                backgroundColor: 'white',

                borderRadius: '12px',

                padding: '24px',

                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',

                border: '1px solid #e5e7eb'
              }}

            >

              <div style={{

                fontSize: '32px',

                fontWeight: '700',

                color: '#10b981',

                marginBottom: '8px',

                lineHeight: '1',

                pointerEvents: 'none'

              }}>

                {dashboardData?.stats?.totalRecords || 0}

              </div>

              <div style={{

                fontSize: '14px',

                color: '#6b7280',

                fontWeight: '500',

                pointerEvents: 'none'

              }}>

                Total Records

              </div>

            </div>

            <div 

              style={{

                backgroundColor: 'white',

                borderRadius: '12px',

                padding: '24px',

                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',

                border: '1px solid #e5e7eb'
              }}

            >

              <div style={{

                fontSize: '32px',

                fontWeight: '700',

                color: '#059669',

                marginBottom: '8px',

                lineHeight: '1',

                pointerEvents: 'none'

              }}>

                {dashboardData?.stats?.availableRecords || 0}

              </div>

              <div style={{

                fontSize: '14px',

                color: '#6b7280',

                fontWeight: '500',

                pointerEvents: 'none'

              }}>

                Available Records

              </div>

            </div>

            <div 

              style={{

                backgroundColor: 'white',

                borderRadius: '12px',

                padding: '24px',

                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',

                border: '1px solid #e5e7eb'
              }}

            >

              <div style={{

                fontSize: '32px',

                fontWeight: '700',

                color: '#f59e0b',

                marginBottom: '8px',

                lineHeight: '1',

                pointerEvents: 'none'

              }}>

                {dashboardData?.stats?.borrowedRecords || 0}

              </div>

              <div style={{

                fontSize: '14px',

                color: '#6b7280',

                fontWeight: '500',

                pointerEvents: 'none'

              }}>

                Borrowed Records

              </div>

            </div>

            <div 

              style={{

                backgroundColor: 'white',

                borderRadius: '12px',

                padding: '24px',

                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',

                border: '1px solid #e5e7eb'
              }}

            >

              <div style={{

                fontSize: '32px',

                fontWeight: '700',

                color: '#ef4444',

                marginBottom: '8px',

                lineHeight: '1',

                pointerEvents: 'none'

              }}>

                {dashboardData?.stats?.pendingRequests || 0}

              </div>

              <div style={{

                fontSize: '14px',

                color: '#6b7280',

                fontWeight: '500',

                pointerEvents: 'none'

              }}>

                Pending Requests

              </div>

            </div>

          </div>




          {/* Records Management Section */}
          <div className="content-card" style={{
            backgroundColor: 'white',

            borderRadius: '12px',

            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',

            border: '1px solid #e5e7eb',

            overflow: 'hidden'

          }}>

            <div className="content-header" style={{
              padding: '20px 24px',

              borderBottom: '1px solid #e5e7eb',

              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>

              <h2 className="content-title" style={{
                fontSize: '20px',
                fontWeight: '600',

                color: '#1f2937',

                margin: '0'
              }}>
                Records Management
              </h2>
              <div className="action-buttons" style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="action-button primary"
                  onClick={() => refetchRecords()}
                >
                  <FiRefreshCw /> Refresh
                </button>
                <button 
                  className="action-button warning"
                  onClick={() => setShowImportModal(true)}
                >
                  <FiUpload /> Import Excel
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div style={{
                display: 'flex',

                alignItems: 'center',

              gap: '16px',
              marginBottom: '24px',
              padding: '20px 24px 0 24px'
            }}>
              <div style={{ 
                position: 'relative', 
                flex: '1', 
                maxWidth: '500px' 
              }}>
                <input
                  type="text"
                  placeholder="Search by Account Number, Name, or PPO ID..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 44px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1f2937',
                    backgroundColor: 'white',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6'
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '16px',
                  color: '#9ca3af',
                  pointerEvents: 'none'
                }}>
                  🔍
            </div>

              </div>
              
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="action-button search-clear-button"
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#dc2626'
                    e.target.style.transform = 'translateY(-1px)'
                    e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#ef4444'
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  <FiX size={16} />
                  Clear Search
                </button>
              )}
            </div>

            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{
                  width: '100%',

                borderCollapse: 'collapse'
                }}>

                  <thead>

                  <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{

                      padding: '12px 16px',
                        textAlign: 'left',

                        fontWeight: '600',

                        color: '#374151',

                      borderBottom: '1px solid #e5e7eb',
                      fontSize: '14px'
                    }}>Name</th>
                      <th style={{

                      padding: '12px 16px',
                        textAlign: 'left',

                        fontWeight: '600',

                        color: '#374151',

                      borderBottom: '1px solid #e5e7eb',
                      fontSize: '14px'
                    }}>Category</th>
                      <th style={{

                      padding: '12px 16px',
                        textAlign: 'left',

                        fontWeight: '600',

                        color: '#374151',

                      borderBottom: '1px solid #e5e7eb',
                      fontSize: '14px'
                    }}>PPO ID</th>
                      <th style={{

                      padding: '12px 16px',
                        textAlign: 'left',

                        fontWeight: '600',

                        color: '#374151',

                      borderBottom: '1px solid #e5e7eb',
                      fontSize: '14px'
                    }}>Branch Code</th>
                      <th style={{

                      padding: '12px 16px',
                        textAlign: 'left',

                        fontWeight: '600',

                        color: '#374151',

                      borderBottom: '1px solid #e5e7eb',
                      fontSize: '14px'
                    }}>File ID</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: '14px'
                    }}>Account Number</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: '14px'
                    }}>Pension Status</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: '14px'
                    }}>Mobile</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: '14px'
                    }}>Status</th>

                    </tr>

                  </thead>

                  <tbody>

                  {recordsData?.records?.map(record => (
                    <tr key={record._id} style={{
                        borderBottom: '1px solid #f3f4f6',

                        transition: 'all 0.2s ease'

                      }}

                      onMouseOver={(e) => {

                      e.currentTarget.style.backgroundColor = '#f9fafb'
                      }}

                      onMouseOut={(e) => {

                      e.currentTarget.style.backgroundColor = 'transparent'
                      }}>

                        <td style={{

                        padding: '12px 16px',
                          fontSize: '14px',

                        color: '#1f2937',
                          fontWeight: '500'

                      }}>{record.name || record.title}</td>
                        <td style={{

                        padding: '12px 16px',
                          fontSize: '14px',

                        color: '#6b7280'
                      }}>{record.category}</td>
                        <td style={{

                        padding: '12px 16px',
                          fontSize: '14px',

                        color: '#6b7280'
                      }}>{record.ppoUniqueId || 'N/A'}</td>
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>{record.branchCode || 'N/A'}</td>
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>{record.fileId || 'N/A'}</td>
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>{record.employeeId || 'N/A'}</td>
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px'
                      }}>
                        <span className={`badge ${
                          record.pensionStatus === 'A' ? 'badge-success' :
                          record.pensionStatus === 'D' ? 'badge-danger' :
                          record.pensionStatus === 'S' ? 'badge-warning' : 'badge-secondary'
                        }`} style={{
                            padding: '4px 8px',

                          borderRadius: '4px',
                            fontSize: '12px',

                            fontWeight: '500'

                          }}>

                          {record.pensionStatus === 'A' ? 'Active' :
                           record.pensionStatus === 'D' ? 'Discontinued' :
                           record.pensionStatus === 'S' ? 'Suspended' : 
                           record.pensionStatus || 'N/A'}
                          </span>

                        </td>

                        <td style={{

                        padding: '12px 16px',
                          fontSize: '14px',

                          color: '#6b7280'

                      }}>{record.mobileNumber || 'N/A'}</td>
                        <td style={{

                        padding: '12px 16px',
                        fontSize: '14px'
                      }}>
                        {record.status === 'borrowed' && record.currentHolder ? (
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '6px',
                            alignItems: 'flex-start'
                          }}>
                            <span className="badge badge-warning" style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                            }}>
                              Borrowed
                            </span>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#4b5563', 
                              fontWeight: '500',
                              backgroundColor: '#f9fafb',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid #e5e7eb',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <span style={{ 
                                width: '6px', 
                                height: '6px', 
                                backgroundColor: '#10b981', 
                                borderRadius: '50%',
                                display: 'inline-block'
                              }}></span>
                              {record.currentHolder.name}
                            </div>
                          </div>
                        ) : (
                          <span className={`badge ${record.status === 'available' ? 'badge-success' : 'badge-warning'}`} style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                          }}>
                            {record.status}
                          </span>
                        )}
                      </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

              {/* Mobile Card View for Records */}
              <div className="mobile-card-view" style={{ display: 'none' }}>
                {recordsData?.records?.map(record => (
                  <div key={record._id} className="mobile-card">
                    <div className="mobile-card-header">
                      <h4 className="mobile-card-title">{record.name || record.title}</h4>
                      <div className="mobile-card-status">
                        {record.status === 'borrowed' && record.currentHolder ? (
              <div style={{
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '4px',
                            alignItems: 'flex-end'
                          }}>
                            <span className="badge badge-warning" style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '600',
                              textTransform: 'uppercase'
                            }}>
                              Borrowed
                            </span>
                            <div style={{ 
                              fontSize: '10px', 
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                              by {record.currentHolder.name}
              </div>
                          </div>
                        ) : (
                          <span className={`badge ${record.status === 'available' ? 'badge-success' : 'badge-warning'}`} style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            {record.status}
                          </span>
            )}
          </div>
        </div>
                    
                    <div className="mobile-card-details">
                      <div className="mobile-card-detail">
                        <div className="mobile-card-label">Category</div>
                        <div className="mobile-card-value">{record.category}</div>
                      </div>
                      <div className="mobile-card-detail">
                        <div className="mobile-card-label">PPO ID</div>
                        <div className="mobile-card-value">{record.ppoUniqueId || 'N/A'}</div>
                      </div>
                      <div className="mobile-card-detail">
                        <div className="mobile-card-label">Account Number</div>
                        <div className="mobile-card-value">{record.employeeId || 'N/A'}</div>
                      </div>
                      <div className="mobile-card-detail">
                        <div className="mobile-card-label">Pension Status</div>
                        <div className="mobile-card-value">
                          <span className={`badge ${
                            record.pensionStatus === 'A' ? 'badge-success' : 
                            record.pensionStatus === 'D' ? 'badge-danger' : 
                            record.pensionStatus === 'S' ? 'badge-warning' : 
                            'badge-secondary'
                          }`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                            {record.pensionStatus === 'A' ? 'Active' : 
                             record.pensionStatus === 'D' ? 'Discontinued' : 
                             record.pensionStatus === 'S' ? 'Suspended' : 
                             record.pensionStatus || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                  </div>
                ))}
              </div>
            
            {recordsData?.totalPages > 1 && (
              <div className="pagination-container" style={{
            display: 'flex',

                justifyContent: 'center',
            alignItems: 'center',

                gap: '8px',
                padding: '20px',
                backgroundColor: '#f9fafb'
              }}>
                <div className="pagination-info" style={{
                color: '#6b7280',

                  fontSize: '14px'
              }}>

                  Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, recordsData?.total || 0)} of {recordsData?.total || 0} records
            </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button

                    className="pagination-button"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                style={{

                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      background: 'white',
                      color: '#374151',
                      borderRadius: '6px',
                  cursor: 'pointer',

                      transition: 'all 0.2s',
                      fontSize: '14px'
                    }}
                  >
                    First
                  </button>
                  <button
                    className="pagination-button"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      background: 'white',
                      color: '#374151',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: '14px'
                    }}
                  >
                    Previous
              </button>

                  
                  {Array.from({ length: Math.min(5, recordsData?.totalPages || 0) }, (_, i) => {
                    const startPage = Math.max(1, currentPage - 2);
                    const page = startPage + i;
                    if (page > (recordsData?.totalPages || 0)) return null;
                    return (
              <button 

                        key={page}
                        className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                style={{

                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          background: currentPage === page ? '#3b82f6' : 'white',
                          color: currentPage === page ? 'white' : '#374151',
                          borderRadius: '6px',
                  cursor: 'pointer',

                          transition: 'all 0.2s',
                          fontSize: '14px'
                        }}
                      >
                        {page}
              </button>

                    );
                  })}
                  
                          <button

                    className="pagination-button"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === (recordsData?.totalPages || 0)}
                            style={{

                              padding: '8px 12px',

                      border: '1px solid #d1d5db',
                      background: 'white',
                      color: '#374151',
                              borderRadius: '6px',

                              cursor: 'pointer',

                      transition: 'all 0.2s',
                      fontSize: '14px'
                    }}
                  >
                    Next
                          </button>

                          <button

                    className="pagination-button"
                    onClick={() => setCurrentPage(recordsData?.totalPages || 0)}
                    disabled={currentPage === (recordsData?.totalPages || 0)}
                            style={{

                              padding: '8px 12px',

                      border: '1px solid #d1d5db',
                      background: 'white',
                      color: '#374151',
                              borderRadius: '6px',

                              cursor: 'pointer',

                      transition: 'all 0.2s',
                      fontSize: '14px'
                    }}
                  >
                    Last
                  </button>
                </div>
                <div className="records-per-page" style={{
                              display: 'flex',

                              alignItems: 'center',

                  gap: '8px',
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  <label>Records per page:</label>
                  <select 
                    value={recordsPerPage} 
                    onChange={(e) => {
                      setRecordsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      background: 'white',
                      fontSize: '14px'
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                        </div>

            </div>

          )}

        </div>
        </div>

      )}



      {/* Users Tab */}
      {activeTab === 'users' && (
        <div style={{

          animation: 'fadeIn 0.3s ease-in-out',

          opacity: 1

        }}>

          <div className="section-header" style={{
            display: 'flex',

            justifyContent: 'space-between',

            alignItems: 'center',

            marginBottom: '24px',

            paddingBottom: '16px',

            borderBottom: '1px solid #e5e7eb'

          }}>

            <div>

              <h3 className="section-title" style={{
                fontSize: '24px',

                fontWeight: '700',

                color: '#1f2937',

                margin: '0 0 4px 0',

                letterSpacing: '-0.025em'

              }}>

                Users Management
              </h3>

              <p className="section-subtitle" style={{
                fontSize: '14px',

                color: '#6b7280',

                margin: '0',

                fontWeight: '400'

              }}>

                Manage user accounts, roles, and permissions
              </p>

            </div>

            <div className="section-actions" style={{ display: 'flex', gap: '12px' }}>
              <button

                className="action-button success"
                style={{

                  padding: '10px 16px',

                  borderRadius: '8px',

                  fontSize: '14px',

                  whiteSpace: 'nowrap'

                }}

                onClick={() => {

                  refetchUsers()
                  toast.success('Users data refreshed successfully')
                }}

              >

                <FiRefreshCw size={16} />

                Refresh

              </button>

              <button 

                className="action-button primary"
                style={{

                  padding: '12px 20px',

                  borderRadius: '8px',

                  fontSize: '14px',

                  justifyContent: 'center',
                  lineHeight: '1',
                  height: 'auto'
                }}
                onClick={() => setShowAddUser(true)}
              >
                <FiPlus size={16} style={{ display: 'flex', alignItems: 'center' }} />
                <span style={{ display: 'flex', alignItems: 'center' }}>Add User</span>
              </button>

            </div>

          </div>



          {usersLoading ? (
            <div className="loading"><div className="spinner"></div></div>

          ) : (
            <>
            <div className="table-responsive">

              <table className="table">

                <thead>

                    <tr>

                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                    <th>Status</th>
                    <th>Records in Possession</th>

                    <th>Actions</th>

                  </tr>

                </thead>

                <tbody>

                    {usersData?.map(user => (
                      <tr 
                        key={user._id}
                        onClick={() => handleUserClick(user)}
                        style={{ 
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`badge ${user.role === 'admin' ? 'badge-info' : 'badge-success'}`}>
                            {user.role}
                        </span>

                      </td>

                        <td>
                          <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px' 
                          }}>
                            <span style={{ 
                            fontSize: '18px', 
                            fontWeight: '700', 
                            color: user.recordsInPossession > 0 ? '#3b82f6' : '#6b7280' 
                          }}>
                            {user.recordsInPossession || 0}
                          </span>
                          {user.recordsInPossession > 0 && (
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#6b7280',
                              backgroundColor: '#f3f4f6',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              record{user.recordsInPossession !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        </td>
                        <td>
                          <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                          <button

                            style={{

                              backgroundColor: '#f59e0b',

                              color: 'white',

                              padding: '8px 12px',

                              borderRadius: '6px',

                              border: 'none',

                              fontSize: '12px',

                              fontWeight: '500',

                              cursor: 'pointer',

                              transition: 'all 0.3s ease',

                              display: 'flex',

                              alignItems: 'center',

                              gap: '4px',

                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'

                            }}

                              onClick={() => handleEditUser(user)}
                            onMouseOver={(e) => {

                              e.target.style.backgroundColor = '#d97706'

                              e.target.style.transform = 'translateY(-1px)'

                              e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)'

                            }}

                            onMouseOut={(e) => {

                              e.target.style.backgroundColor = '#f59e0b'

                              e.target.style.transform = 'translateY(0)'

                              e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'

                            }}

                          >

                            <FiEdit size={14} />

                            Edit

                          </button>

                          <button

                            style={{

                              backgroundColor: '#ef4444',

                              color: 'white',

                              padding: '8px 12px',

                              borderRadius: '6px',

                              border: 'none',

                              fontSize: '12px',

                              fontWeight: '500',

                              cursor: 'pointer',

                              transition: 'all 0.3s ease',

                              display: 'flex',

                              alignItems: 'center',

                              gap: '4px',

                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'

                            }}

                              onClick={() => handleDeleteUser(user._id)}
                            onMouseOver={(e) => {

                              e.target.style.backgroundColor = '#dc2626'

                              e.target.style.transform = 'translateY(-1px)'

                              e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'

                            }}

                            onMouseOut={(e) => {

                              e.target.style.backgroundColor = '#ef4444'

                              e.target.style.transform = 'translateY(0)'

                              e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'

                            }}

                          >

                            <FiTrash2 size={14} />

                            Delete

                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

              {/* Mobile Card View for Users */}
              <div className="mobile-card-view" style={{ display: 'none' }}>
                {usersData?.map(user => (
                  <div key={user._id} className="mobile-card">
                    <div className="mobile-card-header">
                      <h4 className="mobile-card-title">{user.name}</h4>
                      <div className="mobile-card-status">
                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`} style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
          </div>
          
                    <div className="mobile-card-details">
                      <div className="mobile-card-detail">
                        <div className="mobile-card-label">Email</div>
                        <div className="mobile-card-value">{user.email}</div>
                      </div>
                      <div className="mobile-card-detail">
                        <div className="mobile-card-label">Role</div>
                        <div className="mobile-card-value">
                          <span className={`badge ${user.role === 'admin' ? 'badge-info' : 'badge-success'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                            {user.role}
                        </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mobile-card-actions">
                            <button
                        className="btn btn-warning btn-sm"
                        onClick={() => handleEditUser(user)}
                        style={{ fontSize: '12px', padding: '6px 12px', marginRight: '8px' }}
                      >
                        <FiEdit /> Edit
                            </button>
                            <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteUser(user._id)}
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        <FiTrash2 /> Delete
                            </button>
                          </div>
                  </div>
                  ))}
            </div>
            </>
          )}

        </div>

      )}






      {/* Add User Modal */}

      <SimpleModal

        isOpen={showAddUser}

        onClose={() => setShowAddUser(false)}

        title="Add New User"

      >

        <form onSubmit={async (e) => {

          e.preventDefault()

          const formData = new FormData(e.target)

          const data = Object.fromEntries(formData)
          
          // Set default password if not provided
          if (!data.password || data.password === '') {
            data.password = 'password123'
          }

          
          
          try {

            await axios.post('/api/admin/users', data)

            toast.success('User created successfully')

            setShowAddUser(false)

            refetchUsers()

          } catch (error) {

            toast.error(error.response?.data?.message || 'Failed to create user')

          }

        }}>

          <SimpleFormField

            label="Full Name"

            name="name"

            type="text"

            required

            placeholder="Enter full name"

          />

          
          
          <SimpleFormField

            label="Email Address"

            name="email"

            type="email"

            required

            placeholder="Enter email address"

          />

          
          
          <SimpleFormField

            label="Password"

            name="password"

            type="password"

            required

            defaultValue="password123"

            placeholder="Default password: password123"

          />
          
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px', 
            backgroundColor: '#fef3c7', 
            border: '1px solid #f59e0b', 
            borderRadius: '6px',
            fontSize: '14px',
            color: '#92400e'
          }}>
            <strong>Note:</strong> The user will be required to change this default password on their first login.
          </div>

          
          
          <SimpleFormField

            label="User Role"

            name="role"

            type="select"

            required

            options={[

              { value: 'user', label: 'Regular User' },

              { value: 'recordManager', label: 'Record Manager' },
              { value: 'admin', label: 'Administrator' }

            ]}

          />

          
          
          <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>

            <button 

              type="submit" 

              style={{

                flex: 1,

                backgroundColor: '#3b82f6',

                color: 'white',

                padding: '12px 16px',

                borderRadius: '8px',

                border: 'none',

                fontSize: '14px',

                fontWeight: '500',

                cursor: 'pointer',

                transition: 'all 0.3s ease',

                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'

              }}

              onMouseOver={(e) => {

                e.target.style.backgroundColor = '#2563eb'

                e.target.style.transform = 'translateY(-1px)'

                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'

              }}

              onMouseOut={(e) => {

                e.target.style.backgroundColor = '#3b82f6'

                e.target.style.transform = 'translateY(0)'

                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'

              }}

            >

              Create User

            </button>

            <button 

              type="button" 

              onClick={() => setShowAddUser(false)}

              style={{

                flex: 1,

                backgroundColor: '#6b7280',

                color: 'white',

                padding: '12px 16px',

                borderRadius: '8px',

                border: 'none',

                fontSize: '14px',

                fontWeight: '500',

                cursor: 'pointer',

                transition: 'all 0.3s ease',

                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'

              }}

              onMouseOver={(e) => {

                e.target.style.backgroundColor = '#4b5563'

                e.target.style.transform = 'translateY(-1px)'

              }}

              onMouseOut={(e) => {

                e.target.style.backgroundColor = '#6b7280'

                e.target.style.transform = 'translateY(0)'

              }}

            >

              Cancel

            </button>

          </div>

        </form>

      </SimpleModal>



      {/* Edit User Modal */}

      <SimpleModal

        isOpen={showEditUser && editingUser}

        onClose={() => {

          setShowEditUser(false)

          setEditingUser(null)

        }}

        title="Edit User"

      >

        {editingUser && (

          <form onSubmit={async (e) => {

            e.preventDefault()

            const formData = new FormData(e.target)

            const data = Object.fromEntries(formData)

            
            
            try {

              await axios.put(`/api/admin/users/${editingUser._id}`, data)

              toast.success('User updated successfully')

              setShowEditUser(false)

              setEditingUser(null)

              refetchUsers()

            } catch (error) {

              toast.error(error.response?.data?.message || 'Failed to update user')

            }

          }}>

            <SimpleFormField

              label="Full Name"

              name="name"

              type="text"

              value={editingUser.name}

              required

              placeholder="Enter full name"

            />

            
            
            <SimpleFormField

              label="Email Address"

              name="email"

              type="email"

              value={editingUser.email}

              required

              placeholder="Enter email address"

            />

            
            
            <SimpleFormField

              label="User Role"

              name="role"

              type="select"

              value={editingUser.role}

              required

              options={[

                { value: 'user', label: 'Regular User' },

                { value: 'recordManager', label: 'Record Manager' },
                { value: 'admin', label: 'Administrator' }

              ]}

            />

            
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '8px' 
              }}>
                New Password
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
              name="password"
              type="password"
              placeholder="Leave blank to keep current password"
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6'
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const passwordInput = document.querySelector('input[name="password"]')
                    if (passwordInput) {
                      passwordInput.value = 'password'
                      passwordInput.dispatchEvent(new Event('input', { bubbles: true }))
                    }
                  }}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#d97706'
                    e.target.style.transform = 'translateY(-1px)'
                    e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)'
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#f59e0b'
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  Reset
                </button>
              </div>
            </div>

            
            
            <SimpleFormField

              label="Account Status"

              name="isActive"

              type="select"

              value={editingUser.isActive ? 'true' : 'false'}

              options={[

                { value: 'true', label: 'Active' },

                { value: 'false', label: 'Inactive' }

              ]}

            />

            
            
            <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>

              <button 

                type="submit" 

                style={{

                  flex: 1,

                  backgroundColor: '#10b981',

                  color: 'white',

                  padding: '12px 16px',

                  borderRadius: '8px',

                  border: 'none',

                  fontSize: '14px',

                  fontWeight: '500',

                  cursor: 'pointer',

                  transition: 'all 0.3s ease',

                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'

                }}

                onMouseOver={(e) => {

                  e.target.style.backgroundColor = '#059669'

                  e.target.style.transform = 'translateY(-1px)'

                  e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'

                }}

                onMouseOut={(e) => {

                  e.target.style.backgroundColor = '#10b981'

                  e.target.style.transform = 'translateY(0)'

                  e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'

                }}

              >

                Update User

              </button>

              <button 

                type="button" 

                onClick={() => {

                  setShowEditUser(false)

                  setEditingUser(null)

                }}

                style={{

                  flex: 1,

                  backgroundColor: '#6b7280',

                  color: 'white',

                  padding: '12px 16px',

                  borderRadius: '8px',

                  border: 'none',

                  fontSize: '14px',

                  fontWeight: '500',

                  cursor: 'pointer',

                  transition: 'all 0.3s ease',

                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'

                }}

                onMouseOver={(e) => {

                  e.target.style.backgroundColor = '#4b5563'

                  e.target.style.transform = 'translateY(-1px)'

                }}

                onMouseOut={(e) => {

                  e.target.style.backgroundColor = '#6b7280'

                  e.target.style.transform = 'translateY(0)'

                }}

              >

                Cancel

              </button>

            </div>

          </form>

        )}

      </SimpleModal>



      {/* Add Record Modal */}

      <SimpleModal

        isOpen={showAddRecord}

        onClose={() => setShowAddRecord(false)}

        title="Add New Record"

      >

        <form onSubmit={async (e) => {

          e.preventDefault()

          const formData = new FormData(e.target)

          const data = Object.fromEntries(formData)

          
          
          try {

            await axios.post('/api/records', data)

            toast.success('Record created successfully')

            setShowAddRecord(false)

            refetchRecords()

          } catch (error) {

            toast.error(error.response?.data?.message || 'Failed to create record')

          }

        }}>

          <SimpleFormField

            label="Record Title"

            name="title"

            type="text"

            required

            placeholder="Enter record title"

          />

          
          
          <SimpleFormField

            label="Category"

            name="category"

            type="text"

            required

            placeholder="Enter category (e.g., Books, Documents, etc.)"

          />

          
          
          <div style={{ marginBottom: '20px' }}>

            <label style={{

              display: 'block',

              fontSize: '14px',

              fontWeight: '500',

              color: '#374151',

              marginBottom: '6px'

            }}>

              Description

            </label>

            <textarea

              name="description"

              placeholder="Enter record description (optional)"

              rows={3}

              style={{

                width: '100%',

                padding: '12px 16px',

                border: '2px solid #e5e7eb',

                borderRadius: '8px',

                fontSize: '14px',

                backgroundColor: '#f9fafb',

                transition: 'all 0.3s ease',

                outline: 'none',

                resize: 'vertical'

              }}

              onFocus={(e) => {

                e.target.style.borderColor = '#3b82f6'

                e.target.style.backgroundColor = 'white'

                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'

              }}

              onBlur={(e) => {

                e.target.style.borderColor = '#e5e7eb'

                e.target.style.backgroundColor = '#f9fafb'

                e.target.style.boxShadow = 'none'

              }}

            />

          </div>

          
          
          <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>

            <button 

              type="submit" 

              style={{

                flex: 1,

                backgroundColor: '#3b82f6',

                color: 'white',

                padding: '12px 16px',

                borderRadius: '8px',

                border: 'none',

                fontSize: '14px',

                fontWeight: '500',

                cursor: 'pointer',

                transition: 'all 0.3s ease',

                display: 'flex',

                alignItems: 'center',

                justifyContent: 'center',

                gap: '8px',

                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'

              }}

              onMouseOver={(e) => {

                e.target.style.backgroundColor = '#2563eb'

                e.target.style.transform = 'translateY(-1px)'

                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'

              }}

              onMouseOut={(e) => {

                e.target.style.backgroundColor = '#3b82f6'

                e.target.style.transform = 'translateY(0)'

                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'

              }}

            >

              Create Record

            </button>

            <button 

              type="button" 

              onClick={() => setShowAddRecord(false)}

              style={{

                flex: 1,

                backgroundColor: '#6b7280',

                color: 'white',

                padding: '12px 16px',

                borderRadius: '8px',

                border: 'none',

                fontSize: '14px',

                fontWeight: '500',

                cursor: 'pointer',

                transition: 'all 0.3s ease',

                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'

              }}

              onMouseOver={(e) => {

                e.target.style.backgroundColor = '#4b5563'

                e.target.style.transform = 'translateY(-1px)'

              }}

              onMouseOut={(e) => {

                e.target.style.backgroundColor = '#6b7280'

                e.target.style.transform = 'translateY(0)'

              }}

            >

              Cancel

            </button>

          </div>

        </form>

      </SimpleModal>



      {/* Edit Record Modal */}

      <SimpleModal

        isOpen={showEditRecord && editingRecord}

        onClose={() => {

          setShowEditRecord(false)

          setEditingRecord(null)

        }}

        title="Edit Record"

      >

        {editingRecord && (

          <form onSubmit={async (e) => {

            e.preventDefault()

            const formData = new FormData(e.target)

            const data = Object.fromEntries(formData)

            
            
            try {

              await axios.put(`/api/records/${editingRecord._id}`, data)

              toast.success('Record updated successfully')

              setShowEditRecord(false)

              setEditingRecord(null)

              refetchRecords()

            } catch (error) {

              toast.error(error.response?.data?.message || 'Failed to update record')

            }

          }}>

            <SimpleFormField

              label="Record Title"

              name="title"

              type="text"

              value={editingRecord.title}

              required

              placeholder="Enter record title"

            />

            
            
            <SimpleFormField

              label="Category"

              name="category"

              type="text"

              value={editingRecord.category}

              required

              placeholder="Enter category (e.g., Books, Documents, etc.)"

            />

            
            
            <div style={{ marginBottom: '20px' }}>

              <label style={{

                display: 'block',

                fontSize: '14px',

                fontWeight: '500',

                color: '#374151',

                marginBottom: '6px'

              }}>

                Description

              </label>

              <textarea

                name="description"

                value={editingRecord.description || ''}

                placeholder="Enter record description (optional)"

                rows={3}

                style={{

                  width: '100%',

                  padding: '12px 16px',

                  border: '2px solid #e5e7eb',

                  borderRadius: '8px',

                  fontSize: '14px',

                  backgroundColor: '#f9fafb',

                  transition: 'all 0.3s ease',

                  outline: 'none',

                  resize: 'vertical'

                }}

                onFocus={(e) => {

                  e.target.style.borderColor = '#3b82f6'

                  e.target.style.backgroundColor = 'white'

                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'

                }}

                onBlur={(e) => {

                  e.target.style.borderColor = '#e5e7eb'

                  e.target.style.backgroundColor = '#f9fafb'

                  e.target.style.boxShadow = 'none'

                }}

              />

            </div>

            
            
            <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>

              <button 

                type="submit" 

                style={{

                  flex: 1,

                  backgroundColor: '#10b981',

                  color: 'white',

                  padding: '12px 16px',

                  borderRadius: '8px',

                  border: 'none',

                  fontSize: '14px',

                  fontWeight: '500',

                  cursor: 'pointer',

                  transition: 'all 0.3s ease',

                  display: 'flex',

                  alignItems: 'center',

                  justifyContent: 'center',

                  gap: '8px',

                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'

                }}

                onMouseOver={(e) => {

                  e.target.style.backgroundColor = '#059669'

                  e.target.style.transform = 'translateY(-1px)'

                  e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'

                }}

                onMouseOut={(e) => {

                  e.target.style.backgroundColor = '#10b981'

                  e.target.style.transform = 'translateY(0)'

                  e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'

                }}

              >

                Update Record

              </button>

              <button 

                type="button" 

                onClick={() => {

                  setShowEditRecord(false)

                  setEditingRecord(null)

                }}

                style={{

                  flex: 1,

                  backgroundColor: '#6b7280',

                  color: 'white',

                  padding: '12px 16px',

                  borderRadius: '8px',

                  border: 'none',

                  fontSize: '14px',

                  fontWeight: '500',

                  cursor: 'pointer',

                  transition: 'all 0.3s ease',

                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'

                }}

                onMouseOver={(e) => {

                  e.target.style.backgroundColor = '#4b5563'

                  e.target.style.transform = 'translateY(-1px)'

                }}

                onMouseOut={(e) => {

                  e.target.style.backgroundColor = '#6b7280'

                  e.target.style.transform = 'translateY(0)'

                }}

              >

                Cancel

              </button>

            </div>

          </form>

        )}

      </SimpleModal>



      {/* Import Modal */}

      <SimpleModal

        isOpen={showImportModal}

        onClose={() => setShowImportModal(false)}

        title="Import Records from Excel"

      >

        <form onSubmit={handleFileUpload}>

          <div style={{ marginBottom: '24px' }}>

            <label style={{

              display: 'block',

              fontSize: '14px',

              fontWeight: '500',

              color: '#374151',

              marginBottom: '8px'

            }}>

              Excel File

              <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>

            </label>

            <div style={{

              border: '2px dashed #d1d5db',

              borderRadius: '8px',

              padding: '24px',

              textAlign: 'center',

              transition: 'all 0.3s ease',

              cursor: 'pointer',

              backgroundColor: selectedFile ? '#f0f9ff' : '#f9fafb'

            }}

            onMouseOver={(e) => {

              e.target.style.borderColor = '#3b82f6'

              e.target.style.backgroundColor = '#f0f9ff'

            }}

            onMouseOut={(e) => {

              e.target.style.borderColor = '#d1d5db'

              e.target.style.backgroundColor = selectedFile ? '#f0f9ff' : '#f9fafb'

            }}>

              <input 

                type="file" 

                name="file" 

                style={{ display: 'none' }}

                id="file-upload"

                accept=".xlsx,.xls"

                onChange={(e) => setSelectedFile(e.target.files[0])}

                required 

              />

              <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>

                <FiUpload style={{ 

                  margin: '0 auto 16px auto', 

                  height: '48px', 

                  width: '48px', 

                  color: selectedFile ? '#3b82f6' : '#9ca3af' 

                }} />

                <p style={{ 

                  fontSize: '16px', 

                  fontWeight: '500', 

                  color: '#1f2937', 

                  margin: '0 0 8px 0' 

                }}>

                  {selectedFile ? selectedFile.name : 'Click to upload Excel file'}

                </p>

                <p style={{ 

                  fontSize: '14px', 

                  color: '#6b7280', 

                  margin: '0' 

                }}>

                  Supports .xlsx and .xls files

                </p>

              </label>

            </div>

          </div>

          
          
          <div style={{

            backgroundColor: '#f0f9ff',

            border: '1px solid #bfdbfe',

            borderRadius: '8px',

            padding: '16px',

            marginBottom: '24px'

          }}>

            <h4 style={{ 
              fontWeight: '500', 
              color: '#1e40af', 
              margin: '0 0 12px 0',
              fontSize: '14px'
            }}>
              ⚠️ This will replace ALL existing records with new data from Excel
            </h4>
            <h4 style={{ 

              fontWeight: '500', 

              color: '#1e40af', 

              margin: '0 0 12px 0',

              fontSize: '14px'

            }}>

              Required Excel Columns:

            </h4>

            <div style={{ 

              display: 'grid', 

              gridTemplateColumns: '1fr 1fr', 

              gap: '8px',

              fontSize: '13px',

              color: '#1e40af'

            }}>

              <div>• Branch code (optional)</div>
              <div>• file id (optional)</div>
              <div>• a (Employee ID - optional)</div>
              <div>• NAME (required)</div>
              <div>• PPO_UNIQUE_ID (optional)</div>
              <div>• PENSION_STATUS (optional)</div>
              <div>• GROUP_ID (required)</div>
              <div>• m (Mobile - optional)</div>
            </div>

          </div>

          
          
          <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>

            <button 

              type="submit" 

              style={{

                flex: 1,

                backgroundColor: selectedFile ? '#10b981' : '#9ca3af',

                color: 'white',

                padding: '12px 16px',

                borderRadius: '8px',

                border: 'none',

                fontSize: '14px',

                fontWeight: '500',

                cursor: selectedFile ? 'pointer' : 'not-allowed',

                transition: 'all 0.3s ease',

                display: 'flex',

                alignItems: 'center',

                justifyContent: 'center',

                gap: '8px',

                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'

              }}

              disabled={!selectedFile}

              onMouseOver={(e) => {

                if (selectedFile) {

                  e.target.style.backgroundColor = '#059669'

                  e.target.style.transform = 'translateY(-1px)'

                  e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'

                }

              }}

              onMouseOut={(e) => {

                if (selectedFile) {

                  e.target.style.backgroundColor = '#10b981'

                  e.target.style.transform = 'translateY(0)'

                  e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'

                }

              }}

            >

              <FiUpload size={16} />

              Import Records

            </button>

            <button 

              type="button" 

              onClick={() => setShowImportModal(false)}

              style={{

                flex: 1,

                backgroundColor: '#6b7280',

                color: 'white',

                padding: '12px 16px',

                borderRadius: '8px',

                border: 'none',

                fontSize: '14px',

                fontWeight: '500',

                cursor: 'pointer',

                transition: 'all 0.3s ease',

                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'

              }}

              onMouseOver={(e) => {

                e.target.style.backgroundColor = '#4b5563'

                e.target.style.transform = 'translateY(-1px)'

              }}

              onMouseOut={(e) => {

                e.target.style.backgroundColor = '#6b7280'

                e.target.style.transform = 'translateY(0)'

              }}

            >

              Cancel

            </button>

          </div>

        </form>

      </SimpleModal>

      {/* User Records Modal */}
      <SimpleModal
        isOpen={showUserRecordsModal}
        onClose={() => {
          setShowUserRecordsModal(false)
          setSelectedUser(null)
        }}
        title={`Records for ${selectedUser?.name || 'User'}`}
      >
        {selectedUser && (
          <div>
            <div style={{ 
              marginBottom: '20px', 
              padding: '16px', 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1f2937', fontSize: '16px' }}>
                {selectedUser.name}
              </h4>
              <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                {selectedUser.email}
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                Total Records: {selectedUser.recordsInPossession || 0}
              </p>
            </div>

            {userRecordsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div>Loading records...</div>
              </div>
            ) : userRecordsData?.length > 0 ? (
              <>
                 {/* Desktop Table View */}
                 <div className="table-container" style={{ display: 'block' }}>
                   <table className="data-table">
                     <thead>
                       <tr>
                         <th>Record Title</th>
                         <th>Category</th>
                         <th>Account Number</th>
                         <th>PPO ID</th>
                         <th>Branch Code</th>
                         <th>File ID</th>
                         <th>Borrowed Date</th>
                       </tr>
                     </thead>
                     <tbody>
                       {userRecordsData.map(record => (
                         <tr key={record._id}>
                           <td style={{ fontWeight: '500' }}>{record.name || record.title}</td>
                           <td>{record.category}</td>
                           <td>{record.employeeId || 'N/A'}</td>
                           <td>{record.ppoUniqueId || 'N/A'}</td>
                           <td>{record.branchCode || 'N/A'}</td>
                           <td>{record.fileId || 'N/A'}</td>
                           <td style={{ color: '#6b7280', fontSize: '13px' }}>
                             {record.borrowedDate ? new Date(record.borrowedDate).toLocaleDateString() : 'N/A'}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>

                {/* Mobile Card View */}
                <div className="mobile-records-view" style={{ display: 'none' }}>
                  {userRecordsData.map(record => (
                    <div key={record._id} className="mobile-record-card" style={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: '12px'
                      }}>
                        <h5 style={{ 
                          margin: '0', 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          color: '#1f2937' 
                        }}>
                          {record.name || record.title}
                        </h5>
                        <span style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          backgroundColor: '#f3f4f6',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>
                          {record.category}
                        </span>
                      </div>
                      
                       <div style={{ 
                         display: 'grid', 
                         gridTemplateColumns: '1fr 1fr', 
                         gap: '8px',
                         fontSize: '14px'
                       }}>
                         <div>
                           <div style={{ 
                             fontSize: '12px', 
                             color: '#6b7280', 
                             fontWeight: '500',
                             marginBottom: '2px'
                           }}>
                             Account Number
                           </div>
                           <div style={{ color: '#374151', fontWeight: '500' }}>
                             {record.employeeId || 'N/A'}
                           </div>
                         </div>
                         <div>
                           <div style={{ 
                             fontSize: '12px', 
                             color: '#6b7280', 
                             fontWeight: '500',
                             marginBottom: '2px'
                           }}>
                             PPO ID
                           </div>
                           <div style={{ color: '#374151', fontWeight: '500' }}>
                             {record.ppoUniqueId || 'N/A'}
                           </div>
                         </div>
                         <div>
                           <div style={{ 
                             fontSize: '12px', 
                             color: '#6b7280', 
                             fontWeight: '500',
                             marginBottom: '2px'
                           }}>
                             Branch Code
                           </div>
                           <div style={{ color: '#374151', fontWeight: '500' }}>
                             {record.branchCode || 'N/A'}
                           </div>
                         </div>
                         <div>
                           <div style={{ 
                             fontSize: '12px', 
                             color: '#6b7280', 
                             fontWeight: '500',
                             marginBottom: '2px'
                           }}>
                             File ID
                           </div>
                           <div style={{ color: '#374151', fontWeight: '500' }}>
                             {record.fileId || 'N/A'}
                           </div>
                         </div>
                         <div style={{ gridColumn: '1 / -1' }}>
                           <div style={{ 
                             fontSize: '12px', 
                             color: '#6b7280', 
                             fontWeight: '500',
                             marginBottom: '2px'
                           }}>
                             Borrowed Date
                           </div>
                           <div style={{ color: '#374151', fontWeight: '500' }}>
                             {record.borrowedDate ? new Date(record.borrowedDate).toLocaleDateString() : 'N/A'}
                           </div>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                No records currently borrowed by this user.
              </div>
            )}
          </div>
        )}
      </SimpleModal>

      <style jsx>{`
        /* Badge Styles */
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .badge-success {
          background: #d1fae5;
          color: #065f46;
        }
        .badge-warning {
          background: #fef3c7;
          color: #92400e;
        }
        .badge-danger {
          background: #fee2e2;
          color: #991b1b;
        }
        .badge-info {
          background: #dbeafe;
          color: #1e40af;
        }
        .badge-secondary {
          background: #f3f4f6;
          color: #374151;
        }
        .badge-primary {
          background: #dbeafe;
          color: #1e40af;
        }
        
        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .table-container {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            border-radius: 8px !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          }

          .data-table {
            min-width: 800px !important;
            font-size: 14px !important;
          }

          .data-table th {
            padding: 12px 8px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            white-space: nowrap !important;
            background-color: #f8fafc !important;
            border-bottom: 2px solid #e5e7eb !important;
          }

          .data-table td {
            padding: 12px 8px !important;
            font-size: 13px !important;
            vertical-align: middle !important;
            border-bottom: 1px solid #f3f4f6 !important;
          }

          /* Hide less important columns on mobile */
          .data-table th:nth-child(4), /* Branch Code */
          .data-table td:nth-child(4),
          .data-table th:nth-child(5), /* File ID */
          .data-table td:nth-child(5),
          .data-table th:nth-child(8), /* Mobile */
          .data-table td:nth-child(8) {
            display: none !important;
          }

          /* Compact action buttons */
          .data-table td:last-child {
            min-width: 80px !important;
          }

          .data-table td:last-child button {
            padding: 6px 8px !important;
            font-size: 11px !important;
            margin: 2px !important;
          }

          /* Status badge adjustments */
          .data-table td .badge {
            font-size: 10px !important;
            padding: 3px 6px !important;
          }

          /* User Management Table Mobile Styles */
          .table-responsive {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            border-radius: 8px !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          }

          .table {
            min-width: 600px !important;
            font-size: 14px !important;
          }

          .table th {
            padding: 12px 8px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            white-space: nowrap !important;
            background-color: #f8fafc !important;
            border-bottom: 2px solid #e5e7eb !important;
          }

          .table td {
            padding: 12px 8px !important;
            font-size: 13px !important;
            vertical-align: middle !important;
            border-bottom: 1px solid #f3f4f6 !important;
          }

          /* Compact action buttons for user table */
          .table td:last-child {
            min-width: 80px !important;
          }

          .table td:last-child button {
            padding: 6px 8px !important;
            font-size: 11px !important;
            margin: 2px !important;
          }

          /* Status badge adjustments for user table */
          .table td .badge {
            font-size: 10px !important;
            padding: 3px 6px !important;
          }

          /* Card layout for very small screens */
          @media (max-width: 480px) {
            .table-container {
              overflow: visible !important;
            }

            .data-table {
              display: none !important;
            }

            .table-responsive {
              overflow: visible !important;
            }

            .table {
              display: none !important;
            }

            .mobile-card-view {
              display: block !important;
            }

            .mobile-card {
              background: white !important;
              border: 1px solid #e5e7eb !important;
              border-radius: 8px !important;
              margin-bottom: 12px !important;
              padding: 16px !important;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
            }

            .mobile-card-header {
              display: flex !important;
              justify-content: space-between !important;
              align-items: flex-start !important;
              margin-bottom: 12px !important;
            }

            .mobile-card-title {
              font-size: 16px !important;
              font-weight: 600 !important;
              color: #1f2937 !important;
              margin: 0 !important;
            }

            .mobile-card-status {
              margin-left: 12px !important;
            }

            .mobile-card-details {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 8px !important;
              margin-bottom: 12px !important;
            }

            .mobile-card-detail {
              display: flex !important;
              flex-direction: column !important;
            }

            .mobile-card-label {
              font-size: 11px !important;
              color: #6b7280 !important;
              font-weight: 500 !important;
              text-transform: uppercase !important;
              letter-spacing: 0.5px !important;
              margin-bottom: 2px !important;
            }

            .mobile-card-value {
              font-size: 13px !important;
              color: #374151 !important;
              font-weight: 500 !important;
            }

            .mobile-card-actions {
              display: flex !important;
              gap: 8px !important;
              justify-content: flex-end !important;
            }

            .mobile-card-actions button {
              padding: 8px 12px !important;
              font-size: 12px !important;
              border-radius: 6px !important;
            }
          }
        }
      `}</style>

      {/* Password Change Modal */}
      {showPasswordChangeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '100%',
            margin: '20px',
            position: 'relative',
            zIndex: 1001
          }}>
            <h2 style={{ 
              textAlign: 'center', 
              marginBottom: '20px', 
              color: '#1f2937',
              fontSize: '24px',
              fontWeight: '600'
            }}>
              Change Your Password
            </h2>
            <p style={{ 
              textAlign: 'center', 
              color: '#6b7280', 
              marginBottom: '30px',
              fontSize: '16px'
            }}>
              For security reasons, you must change your password before continuing.
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '8px' 
              }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '8px' 
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            
            <button
              style={{
                width: '100%',
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
              onClick={handlePasswordChange}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#2563eb'
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#3b82f6'
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <FiRefreshCw size={18} />
              Change Password
            </button>
          </div>
        </div>
      )}


          </div>

  )

}



export default AdminDashboard

