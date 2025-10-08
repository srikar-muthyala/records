import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiSearch, FiEye, FiRefreshCw, FiX, FiCalendar, FiUser, FiTag, FiInfo } from 'react-icons/fi'
import SimpleModal from '../components/SimpleModal'

const Records = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState([])
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(12)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, categoryFilter])

  // Fetch records
  const { data: recordsData, isLoading, refetch: refetchRecords } = useQuery(
    ['records', debouncedSearchTerm, categoryFilter, currentPage, recordsPerPage],
    () => axios.get(`/api/records?search=${debouncedSearchTerm}&category=${categoryFilter}&page=${currentPage}&limit=${recordsPerPage}`),
    {
      select: (data) => data.data
    }
  )

  // Fetch categories
  React.useEffect(() => {
    axios.get('/api/records/categories')
      .then(res => setCategories(res.data))
      .catch(err => console.error(err))
  }, [])

  if (isLoading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div>
      <h1 className="mb-4">All Records</h1>
      
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
              toast.success('Records data refreshed successfully')
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

      {/* Records Grid */}
      <div className="row">
        {recordsData?.records?.map(record => (
          <div key={record._id} className="col-md-6 col-lg-4 mb-3">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">{record.title}</h5>
                <p className="text-muted">{record.category}</p>
                {record.description && (
                  <p className="card-text">{record.description}</p>
                )}
                <div className="d-flex justify-content-between align-items-center">
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
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <FiEye /> View Details
                  </button>
                </div>
                {record.currentHolder && (
                  <small className="text-muted">
                    Currently held by: {record.currentHolder.name}
                  </small>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {recordsData?.records?.length === 0 && (
        <div className="text-center">
          <p>No records found</p>
        </div>
      )}

      {/* Pagination Controls */}
      {recordsData?.totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '32px',
          padding: '20px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
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
                setRecordsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>

          {/* Page info */}
          <div style={{ 
            fontSize: '14px', 
            color: '#6b7280',
            textAlign: 'center'
          }}>
            Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, recordsData?.total || 0)} of {recordsData?.total || 0} records
          </div>

          {/* Pagination buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
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
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
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
            <div style={{ display: 'flex', gap: '4px' }}>
              {Array.from({ length: Math.min(5, recordsData?.totalPages || 0) }, (_, i) => {
                const startPage = Math.max(1, currentPage - 2)
                const pageNum = startPage + i
                if (pageNum > recordsData?.totalPages) return null
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      backgroundColor: currentPage === pageNum ? '#3b82f6' : 'white',
                      color: currentPage === pageNum ? 'white' : '#374151',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      minWidth: '40px'
                    }}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(recordsData?.totalPages || 1, prev + 1))}
              disabled={currentPage === recordsData?.totalPages}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
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
                borderRadius: '6px',
                border: '1px solid #d1d5db',
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

      {/* Record Details Modal */}
      <SimpleModal
        isOpen={selectedRecord !== null}
        onClose={() => setSelectedRecord(null)}
        title="Record Details"
      >
        {selectedRecord && (
          <div>
            {/* Record Title */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '24px', 
                fontWeight: '600', 
                color: '#1f2937',
                lineHeight: '1.2'
              }}>
                {selectedRecord.title}
              </h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  backgroundColor: selectedRecord.status === 'available' ? '#10b981' : '#f59e0b',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  textTransform: 'capitalize'
                }}>
                  {selectedRecord.status}
                </span>
                <span style={{
                  backgroundColor: '#e5e7eb',
                  color: '#6b7280',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {selectedRecord.category}
                </span>
              </div>
            </div>

            {/* Record Information Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Left Column */}
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '6px',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    <FiTag size={16} />
                    Category
                  </div>
                  <div style={{ 
                    color: '#1f2937', 
                    fontSize: '16px',
                    fontWeight: '500'
                  }}>
                    {selectedRecord.category}
                  </div>
                </div>

                {selectedRecord.currentHolder && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '6px',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      <FiUser size={16} />
                      Current Holder
                    </div>
                    <div style={{ 
                      color: '#1f2937', 
                      fontSize: '16px',
                      fontWeight: '500'
                    }}>
                      {selectedRecord.currentHolder.name}
                    </div>
                  </div>
                )}

                {/* Pension/Employee specific fields */}
                {selectedRecord.ppoUniqueId && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '6px',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      <FiInfo size={16} />
                      PPO ID
                    </div>
                    <div style={{ 
                      color: '#1f2937', 
                      fontSize: '16px',
                      fontWeight: '500'
                    }}>
                      {selectedRecord.ppoUniqueId}
                    </div>
                  </div>
                )}

                {selectedRecord.branchCode && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '6px',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      <FiInfo size={16} />
                      Branch Code
                    </div>
                    <div style={{ 
                      color: '#1f2937', 
                      fontSize: '16px',
                      fontWeight: '500'
                    }}>
                      {selectedRecord.branchCode}
                    </div>
                  </div>
                )}

                {selectedRecord.pensionStatus && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '6px',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      <FiInfo size={16} />
                      Pension Status
                    </div>
                    <div style={{ 
                      color: '#1f2937', 
                      fontSize: '16px',
                      fontWeight: '500'
                    }}>
                      <span style={{
                        backgroundColor: selectedRecord.pensionStatus === 'A' ? '#10b981' : 
                                       selectedRecord.pensionStatus === 'D' ? '#ef4444' : 
                                       selectedRecord.pensionStatus === 'S' ? '#f59e0b' : '#6b7280',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {selectedRecord.pensionStatus === 'A' ? 'Active' : 
                         selectedRecord.pensionStatus === 'D' ? 'Discontinued' : 
                         selectedRecord.pensionStatus === 'S' ? 'Suspended' : 
                         selectedRecord.pensionStatus}
                      </span>
                    </div>
                  </div>
                )}

                {selectedRecord.mobileNumber && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '6px',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      <FiInfo size={16} />
                      Mobile Number
                    </div>
                    <div style={{ 
                      color: '#1f2937', 
                      fontSize: '16px',
                      fontWeight: '500'
                    }}>
                      {selectedRecord.mobileNumber}
                    </div>
                  </div>
                )}

                {selectedRecord.borrowedDate && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '6px',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      <FiCalendar size={16} />
                      Borrowed Date
                    </div>
                    <div style={{ 
                      color: '#1f2937', 
                      fontSize: '16px',
                      fontWeight: '500'
                    }}>
                      {new Date(selectedRecord.borrowedDate).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div>
                {selectedRecord.description && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '6px',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      <FiInfo size={16} />
                      Description
                    </div>
                    <div style={{ 
                      color: '#1f2937', 
                      fontSize: '16px',
                      lineHeight: '1.5',
                      backgroundColor: '#f9fafb',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      {selectedRecord.description}
                    </div>
                  </div>
                )}

                {selectedRecord.metadata && Object.keys(selectedRecord.metadata).length > 0 && (
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '12px',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      <FiInfo size={16} />
                      Additional Information
                    </div>
                    <div style={{
                      backgroundColor: '#f9fafb',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      {Object.entries(selectedRecord.metadata).map(([key, value]) => {
                        // Handle nested objects (like originalData)
                        if (typeof value === 'object' && value !== null) {
                          return (
                            <div key={key} style={{ marginBottom: '12px' }}>
                              <div style={{ 
                                color: '#6b7280', 
                                fontSize: '14px',
                                fontWeight: '600',
                                textTransform: 'capitalize',
                                marginBottom: '8px'
                              }}>
                                {key}:
                              </div>
                              <div style={{ paddingLeft: '12px' }}>
                                {Object.entries(value).map(([subKey, subValue]) => (
                                  subValue && (
                                    <div key={subKey} style={{ 
                                      display: 'flex', 
                                      justifyContent: 'space-between',
                                      padding: '4px 0',
                                      borderBottom: '1px solid #e5e7eb'
                                    }}>
                                      <span style={{ 
                                        color: '#6b7280', 
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        textTransform: 'capitalize'
                                      }}>
                                        {subKey}:
                                      </span>
                                      <span style={{ 
                                        color: '#1f2937', 
                                        fontSize: '13px',
                                        fontWeight: '500'
                                      }}>
                                        {subValue}
                                      </span>
                                    </div>
                                  )
                                ))}
                              </div>
                            </div>
                          )
                        }
                        // Handle primitive values
                        return value && (
                          <div key={key} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            padding: '8px 0',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            <span style={{ 
                              color: '#6b7280', 
                              fontSize: '14px',
                              fontWeight: '500',
                              textTransform: 'capitalize'
                            }}>
                              {key}:
                            </span>
                            <span style={{ 
                              color: '#1f2937', 
                              fontSize: '14px',
                              fontWeight: '500'
                            }}>
                              {value}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <button
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
                onClick={() => setSelectedRecord(null)}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#4b5563'
                  e.target.style.transform = 'translateY(-1px)'
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#6b7280'
                  e.target.style.transform = 'translateY(0)'
                }}
              >
                <FiX size={16} />
                Close
              </button>
            </div>
          </div>
        )}
      </SimpleModal>
    </div>
  )
}

export default Records
