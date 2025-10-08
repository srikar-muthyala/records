import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiSearch, FiPlus, FiEye, FiX, FiRotateCcw, FiRefreshCw } from 'react-icons/fi'
import SimpleModal from '../components/SimpleModal'
import { useAuth } from '../contexts/AuthContext'

const UserDashboard = () => {
  const { user } = useAuth()
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [recordToReturn, setRecordToReturn] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset to first page when searching
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch records
  const { data: recordsData, isLoading: recordsLoading, refetch: refetchRecords } = useQuery(
    ['records', debouncedSearchTerm, currentPage, recordsPerPage],
    () => {
      const params = new URLSearchParams({
        page: currentPage,
        limit: recordsPerPage
      });
      if (debouncedSearchTerm.trim()) {
        params.append('search', debouncedSearchTerm.trim());
      }
      return axios.get(`/api/user/records?${params.toString()}`);
    },
    {
      select: (data) => data.data
    }
  )

  // Fetch user's requests
  const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests } = useQuery(
    'userRequests',
    () => axios.get('/api/user/my-requests'),
    {
      select: (data) => data.data
    }
  )

  // Fetch user's current records
  const { data: myRecordsData, isLoading: myRecordsLoading, refetch: refetchMyRecords } = useQuery(
    'myRecords',
    () => axios.get('/api/user/my-records'),
    {
      select: (data) => data.data
    }
  )

  // Fetch requests for user's records
  const { data: requestsToMeData, isLoading: requestsToMeLoading, refetch: refetchRequestsToMe } = useQuery(
    'requestsToMe',
    () => axios.get('/api/user/requests-to-me'),
    {
      select: (data) => data.data
    }
  )


  const handleRequestRecord = async (recordId) => {
    try {
      await axios.post('/api/user/requests', { recordId })
      toast.success('Request submitted successfully')
      refetchRequests()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request')
    }
  }

  const handleReturnRecord = (record) => {
    setRecordToReturn(record)
    setShowReturnModal(true)
  }

  const confirmReturnRecord = async () => {
    try {
      await axios.post(`/api/user/return/${recordToReturn._id}`)
      toast.success('Record returned successfully')
      setShowReturnModal(false)
      setRecordToReturn(null)
      refetchMyRecords()
      refetchRequests()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to return record')
    }
  }

  const handleApproveRequest = async (requestId) => {
    try {
      await axios.put(`/api/user/requests/${requestId}/approve`)
      toast.success('Request approved successfully')
      refetchRequestsToMe()
      refetchMyRecords()
      refetchRecords()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve request')
    }
  }

  const handleRejectRequest = async (requestId) => {
    try {
      await axios.put(`/api/user/requests/${requestId}/reject`)
      toast.success('Request rejected successfully')
      refetchRequestsToMe()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-warning">Pending</span>
      case 'approved':
        return <span className="badge badge-success">Approved</span>
      case 'rejected':
        return <span className="badge badge-danger">Rejected</span>
      case 'handed_over':
        return <span className="badge badge-info">Handed Over</span>
      case 'searching':
        return <span className="badge badge-primary">Searching</span>
      case 'not_traceable':
        return <span className="badge badge-secondary">Not Traceable</span>
      default:
        return <span className="badge badge-info">{status}</span>
    }
  }

  if (recordsLoading || requestsLoading || myRecordsLoading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div style={{ padding: '24px 0' }}>
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
          User Dashboard
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          margin: '0',
          fontWeight: '400'
        }}>
          Manage your records, requests, and library access
        </p>
      </div>
      
      {/* Available Records */}
      <div className="card mb-4">
        <div className="card-header" style={{
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e5e7eb',
          padding: '20px 24px'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1f2937',
            margin: '0 0 4px 0',
            letterSpacing: '-0.025em'
          }}>
            Available Records
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0',
            fontWeight: '400'
          }}>
            Browse and request records from the library
          </p>
          </div>
        
        {/* Search Bar */}
        <div className="search-container" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
          padding: '20px 0'
        }}>
          <div className="search-input-container" style={{ 
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
              className="search-input"
              style={{
                width: '100%',
                padding: '12px 16px 12px 44px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                outline: 'none',
                transition: 'all 0.3s ease',
                backgroundColor: '#f9fafb',
                color: '#374151'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.backgroundColor = 'white';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.backgroundColor = '#f9fafb';
                e.target.style.boxShadow = 'none';
              }}
            />
            <div style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280',
              fontSize: '18px'
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
              className="search-clear-button"
              style={{
                padding: '12px 20px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#dc2626';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#ef4444';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)';
              }}
            >
              <FiX size={16} />
              Clear
            </button>
          )}
          </div>
        
        {recordsData?.records?.length > 0 ? (
          <div className="table-responsive">
            <table className="table">
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
                {recordsData.records.map(record => (
                  <tr key={record._id}>
                    <td>{record.name || record.title}</td>
                    <td>{record.category}</td>
                    <td>{record.ppoUniqueId || 'N/A'}</td>
                    <td>{record.branchCode || 'N/A'}</td>
                    <td>{record.fileId || 'N/A'}</td>
                    <td>{record.employeeId || 'N/A'}</td>
                    <td>
                      <span className={`badge ${
                        record.pensionStatus === 'A' ? 'badge-success' : 
                        record.pensionStatus === 'D' ? 'badge-danger' : 
                        record.pensionStatus === 'S' ? 'badge-warning' : 
                        'badge-secondary'
                      }`}>
                        {record.pensionStatus === 'A' ? 'Active' : 
                         record.pensionStatus === 'D' ? 'Discontinued' : 
                         record.pensionStatus === 'S' ? 'Suspended' : 
                         record.pensionStatus || 'N/A'}
                      </span>
                    </td>
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
                      {record.currentHolder && record.currentHolder._id === user?._id ? (
                        <span className="text-muted">You have this record</span>
                      ) : (
          <button
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
                            padding: '8px 12px',
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
                          onClick={() => handleRequestRecord(record._id)}
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
                          <FiPlus size={14} />
                          Request
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center">No records found</p>
        )}
        
        {/* Pagination Controls for Available Records */}
        {recordsData?.totalPages > 1 && (
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
                value={recordsPerPage}
                onChange={(e) => {
                  setRecordsPerPage(Number(e.target.value));
                  setCurrentPage(1);
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
              Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, recordsData?.total || 0)} of {recordsData?.total || 0} records
            </div>

            {/* Pagination buttons */}
            <div className="pagination-buttons" style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
                  color: currentPage === 1 ? '#9ca3af' : '#374151',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
                  color: currentPage === 1 ? '#9ca3af' : '#374151',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                Previous
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, recordsData?.totalPages || 0) }, (_, i) => {
                const startPage = Math.max(1, currentPage - 2);
                const pageNum = startPage + i;
                if (pageNum > (recordsData?.totalPages || 0)) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: currentPage === pageNum ? '#3b82f6' : 'white',
                      color: currentPage === pageNum ? 'white' : '#374151',
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
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === recordsData?.totalPages}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: currentPage === recordsData?.totalPages ? '#f3f4f6' : 'white',
                  color: currentPage === recordsData?.totalPages ? '#9ca3af' : '#374151',
                  cursor: currentPage === recordsData?.totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(recordsData?.totalPages || 1)}
                disabled={currentPage === recordsData?.totalPages}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: currentPage === recordsData?.totalPages ? '#f3f4f6' : 'white',
                  color: currentPage === recordsData?.totalPages ? '#9ca3af' : '#374151',
                  cursor: currentPage === recordsData?.totalPages ? 'not-allowed' : 'pointer',
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

      {/* My Records */}
      <div className="card mb-4">
        <div className="card-header" style={{
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e5e7eb',
          padding: '20px 24px'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1f2937',
            margin: '0 0 4px 0',
            letterSpacing: '-0.025em'
          }}>
            My Records
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0',
            fontWeight: '400'
          }}>
            Records currently in your possession
          </p>
        </div>
        {myRecordsData?.length > 0 ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>PPO ID</th>
                  <th>Branch Code</th>
                  <th>Account Number</th>
                  <th>Pension Status</th>
                  <th>Borrowed Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myRecordsData.map(record => (
                  <tr key={record._id}>
                    <td>{record.name || record.title}</td>
                    <td>{record.category}</td>
                    <td>{record.ppoUniqueId || 'N/A'}</td>
                    <td>{record.branchCode || 'N/A'}</td>
                    <td>{record.employeeId || 'N/A'}</td>
                    <td>
                      <span className={`badge ${
                        record.pensionStatus === 'A' ? 'badge-success' : 
                        record.pensionStatus === 'D' ? 'badge-danger' : 
                        record.pensionStatus === 'S' ? 'badge-warning' : 
                        'badge-secondary'
                      }`}>
                        {record.pensionStatus === 'A' ? 'Active' : 
                         record.pensionStatus === 'D' ? 'Discontinued' : 
                         record.pensionStatus === 'S' ? 'Suspended' : 
                         record.pensionStatus || 'N/A'}
                      </span>
                    </td>
                    <td>{new Date(record.borrowedDate).toLocaleDateString()}</td>
                    <td>
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
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}
                        onClick={() => handleReturnRecord(record)}
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
                        <FiRotateCcw size={14} />
                        Return
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center">No records currently borrowed</p>
        )}
      </div>

      {/* My Requests */}
      <div className="card mb-4">
        <div className="card-header" style={{
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e5e7eb',
          padding: '20px 24px'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1f2937',
            margin: '0 0 4px 0',
            letterSpacing: '-0.025em'
          }}>
            My Requests
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0',
            fontWeight: '400'
          }}>
            Track your submitted requests and their status
          </p>
        </div>
        {requestsData?.length > 0 ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Response</th>
                </tr>
              </thead>
              <tbody>
                {requestsData.map(request => (
                  <tr key={request._id}>
                    <td>{request.record?.title}</td>
                    <td>{request.requestType}</td>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                    <td>{request.adminResponse || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center">No requests submitted</p>
        )}
      </div>

      {/* Requests to Me */}
      <div className="card mb-4">
        <div className="card-header" style={{
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e5e7eb',
          padding: '20px 24px'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1f2937',
            margin: '0 0 4px 0',
            letterSpacing: '-0.025em'
          }}>
            Requests to Me
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0',
            fontWeight: '400'
          }}>
            Approve or reject requests for your records
          </p>
        </div>
        {requestsToMeData?.length > 0 ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Record</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requestsToMeData.map(request => (
                  <tr key={request._id}>
                    <td>{request.user?.name}</td>
                    <td>{request.record?.title}</td>
                    <td>{request.message || '-'}</td>
                    <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                    <td>
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
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                          }}
                          onClick={() => handleApproveRequest(request._id)}
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
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                          }}
                          onClick={() => handleRejectRequest(request._id)}
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
          <p className="text-center">No requests for your records</p>
        )}
      </div>

      {/* Return Confirmation Modal */}
      <SimpleModal
        isOpen={showReturnModal}
        onClose={() => {
          setShowReturnModal(false)
          setRecordToReturn(null)
        }}
        title="Confirm Return"
      >
        {recordToReturn && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#374151' }}>
                Are you sure you want to return this record?
              </p>
              <div style={{ 
                backgroundColor: '#f3f4f6', 
                padding: '12px', 
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <p style={{ margin: '0', fontWeight: '500', color: '#1f2937' }}>
                  <strong>Title:</strong> {recordToReturn.title}
                </p>
                <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>
                  <strong>Category:</strong> {recordToReturn.category}
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
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
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
                onClick={confirmReturnRecord}
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
                <FiRotateCcw size={16} />
                Yes, Return Record
              </button>
              <button
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
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
                onClick={() => {
                  setShowReturnModal(false)
                  setRecordToReturn(null)
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
          
          .pagination-container {
            flex-direction: column !important;
            gap: 16px !important;
            padding: 16px !important;
          }
          
          .pagination-controls {
            flex-direction: column !important;
            gap: 12px !important;
          }
          
          .pagination-buttons {
            flex-wrap: wrap !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  )
}

export default UserDashboard
