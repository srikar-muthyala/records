import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiSearch, FiPlus, FiEye, FiX, FiRotateCcw, FiRefreshCw } from 'react-icons/fi'
import SimpleModal from '../components/SimpleModal'
import { useAuth } from '../contexts/AuthContext'

const UserDashboard = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState([])
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [recordToReturn, setRecordToReturn] = useState(null)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch records
  const { data: recordsData, isLoading: recordsLoading, refetch: refetchRecords } = useQuery(
    ['records', debouncedSearchTerm, categoryFilter],
    () => axios.get(`/api/user/records?search=${debouncedSearchTerm}&category=${categoryFilter}`),
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

  // Fetch categories
  useEffect(() => {
    axios.get('/api/records/categories')
      .then(res => setCategories(res.data))
      .catch(err => console.error(err))
  }, [])

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
      
      {/* Search and Filter */}
      <div className="card mb-4">
        <div className="d-flex gap-3 align-items-center">
          <div className="form-group" style={{ flex: 1 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group">
            <select
              className="form-control"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <button
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              whiteSpace: 'nowrap'
            }}
            onClick={() => {
              refetchRecords()
              refetchMyRecords()
              refetchRequests()
              refetchRequestsToMe()
              toast.success('Data refreshed successfully')
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
            <FiRefreshCw size={16} />
            Refresh
          </button>
        </div>
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
                  <th>Title</th>
                  <th>Category</th>
                  <th>Borrowed Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myRecordsData.map(record => (
                  <tr key={record._id}>
                    <td>{record.title}</td>
                    <td>{record.category}</td>
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

      {/* Available Records */}
      <div className="card">
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
        {recordsData?.records?.length > 0 ? (
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
                {recordsData.records.map(record => (
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
    </div>
  )
}

export default UserDashboard
