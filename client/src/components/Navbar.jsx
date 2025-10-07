import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import { FiLogOut, FiUser, FiShield, FiHome, FiBook } from 'react-icons/fi'

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <nav style={{
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px'
        }}>
          <Link 
            to="/" 
            style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1f2937',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FiBook size={24} style={{ color: '#3b82f6' }} />
            Records Management
          </Link>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              {isAdmin ? (
                <>
                  <Link 
                    to="/admin" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      color: '#374151',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      backgroundColor: 'transparent'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#f3f4f6'
                      e.target.style.color = '#1f2937'
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'transparent'
                      e.target.style.color = '#374151'
                    }}
                  >
                    <FiShield size={16} />
                    Admin Dashboard
                  </Link>
                  <Link 
                    to="/records" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      color: '#374151',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      backgroundColor: 'transparent'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#f3f4f6'
                      e.target.style.color = '#1f2937'
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'transparent'
                      e.target.style.color = '#374151'
                    }}
                  >
                    <FiBook size={16} />
                    Records
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/dashboard" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      color: '#374151',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      backgroundColor: 'transparent'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#f3f4f6'
                      e.target.style.color = '#1f2937'
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'transparent'
                      e.target.style.color = '#374151'
                    }}
                  >
                    <FiHome size={16} />
                    Dashboard
                  </Link>
                  <Link 
                    to="/records" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      color: '#374151',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      backgroundColor: 'transparent'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#f3f4f6'
                      e.target.style.color = '#1f2937'
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'transparent'
                      e.target.style.color = '#374151'
                    }}
                  >
                    <FiBook size={16} />
                    Records
                  </Link>
                </>
              )}
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                <FiUser size={16} />
                <span style={{ fontWeight: '500' }}>{user?.name}</span>
                {isAdmin && (
                  <span style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    Admin
                  </span>
                )}
              </div>
              <button 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
                onClick={handleLogout}
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
                <FiLogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
