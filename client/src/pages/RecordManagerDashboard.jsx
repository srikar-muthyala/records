import React, { useState } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiUsers, FiBook, FiClock, FiX, FiPlus, FiRefreshCw, FiEdit, FiUpload, FiUser } from 'react-icons/fi'
import SimpleModal from '../components/SimpleModal'

const RecordManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [requestTypeFilter, setRequestTypeFilter] = useState('')
  const [showUserRecordsModal, setShowUserRecordsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  
  // Pagination for Record Requests
  const [requestsCurrentPage, setRequestsCurrentPage] = useState(1)
  const [requestsPerPage, setRequestsPerPage] = useState(10)

  // Handle search
  const handleSearch = () => {
    setSearchQuery(searchTerm)
    setCurrentPage(1) // Reset to first page when searching
  }

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm('')
    setSearchQuery('')
    setCurrentPage(1)
  }

  // Handle status card click
  const handleStatusCardClick = (status, requestType = null) => {
    setStatusFilter(status)
    setRequestTypeFilter(requestType || '')
    setActiveTab('requests')
    setRequestsCurrentPage(1) // Reset to first page
  }

  // Dashboard stats
  const { data: dashboardData, isLoading: dashboardLoading, refetch: refetchDashboard } = useQuery(
    'recordManagerDashboard',
    () => axios.get('/api/record-manager/dashboard'),
    {
      select: (data) => data.data
    }
  )

  // Requests
  const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests } = useQuery(
    ['recordManagerRequests', statusFilter, requestTypeFilter],
    () => {
      const params = new URLSearchParams();
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      if (requestTypeFilter) {
        params.append('requestType', requestTypeFilter);
      }
      return axios.get(`/api/record-manager/requests?${params.toString()}`);
    },
    {
      select: (data) => data.data
    }
  )

  // Records
  const { data: recordsData, isLoading: recordsLoading, refetch: refetchRecords } = useQuery(
    ['recordManagerRecords', currentPage, recordsPerPage, searchQuery],
    () => {
      const params = new URLSearchParams({
        page: currentPage,
        limit: recordsPerPage
      })
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }
      return axios.get(`/api/records?${params}`)
    },
    {
      select: (data) => data.data
    }
  )

  // Users with record counts
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery(
    'recordManagerUsers',
    () => axios.get('/api/record-manager/users'),
    {
      select: (data) => data.data
    }
  )

  // User records query
  const { data: userRecordsData, isLoading: userRecordsLoading, refetch: refetchUserRecords } = useQuery(
    ['userRecords', selectedUser?._id],
    () => axios.get(`/api/record-manager/users/${selectedUser._id}/records`),
    {
      select: (data) => data.data,
      enabled: !!selectedUser
    }
  )


  const handleStatusChange = (request, newStatus) => {
    setSelectedRequest(request)
    setSelectedStatus(newStatus)
    setShowStatusModal(true)
  }

  const handleUserClick = (user) => {
    setSelectedUser(user)
    setShowUserRecordsModal(true)
  }

  const confirmStatusUpdate = async () => {
    try {
      await axios.put(`/api/record-manager/requests/${selectedRequest._id}`, {
        status: selectedStatus
      })
      toast.success(`Request status updated to ${getStatusLabel(selectedStatus)}`)
      setShowStatusModal(false)
      setSelectedRequest(null)
      setSelectedStatus('')
      refetchRequests()
      refetchDashboard()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update request status')
    }
  }

  const getStatusLabel = (status) => {
    const statusLabels = {
      'pending': 'Pending',
      'handed_over': 'Handed Over',
      'searching': 'Searching',
      'not_traceable': 'Not Traceable',
      'rejected': 'Rejected'
    }
    return statusLabels[status] || status
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
      console.error('Import error:', error)
      toast.error(error.response?.data?.message || 'Failed to import records')
    }
  }

  const handleConfirmReturn = async (requestId) => {
    try {
      await axios.put(`/api/record-manager/confirm-return/${requestId}`)
      toast.success('Return confirmed successfully')
      refetchRequests()
      refetchRecords()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to confirm return')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-warning', text: 'Pending' },
      approved: { class: 'badge-success', text: 'Approved' },
      rejected: { class: 'badge-danger', text: 'Rejected' },
      handed_over: { class: 'badge-info', text: 'Handed Over' },
      searching: { class: 'badge-primary', text: 'Searching' },
      not_traceable: { class: 'badge-secondary', text: 'Not Traceable' },
      awaiting_confirmation: { class: 'badge-warning', text: 'Awaiting Confirmation' }
    }
    const badge = badges[status] || { class: 'badge-secondary', text: status }
    return <span className={`badge ${badge.class}`}>{badge.text}</span>
  }

  const getPensionStatusBadge = (status) => {
    const badges = {
      'A': { class: 'badge-success', text: 'Active' },
      'D': { class: 'badge-danger', text: 'Discontinued' },
      'S': { class: 'badge-warning', text: 'Suspended' }
    }
    const badge = badges[status] || { class: 'badge-secondary', text: status || 'N/A' }
    return <span className={`badge ${badge.class}`}>{badge.text}</span>
  }

  const totalPages = Math.ceil((recordsData?.total || 0) / recordsPerPage)
  const startPage = Math.max(1, currentPage - 2)
  const endPage = Math.min(totalPages, currentPage + 2)

  if (dashboardLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <style jsx>{`
        body {
          overflow-x: hidden;
        }
        * {
          box-sizing: border-box;
        }
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .dashboard-header {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .dashboard-title {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .dashboard-subtitle {
          color: #6b7280;
          font-size: 16px;
        }
        .nav-tabs {
          display: flex;
          background: white;
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .nav-button {
          flex: 1;
          padding: 12px 16px;
          border: none;
          background: transparent;
          color: #6b7280;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .nav-button:hover {
          background: #f3f4f6;
          color: #374151;
        }
        .nav-button.active {
          background: #3b82f6;
          color: white;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          text-align: left;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid #e5e7eb;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-color: #3b82f6;
        }
        .stat-number {
          font-size: 32px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .stat-label {
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
        }
        .content-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .content-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .content-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }
        .action-buttons {
          display: flex;
          gap: 12px;
        }
        .action-button {
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .action-button.primary {
          background: #3b82f6;
          color: white;
        }
        .action-button.primary:hover {
          background: #2563eb;
        }
        .action-button.success {
          background: #10b981;
          color: white;
        }
        .action-button.success:hover {
          background: #059669;
        }
        .action-button.warning {
          background: #f59e0b;
          color: white;
        }
        .action-button.warning:hover {
          background: #d97706;
        }
        .action-button.danger {
          background: #ef4444;
          color: white;
        }
        .action-button.danger:hover {
          background: #dc2626;
        }
        .table-container {
          overflow-x: auto;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        .data-table th {
          background: #f9fafb;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }
        .data-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
        }
        .data-table tr:hover {
          background: #f9fafb;
        }
        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
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
        .badge-secondary {
          background: #f3f4f6;
          color: #374151;
        }
        .badge-primary {
          background: #dbeafe;
          color: #1e40af;
        }
        .pagination-container {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding: 20px;
          background: #f9fafb;
        }
        .pagination-button {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pagination-button:hover:not(:disabled) {
          background: #f3f4f6;
        }
        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pagination-button.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        .pagination-info {
          color: #6b7280;
          font-size: 14px;
        }
        .records-per-page {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6b7280;
          font-size: 14px;
        }
        .records-per-page select {
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
        }
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 16px;
          }
          .dashboard-header {
            padding: 16px;
          }
          .dashboard-title {
            font-size: 24px;
          }
          .nav-tabs {
            flex-direction: column;
            gap: 4px;
          }
          .nav-button {
            justify-content: flex-start;
          }
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .stat-card {
            padding: 16px;
            text-align: left;
          }
          .stat-number {
            font-size: 24px;
          }
          .content-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
          .action-buttons {
            width: 100%;
            flex-wrap: wrap;
          }
          .action-button {
            flex: 1;
            min-width: 120px;
          }
          .table-container {
            font-size: 14px;
          }
          .data-table th,
          .data-table td {
padding: 8px 12px;
          }
          .pagination-container {
            flex-direction: column;
            gap: 12px;
          }
          .pagination-info {
            order: -1;
          }
          
          /* Search Bar Mobile Styles */
          .search-container {
            padding: 16px 0 0 0 !important;
          }
          
          .search-container > div:first-child {
            flex-direction: column !important;
            gap: 12px !important;
          }
          
          .search-container input {
            width: 100% !important;
            maxWidth: none !important;
            fontSize: 16px !important;
            padding: 12px 40px 12px 16px !important;
          }
          
          .search-container .search-button {
            width: auto !important;
            padding: 10px 20px !important;
            fontSize: 14px !important;
            justifyContent: center !important;
            alignSelf: flex-start !important;
          }

          /* Records Management Table Mobile Styles */
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

          /* Compact action buttons for records table */
          .data-table td:last-child {
            min-width: 120px !important;
          }

          .data-table td:last-child button {
            padding: 6px 8px !important;
            font-size: 11px !important;
            margin: 2px !important;
          }

          /* Status badge adjustments for records table */
          .data-table td .badge {
            font-size: 10px !important;
            padding: 3px 6px !important;
          }

          /* Users table mobile styles */
          .users-table .data-table th,
          .users-table .data-table td {
            padding: 8px 12px !important;
            font-size: 13px !important;
          }

          .users-table .data-table th {
            font-size: 12px !important;
            font-weight: 600 !important;
            white-space: nowrap !important;
            background-color: #f8fafc !important;
            border-bottom: 2px solid #e5e7eb !important;
          }

          .users-table .data-table td {
            vertical-align: middle !important;
            border-bottom: 1px solid #f3f4f6 !important;
          }

          /* Users table mobile responsive */
          @media (max-width: 768px) {
            .users-table .data-table {
              min-width: 400px !important;
            }
          }

          /* User Records Modal Mobile Styles */
          @media (max-width: 768px) {
            .table-container {
              display: none !important;
            }
            
            .mobile-records-view {
              display: block !important;
            }
          }

          @media (min-width: 769px) {
            .mobile-records-view {
              display: none !important;
            }
          }

          /* Card layout for very small screens */
          @media (max-width: 480px) {
            .table-container {
              overflow: visible !important;
            }

            .data-table {
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

            /* Requests table mobile styles */
            .mobile-card-actions select {
              width: 100% !important;
              padding: 8px 12px !important;
              font-size: 12px !important;
              border-radius: 6px !important;
              border: 1px solid #d1d5db !important;
              background-color: white !important;
            }

            .mobile-card-actions select option {
              width: auto !important;
              max-width: 200px !important;
              padding: 8px 12px !important;
              font-size: 12px !important;
              white-space: nowrap !important;
            }
          }
        }
          @media (min-width: 769px) {
            .stat-card {
              text-align: left !important;
            }

            /* Desktop dropdown options styling */
            select option {
              width: auto !important;
              max-width: 200px !important;
              padding: 8px 12px !important;
              font-size: 12px !important;
              white-space: nowrap !important;
            }
          }
          @media (max-width: 768px) {
            .stat-card {
              text-align: left !important;
            }
          }
        }
      `}</style>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Record Manager Dashboard</h1>
          <p className="dashboard-subtitle">Manage record requests and records</p>
        </div>

        <div className="nav-tabs">
          <button 
            className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <FiUsers /> Dashboard
          </button>
          <button 
            className={`nav-button ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <FiClock /> Requests
          </button>
          <button 
            className={`nav-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FiUser /> Users
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <>
            <div className="stats-grid">
              <div 
                className="stat-card"
                onClick={() => handleStatusCardClick('pending', 'borrow')}
                style={{ borderColor: '#f59e0b' }}
              >
                <div className="stat-number" style={{ color: '#f59e0b' }}>{dashboardData?.pendingRequests || 0}</div>
                <div className="stat-label">Pending Requests</div>
              </div>
              <div 
                className="stat-card"
                onClick={() => handleStatusCardClick('pending', 'return')}
                style={{ borderColor: '#8b5cf6' }}
              >
                <div className="stat-number" style={{ color: '#8b5cf6' }}>{dashboardData?.returnRequests || 0}</div>
                <div className="stat-label">Return Requests</div>
              </div>
              <div 
                className="stat-card"
                onClick={() => handleStatusCardClick('handed_over')}
                style={{ borderColor: '#10b981' }}
              >
                <div className="stat-number" style={{ color: '#10b981' }}>{dashboardData?.approvedRequests || 0}</div>
                <div className="stat-label">Handed Over Records</div>
              </div>
              <div 
                className="stat-card"
                onClick={() => handleStatusCardClick('searching')}
                style={{ borderColor: '#3b82f6' }}
              >
                <div className="stat-number" style={{ color: '#3b82f6' }}>{dashboardData?.searchingRequests || 0}</div>
                <div className="stat-label">Searching Records</div>
              </div>
              <div 
                className="stat-card"
                onClick={() => handleStatusCardClick('not_traceable')}
                style={{ borderColor: '#6b7280' }}
              >
                <div className="stat-number" style={{ color: '#6b7280' }}>{dashboardData?.notTraceableRequests || 0}</div>
                <div className="stat-label">Not Traceable Records</div>
              </div>
            </div>

            <div className="content-card">
              <div className="content-header">
                <h2 className="content-title">Records Management</h2>
                <div className="action-buttons">
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
              <div className="search-container" style={{
                marginBottom: '24px',
                padding: '20px 24px 0 24px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ 
                    position: 'relative', 
                    flex: '1',
                    maxWidth: '600px'
                  }}>
                    <input
                      type="text"
                      placeholder="Search by Account Number, Name, or PPO ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 40px 12px 16px',
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
                    {searchTerm && (
                      <button
                        onClick={handleClearSearch}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#6b7280',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = '#f3f4f6'
                          e.target.style.color = '#374151'
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = 'transparent'
                          e.target.style.color = '#6b7280'
                        }}
                      >
                        <FiX size={16} />
                      </button>
                    )}
                  </div>
                  
                  <button
                    onClick={handleSearch}
                    className="action-button search-button"
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                      minWidth: '80px'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#2563eb'
                      e.target.style.transform = 'translateY(-1px)'
                      e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)'
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = '#3b82f6'
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = 'none'
                    }}
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>PPO ID</th>
                      <th>Branch Code</th>
                      <th>File ID</th>
                      <th>Account Number</th>
                      <th>Pension Status</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recordsData?.records?.map(record => (
                      <tr key={record._id}>
                        <td>{record.name || record.title}</td>
                        <td>{record.category}</td>
                        <td>{record.ppoUniqueId || 'N/A'}</td>
                        <td>{record.branchCode || 'N/A'}</td>
                        <td>{record.fileId || 'N/A'}</td>
                        <td>{record.employeeId || 'N/A'}</td>
                        <td>{getPensionStatusBadge(record.pensionStatus)}</td>
                        <td>
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

              {/* Mobile Card View for Records Management */}
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
                          {getPensionStatusBadge(record.pensionStatus)}
                        </div>
                      </div>
                      <div className="mobile-card-detail">
                        <div className="mobile-card-label">Branch Code</div>
                        <div className="mobile-card-value">{record.branchCode || 'N/A'}</div>
                      </div>
                      <div className="mobile-card-detail">
                        <div className="mobile-card-label">File ID</div>
                        <div className="mobile-card-value">{record.fileId || 'N/A'}</div>
                      </div>
                    </div>
                    
                  </div>
                ))}
              </div>
              
              {recordsData?.totalPages > 1 && (
                <div className="pagination-container">
                  <div className="pagination-info">
                    Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, recordsData?.total || 0)} of {recordsData?.total || 0} records
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      className="pagination-button"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      First
                    </button>
                    <button
                      className="pagination-button"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page => (
                      <button
                        key={page}
                        className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      className="pagination-button"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                    <button
                      className="pagination-button"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </button>
                  </div>
                  <div className="records-per-page">
                    <label>Records per page:</label>
                    <select 
                      value={recordsPerPage} 
                      onChange={(e) => {
                        setRecordsPerPage(Number(e.target.value))
                        setCurrentPage(1)
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
          </>
        )}

        {activeTab === 'requests' && (
          <div className="content-card">
            <div className="content-header">
              <div>
                <h2 className="content-title">Record Requests</h2>
                {(statusFilter || requestTypeFilter) && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px 12px', 
                    backgroundColor: '#f3f4f6', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#374151',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>
                      Filtered by: 
                      {statusFilter && <strong> {statusFilter.replace('_', ' ')}</strong>}
                      {requestTypeFilter && <strong> {requestTypeFilter} requests</strong>}
                    </span>
                    <button
                      onClick={() => {
                        setStatusFilter('')
                        setRequestTypeFilter('')
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        padding: '2px',
                        borderRadius: '4px'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#e5e7eb'
                        e.target.style.color = '#374151'
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = 'transparent'
                        e.target.style.color = '#6b7280'
                      }}
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="action-buttons">
                <button 
                  className="action-button primary"
                  onClick={() => refetchRequests()}
                >
                  <FiRefreshCw /> Refresh
                </button>
              </div>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Record</th>
                    {requestTypeFilter === 'return' ? (
                      <>
                        <th>Return Date</th>
                        <th>File ID</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </>
                    ) : (
                      <>
                        <th>Account Number</th>
                        <th>PPO ID</th>
                        <th>Branch Code</th>
                        <th>File ID</th>
                        <th>Category</th>
                        <th>Request Date</th>
                        <th>Message</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {requestsData
                    ?.slice((requestsCurrentPage - 1) * requestsPerPage, requestsCurrentPage * requestsPerPage)
                    ?.map(request => (
                    <tr key={request._id}>
                      <td>{request.user?.name}</td>
                      <td>{request.record?.title}</td>
                      {requestTypeFilter === 'return' ? (
                        <>
                          <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                          <td>{request.record?.fileId || 'N/A'}</td>
                          <td>{request.record?.category || 'N/A'}</td>
                          <td>{getStatusBadge(request.status)}</td>
                        </>
                      ) : (
                        <>
                          <td>{request.record?.employeeId || 'N/A'}</td>
                          <td>{request.record?.ppoUniqueId || 'N/A'}</td>
                          <td>{request.record?.branchCode || 'N/A'}</td>
                          <td>{request.record?.fileId || 'N/A'}</td>
                          <td>{request.record?.category || 'N/A'}</td>
                          <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                          <td style={{ 
                            maxWidth: '200px', 
                            wordWrap: 'break-word',
                            fontSize: '13px',
                            color: '#374151'
                          }}>
                            {request.message || '-'}
                          </td>
                          <td>{getStatusBadge(request.status)}</td>
                        </>
                      )}
                      <td>
                        <div className="action-buttons" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {request.requestType === 'return' && request.status === 'pending' ? (
                            <button
                              style={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                              }}
                              onClick={() => handleConfirmReturn(request._id)}
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
                              <FiPlus size={14} />
                              Confirm Return
                            </button>
                          ) : request.requestType === 'borrow' ? (
                            <select
                              value={request.status}
                              onChange={(e) => handleStatusChange(request, e.target.value)}
                              style={{
                                padding: '6px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                backgroundColor: 'white',
                                fontSize: '12px',
                                cursor: 'pointer',
                                minWidth: '120px'
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="handed_over">Handed Over</option>
                              <option value="searching">Searching</option>
                              <option value="not_traceable">Not Traceable</option>
                            </select>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View for Requests */}
            <div className="mobile-card-view" style={{ display: 'none' }}>
              {requestsData
                ?.slice((requestsCurrentPage - 1) * requestsPerPage, requestsCurrentPage * requestsPerPage)
                ?.map(request => (
                <div key={request._id} className="mobile-card">
                  <div className="mobile-card-header">
                    <h4 className="mobile-card-title">{request.record?.employeeId || 'N/A'}</h4>
                    <div className="mobile-card-status">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                  
                  <div className="mobile-card-details">
                    {requestTypeFilter === 'return' ? (
                      <>
                        <div className="mobile-card-detail">
                          <div className="mobile-card-label">Branch Code</div>
                          <div className="mobile-card-value">{request.record?.branchCode || 'N/A'}</div>
                        </div>
                        <div className="mobile-card-detail">
                          <div className="mobile-card-label">File ID</div>
                          <div className="mobile-card-value">{request.record?.fileId || 'N/A'}</div>
                        </div>
                        <div className="mobile-card-detail">
                          <div className="mobile-card-label">Category</div>
                          <div className="mobile-card-value">{request.record?.category || 'N/A'}</div>
                        </div>
                        <div className="mobile-card-detail">
                          <div className="mobile-card-label">PPO ID</div>
                          <div className="mobile-card-value">{request.record?.ppoUniqueId || 'N/A'}</div>
                        </div>
                        <div className="mobile-card-detail">
                          <div className="mobile-card-label">Name</div>
                          <div className="mobile-card-value">{request.record?.name || request.record?.title || 'N/A'}</div>
                        </div>
                        <div className="mobile-card-detail">
                          <div className="mobile-card-label">User</div>
                          <div className="mobile-card-value">{request.user?.name}</div>
                        </div>
                        <div className="mobile-card-detail">
                          <div className="mobile-card-label">Return Date</div>
                          <div className="mobile-card-value">{new Date(request.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="mobile-card-detail" style={{ gridColumn: '1 / -1' }}>
                          <div className="mobile-card-label">Message</div>
                          <div className="mobile-card-value" style={{ 
                            fontSize: '12px',
                            color: '#6b7280',
                            fontStyle: request.message ? 'normal' : 'italic'
                          }}>
                            {request.message || 'No message provided'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mobile-card-detail">
                          <div className="mobile-card-label">Branch Code</div>
                          <div className="mobile-card-value">{request.record?.branchCode || 'N/A'}</div>
                        </div>
                        <div className="mobile-card-detail">
                          <div className="mobile-card-label">File ID</div>
                          <div className="mobile-card-value">{request.record?.fileId || 'N/A'}</div>
                        </div>
                        <div className="mobile-card-detail">
                          <div className="mobile-card-label">Category</div>
                          <div className="mobile-card-value">{request.record?.category || 'N/A'}</div>
                        </div>
                        <div className="mobile-card-detail">
                          <div className="mobile-card-label">PPO ID</div>
                          <div className="mobile-card-value">{request.record?.ppoUniqueId || 'N/A'}</div>
                        </div>
                        <div className="mobile-card-detail">
                          <div className="mobile-card-label">Name</div>
                          <div className="mobile-card-value">{request.record?.name || request.record?.title || 'N/A'}</div>
                        </div>
                        <div className="mobile-card-detail">
                          <div className="mobile-card-label">User</div>
                          <div className="mobile-card-value">{request.user?.name}</div>
                        </div>
                        <div className="mobile-card-detail">
                          <div className="mobile-card-label">Request Date</div>
                          <div className="mobile-card-value">{new Date(request.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="mobile-card-detail" style={{ gridColumn: '1 / -1' }}>
                          <div className="mobile-card-label">Message</div>
                          <div className="mobile-card-value" style={{ 
                            fontSize: '12px',
                            color: '#6b7280',
                            fontStyle: request.message ? 'normal' : 'italic'
                          }}>
                            {request.message || 'No message provided'}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="mobile-card-actions">
                    {request.requestType === 'return' && request.status === 'pending' ? (
                      <button
                        style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          width: '100%',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}
                        onClick={() => handleConfirmReturn(request._id)}
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
                        <FiPlus size={14} />
                        Confirm Return
                      </button>
                    ) : request.requestType === 'borrow' ? (
                      <select
                        value={request.status}
                        onChange={(e) => handleStatusChange(request, e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          fontSize: '12px',
                          cursor: 'pointer',
                          minWidth: '140px',
                          width: 'auto',
                          maxWidth: '200px'
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="handed_over">Handed Over</option>
                        <option value="searching">Searching</option>
                        <option value="not_traceable">Not Traceable</option>
                      </select>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination for Record Requests */}
            {requestsData?.length > 0 && (
              <div className="pagination-container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '24px',
                padding: '16px 20px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                {/* Records per page selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151' 
                  }}>
                    Records per page:
                  </label>
                  <select
                    value={requestsPerPage}
                    onChange={(e) => {
                      setRequestsPerPage(Number(e.target.value));
                      setRequestsCurrentPage(1);
                    }}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Pagination info */}
                <div style={{ 
                  fontSize: '14px', 
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  Showing {((requestsCurrentPage - 1) * requestsPerPage) + 1} to {Math.min(requestsCurrentPage * requestsPerPage, requestsData?.length || 0)} of {requestsData?.length || 0} records
                </div>

                {/* Pagination buttons */}
                <div className="pagination-buttons" style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setRequestsCurrentPage(1)}
                    disabled={requestsCurrentPage === 1}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: requestsCurrentPage === 1 ? '#f3f4f6' : 'white',
                      color: requestsCurrentPage === 1 ? '#9ca3af' : '#374151',
                      cursor: requestsCurrentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    First
                  </button>
                  <button
                    onClick={() => setRequestsCurrentPage(requestsCurrentPage - 1)}
                    disabled={requestsCurrentPage === 1}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: requestsCurrentPage === 1 ? '#f3f4f6' : 'white',
                      color: requestsCurrentPage === 1 ? '#9ca3af' : '#374151',
                      cursor: requestsCurrentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, Math.ceil(requestsData?.length / requestsPerPage) || 0) }, (_, i) => {
                    const startPage = Math.max(1, requestsCurrentPage - 2);
                    const pageNum = startPage + i;
                    const totalPages = Math.ceil(requestsData?.length / requestsPerPage) || 0;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setRequestsCurrentPage(pageNum)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: requestsCurrentPage === pageNum ? '#3b82f6' : 'white',
                          color: requestsCurrentPage === pageNum ? 'white' : '#374151',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setRequestsCurrentPage(requestsCurrentPage + 1)}
                    disabled={requestsCurrentPage >= Math.ceil(requestsData?.length / requestsPerPage)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: requestsCurrentPage >= Math.ceil(requestsData?.length / requestsPerPage) ? '#f3f4f6' : 'white',
                      color: requestsCurrentPage >= Math.ceil(requestsData?.length / requestsPerPage) ? '#9ca3af' : '#374151',
                      cursor: requestsCurrentPage >= Math.ceil(requestsData?.length / requestsPerPage) ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setRequestsCurrentPage(Math.ceil(requestsData?.length / requestsPerPage))}
                    disabled={requestsCurrentPage >= Math.ceil(requestsData?.length / requestsPerPage)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: requestsCurrentPage >= Math.ceil(requestsData?.length / requestsPerPage) ? '#f3f4f6' : 'white',
                      color: requestsCurrentPage >= Math.ceil(requestsData?.length / requestsPerPage) ? '#9ca3af' : '#374151',
                      cursor: requestsCurrentPage >= Math.ceil(requestsData?.length / requestsPerPage) ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="content-card">
            <div className="content-header">
              <div>
                <h2 className="content-title">Users & Record Possession</h2>
                <p style={{ 
                  margin: '4px 0 0 0', 
                  color: '#6b7280', 
                  fontSize: '14px' 
                }}>
                  View regular users and the number of records they currently have borrowed
                </p>
              </div>
              <div className="action-buttons">
                <button 
                  className="action-button primary"
                  onClick={() => refetchUsers()}
                >
                  <FiRefreshCw /> Refresh
                </button>
              </div>
            </div>
            
            <div className="table-container users-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Email</th>
                    <th>Records in Possession</th>
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
                      <td style={{ fontWeight: '500' }}>{user.name}</td>
                      <td>{user.email}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View for Users */}
            <div className="mobile-card-view" style={{ display: 'none' }}>
              {usersData?.map(user => (
                <div 
                  key={user._id} 
                  className="mobile-card"
                  onClick={() => handleUserClick(user)}
                  style={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className="mobile-card-header">
                    <h4 className="mobile-card-title">{user.name}</h4>
                  </div>
                  
                  <div className="mobile-card-details">
                    <div className="mobile-card-detail">
                      <div className="mobile-card-label">Email</div>
                      <div className="mobile-card-value">{user.email}</div>
                    </div>
                    <div className="mobile-card-detail">
                      <div className="mobile-card-label">Records in Possession</div>
                      <div className="mobile-card-value">
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px' 
                        }}>
                          <span style={{ 
                            fontSize: '16px', 
                            fontWeight: '700', 
                            color: user.recordsInPossession > 0 ? '#3b82f6' : '#6b7280' 
                          }}>
                            {user.recordsInPossession || 0}
                          </span>
                          {user.recordsInPossession > 0 && (
                            <span style={{ 
                              fontSize: '10px', 
                              color: '#6b7280',
                              backgroundColor: '#f3f4f6',
                              padding: '1px 4px',
                              borderRadius: '3px'
                            }}>
                              record{user.recordsInPossession !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Confirmation Modal */}
        <SimpleModal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          title="Update Request Status"
        >
          <p>Are you sure you want to update the request status to <strong>{getStatusLabel(selectedStatus)}</strong>?</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button 
              onClick={() => setShowStatusModal(false)}
              style={{ padding: '8px 16px', border: '1px solid #d1d5db', background: 'white', borderRadius: '6px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              onClick={confirmStatusUpdate}
              style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Update Status
            </button>
          </div>
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
                onClick={() => {
                  setShowImportModal(false)
                  setSelectedFile(null)
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
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                  No records in possession
                </div>
                <div style={{ fontSize: '14px' }}>
                  This user hasn't borrowed any records yet.
                </div>
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button 
                onClick={() => {
                  setShowUserRecordsModal(false)
                  setSelectedUser(null)
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#4b5563'
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#6b7280'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </SimpleModal>
    </div>
  </div>
)
}

export default RecordManagerDashboard
