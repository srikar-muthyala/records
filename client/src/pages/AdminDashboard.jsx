import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiUsers, FiBook, FiClock, FiCheck, FiX, FiPlus, FiUpload, FiEdit, FiTrash2, FiRefreshCw } from 'react-icons/fi'
import SimpleModal from '../components/SimpleModal'
import SimpleFormField from '../components/SimpleFormField'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showAddUser, setShowAddUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [showAddRecord, setShowAddRecord] = useState(false)
  const [showEditRecord, setShowEditRecord] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

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
    () => axios.get('/api/admin/users'),
    {
      select: (data) => data.data
    }
  )

  // Records
  const { data: recordsData, isLoading: recordsLoading, refetch: refetchRecords } = useQuery(
    'adminRecords',
    () => axios.get('/api/records'),
    {
      select: (data) => data.data
    }
  )

  // Requests
  const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests } = useQuery(
    'adminRequests',
    () => axios.get('/api/admin/requests'),
    {
      select: (data) => data.data
    }
  )

  const handleApproveRequest = (request) => {
    setSelectedRequest(request)
    setShowApproveModal(true)
  }

  const handleRejectRequest = (request) => {
    setSelectedRequest(request)
    setShowRejectModal(true)
  }

  const confirmApproveRequest = async () => {
    try {
      await axios.put(`/api/admin/requests/${selectedRequest._id}`, { 
        status: 'approved',
        adminResponse: 'Request approved'
      })
      toast.success('Request approved')
      refetchRequests()
      refetchRecords()
      refetchDashboard()
      setShowApproveModal(false)
      setSelectedRequest(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve request')
    }
  }

  const confirmRejectRequest = async () => {
    try {
      await axios.put(`/api/admin/requests/${selectedRequest._id}`, { 
        status: 'rejected',
        adminResponse: 'Request rejected'
      })
      toast.success('Request rejected')
      refetchRequests()
      refetchDashboard()
      setShowRejectModal(false)
      setSelectedRequest(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request')
    }
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setShowEditUser(true)
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
      toast.success(response.data.message)
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
    <div style={{ padding: '24px 0' }}>
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
        `}
      </style>
      <div style={{
        marginBottom: '32px',
        paddingBottom: '24px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          color: '#1f2937',
          margin: '0 0 8px 0',
          letterSpacing: '-0.025em'
        }}>
          Admin Dashboard
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          margin: '0',
          fontWeight: '400'
        }}>
          Manage users, records, and requests across the system
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '8px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', gap: '4px' }}>
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
          <button 
            className={`nav-button ${activeTab === 'records' ? 'active' : ''}`}
            style={{
              backgroundColor: activeTab === 'records' ? '#3b82f6' : 'transparent',
              color: activeTab === 'records' ? 'white' : '#6b7280',
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
            onClick={() => setActiveTab('records')}
          >
            <FiBook size={16} />
            Records
          </button>
          <button 
            className={`nav-button ${activeTab === 'requests' ? 'active' : ''}`}
            style={{
              backgroundColor: activeTab === 'requests' ? '#3b82f6' : 'transparent',
              color: activeTab === 'requests' ? 'white' : '#6b7280',
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
            onClick={() => setActiveTab('requests')}
          >
            <FiClock size={16} />
            Requests
          </button>
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div style={{
          animation: 'fadeIn 0.3s ease-in-out',
          opacity: 1
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            <div 
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
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#3b82f6',
                marginBottom: '8px',
                lineHeight: '1',
                pointerEvents: 'none'
              }}>
                {dashboardData?.stats?.totalUsers || 0}
              </div>
              <div style={{
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
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setActiveTab('records')}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                e.target.style.borderColor = '#10b981'
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                e.target.style.borderColor = '#e5e7eb'
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
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setActiveTab('records')}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                e.target.style.borderColor = '#059669'
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                e.target.style.borderColor = '#e5e7eb'
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
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setActiveTab('records')}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                e.target.style.borderColor = '#f59e0b'
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                e.target.style.borderColor = '#e5e7eb'
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
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setActiveTab('requests')}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                e.target.style.borderColor = '#ef4444'
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                e.target.style.borderColor = '#e5e7eb'
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

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f8fafc'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FiClock size={20} />
                Recent Requests
              </h3>
            </div>
            {dashboardData?.recentRequests?.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: 'white'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>User</th>
                      <th style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>Record</th>
                      <th style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>Type</th>
                      <th style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>Date</th>
                      <th style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recentRequests.map(request => (
                      <tr key={request._id} style={{
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#f9fafb'
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = 'transparent'
                      }}>
                        <td style={{
                          padding: '16px 20px',
                          fontSize: '14px',
                          color: '#374151',
                          fontWeight: '500'
                        }}>{request.user?.name}</td>
                        <td style={{
                          padding: '16px 20px',
                          fontSize: '14px',
                          color: '#374151',
                          fontWeight: '500'
                        }}>{request.record?.title}</td>
                        <td style={{
                          padding: '16px 20px',
                          fontSize: '14px',
                          color: '#374151'
                        }}>
                          <span style={{
                            backgroundColor: request.requestType === 'borrow' ? '#dbeafe' : '#fef3c7',
                            color: request.requestType === 'borrow' ? '#1e40af' : '#92400e',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {request.requestType}
                          </span>
                        </td>
                        <td style={{
                          padding: '16px 20px',
                          fontSize: '14px',
                          color: '#6b7280'
                        }}>{new Date(request.createdAt).toLocaleDateString()}</td>
                        <td style={{
                          padding: '16px 20px'
                        }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              style={{
                                backgroundColor: '#10b981',
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
                              onClick={() => handleApproveRequest(request)}
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
                              <FiCheck size={14} />
                              Approve
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
                              onClick={() => handleRejectRequest(request)}
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
                              <FiX size={14} />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  fontSize: '48px',
                  color: '#d1d5db',
                  marginBottom: '16px'
                }}>
                  📋
                </div>
                <p style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  margin: '0 0 8px 0',
                  fontWeight: '500'
                }}>
                  No recent requests
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#9ca3af',
                  margin: '0',
                  fontWeight: '400'
                }}>
                  New requests will appear here when users submit them
                </p>
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
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1f2937',
                margin: '0 0 4px 0',
                letterSpacing: '-0.025em'
              }}>
                Users Management
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: '0',
                fontWeight: '400'
              }}>
                Manage user accounts, roles, and permissions
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => {
                  refetchUsers()
                  toast.success('Users data refreshed successfully')
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
                <FiRefreshCw size={16} />
                Refresh
              </button>
              <button 
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '12px 20px',
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
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  lineHeight: '1',
                  height: 'auto'
                }}
                onClick={() => setShowAddUser(true)}
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
                <FiPlus size={16} style={{ display: 'flex', alignItems: 'center' }} />
                <span style={{ display: 'flex', alignItems: 'center' }}>Add User</span>
              </button>
            </div>
          </div>

          {usersLoading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData?.map(user => (
                    <tr key={user._id}>
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
                        <div style={{ display: 'flex', gap: '8px' }}>
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
          )}
        </div>
      )}

      {/* Records Tab */}
      {activeTab === 'records' && (
        <div style={{
          animation: 'fadeIn 0.3s ease-in-out',
          opacity: 1
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1f2937',
                margin: '0 0 4px 0',
                letterSpacing: '-0.025em'
              }}>
                Records Management
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: '0',
                fontWeight: '400'
              }}>
                Manage library records, categories, and availability
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => {
                  refetchRecords()
                  toast.success('Records data refreshed successfully')
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
                <FiRefreshCw size={16} />
                Refresh
              </button>
              <button 
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => setShowAddRecord(true)}
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
                <FiPlus size={18} />
                Add Record
              </button>
              <button 
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => setShowImportModal(true)}
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
                <FiUpload size={18} />
                Import Excel
              </button>
            </div>
          </div>

          {recordsLoading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Current Holder</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recordsData?.records?.map(record => (
                    <tr key={record._id}>
                      <td>{record.title}</td>
                      <td>{record.category}</td>
                      <td>
                        <span className={`badge ${record.status === 'available' ? 'badge-success' : 'badge-warning'}`}>
                          {record.status}
                        </span>
                      </td>
                      <td>{record.currentHolder?.name || 'Available'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
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
                            onClick={() => handleEditRecord(record)}
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
                            onClick={() => handleDeleteRecord(record._id)}
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
          )}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div style={{
          animation: 'fadeIn 0.3s ease-in-out',
          opacity: 1
        }}>
          <div style={{
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1f2937',
              margin: '0 0 4px 0',
              letterSpacing: '-0.025em'
            }}>
              All Requests
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0',
              fontWeight: '400'
            }}>
              Review and manage all pending requests from users
            </p>
          </div>
          
          {requestsLoading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Record</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requestsData?.map(request => (
                    <tr key={request._id}>
                      <td>{request.user?.name}</td>
                      <td>{request.record?.title}</td>
                      <td>{request.requestType}</td>
                      <td>
                        <span className={`badge ${
                          request.status === 'pending' ? 'badge-warning' :
                          request.status === 'approved' ? 'badge-success' : 'badge-danger'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                      <td>
                        {request.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              style={{
                                backgroundColor: '#10b981',
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
                              onClick={() => handleApproveRequest(request)}
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
                              <FiCheck size={14} />
                              Approve
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
                              onClick={() => handleRejectRequest(request)}
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
                              <FiX size={14} />
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            placeholder="Enter password (min 6 characters)"
          />
          
          <SimpleFormField
            label="User Role"
            name="role"
            type="select"
            required
            options={[
              { value: 'user', label: 'Regular User' },
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
                { value: 'admin', label: 'Administrator' }
              ]}
            />
            
            <SimpleFormField
              label="New Password"
              name="password"
              type="password"
              placeholder="Leave blank to keep current password"
            />
            
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
              Required Excel Columns:
            </h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '8px',
              fontSize: '13px',
              color: '#1e40af'
            }}>
              <div>• title (required)</div>
              <div>• category (required)</div>
              <div>• description (optional)</div>
              <div>• author (optional)</div>
              <div>• year (optional)</div>
              <div>• isbn (optional)</div>
              <div>• publisher (optional)</div>
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

      {/* Approve Request Confirmation Modal */}
      <SimpleModal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false)
          setSelectedRequest(null)
        }}
        title="Approve Request"
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ 
            fontSize: '16px', 
            color: '#374151', 
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            Are you sure you want to approve this request?
          </p>
          
          {selectedRequest && (
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '20px'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#374151' }}>User:</strong> {selectedRequest.user?.name}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#374151' }}>Record:</strong> {selectedRequest.record?.title}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#374151' }}>Type:</strong> {selectedRequest.requestType}
              </div>
              <div>
                <strong style={{ color: '#374151' }}>Date:</strong> {new Date(selectedRequest.createdAt).toLocaleDateString()}
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={confirmApproveRequest}
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
              <FiCheck size={16} />
              Approve Request
            </button>
            <button 
              onClick={() => {
                setShowApproveModal(false)
                setSelectedRequest(null)
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#4b5563'
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.3)'
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#6b7280'
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <FiX size={16} />
              Cancel
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Reject Request Confirmation Modal */}
      <SimpleModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false)
          setSelectedRequest(null)
        }}
        title="Reject Request"
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ 
            fontSize: '16px', 
            color: '#374151', 
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            Are you sure you want to reject this request?
          </p>
          
          {selectedRequest && (
            <div style={{
              backgroundColor: '#fef2f2',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              marginBottom: '20px'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#374151' }}>User:</strong> {selectedRequest.user?.name}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#374151' }}>Record:</strong> {selectedRequest.record?.title}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#374151' }}>Type:</strong> {selectedRequest.requestType}
              </div>
              <div>
                <strong style={{ color: '#374151' }}>Date:</strong> {new Date(selectedRequest.createdAt).toLocaleDateString()}
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={confirmRejectRequest}
              style={{
                flex: 1,
                backgroundColor: '#ef4444',
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
              <FiX size={16} />
              Reject Request
            </button>
            <button 
              onClick={() => {
                setShowRejectModal(false)
                setSelectedRequest(null)
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#4b5563'
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.3)'
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#6b7280'
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <FiCheck size={16} />
              Cancel
            </button>
          </div>
        </div>
      </SimpleModal>
    </div>
  )
}

export default AdminDashboard
