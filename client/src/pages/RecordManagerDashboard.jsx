import React, { useState } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiUsers, FiBook, FiClock, FiX, FiPlus, FiRefreshCw, FiEdit, FiUpload } from 'react-icons/fi'
import SimpleModal from '../components/SimpleModal'

const RecordManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')

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
    'recordManagerRequests',
    () => axios.get('/api/record-manager/requests'),
    {
      select: (data) => data.data
    }
  )

  // Records
  const { data: recordsData, isLoading: recordsLoading, refetch: refetchRecords } = useQuery(
    ['recordManagerRecords', currentPage, recordsPerPage, searchTerm],
    () => {
      const params = new URLSearchParams({
        page: currentPage,
        limit: recordsPerPage
      })
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }
      return axios.get(`/api/records?${params}`)
    },
    {
      select: (data) => data.data
    }
  )


  const handleStatusChange = (request, newStatus) => {
    setSelectedRequest(request)
    setSelectedStatus(newStatus)
    setShowStatusModal(true)
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

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-warning', text: 'Pending' },
      approved: { class: 'badge-success', text: 'Approved' },
      rejected: { class: 'badge-danger', text: 'Rejected' },
      handed_over: { class: 'badge-info', text: 'Handed Over' },
      searching: { class: 'badge-primary', text: 'Searching' },
      not_traceable: { class: 'badge-secondary', text: 'Not Traceable' }
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
        }
          @media (min-width: 769px) {
            .stat-card {
              text-align: left !important;
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
        </div>

        {activeTab === 'dashboard' && (
          <>
            <div className="stats-grid">
              <div 
                className="stat-card"
                onClick={() => setActiveTab('requests')}
                style={{ borderColor: '#3b82f6' }}
              >
                <div className="stat-number" style={{ color: '#3b82f6' }}>{dashboardData?.totalRequests || 0}</div>
                <div className="stat-label">Total Requests</div>
              </div>
              <div 
                className="stat-card"
                onClick={() => setActiveTab('requests')}
                style={{ borderColor: '#f59e0b' }}
              >
                <div className="stat-number" style={{ color: '#f59e0b' }}>{dashboardData?.pendingRequests || 0}</div>
                <div className="stat-label">Pending Requests</div>
              </div>
              <div 
                className="stat-card"
                onClick={() => setActiveTab('requests')}
                style={{ borderColor: '#10b981' }}
              >
                <div className="stat-number" style={{ color: '#10b981' }}>{dashboardData?.approvedRequests || 0}</div>
                <div className="stat-label">Handed Over Requests</div>
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
                  <button className="action-button success">
                    <FiPlus /> Add Record
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
                      <th>Mobile</th>
                      <th>Status</th>
                      <th>Actions</th>
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
                        <td>{record.mobileNumber || 'N/A'}</td>
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
                        <td>
                          <div className="action-buttons">
                            <button className="action-button warning">
                              <FiEdit /> Edit
                            </button>
                            <button className="action-button danger">
                              <FiX /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              <h2 className="content-title">Record Requests</h2>
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
                    <th>Category</th>
                    <th>Request Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requestsData?.map(request => (
                    <tr key={request._id}>
                      <td>{request.user?.name}</td>
                      <td>{request.record?.title}</td>
                      <td>{request.record?.category}</td>
                      <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                      <td>{getStatusBadge(request.status)}</td>
                      <td>
                        <div className="action-buttons" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      </div>
    </div>
  )
}

export default RecordManagerDashboard
