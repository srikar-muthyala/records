import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import { FiLogOut, FiUser, FiShield, FiHome, FiBook, FiMenu, FiX } from 'react-icons/fi'

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <>
      <style>
        {`
          .navbar {
            background-color: white;
            border-bottom: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            position: sticky;
            top: 0;
            z-index: 1000;
          }
          
          /* Ensure navbar links are always visible */
          .navbar a {
            color: #374151 !important;
          }
          
          .navbar a:hover {
            color: #1f2937 !important;
          }
          
          .navbar-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
          }
          
          .navbar-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 64px;
          }
          
          .navbar-brand {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
          }
          
          .navbar-nav {
            display: flex;
            align-items: center;
            gap: 24px;
          }
          
          .navbar-links {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          
          .navbar-link {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border-radius: 8px;
            color: #374151 !important;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            background-color: transparent;
            white-space: nowrap;
          }
          
          .navbar-link:hover {
            background-color: #f3f4f6 !important;
            color: #1f2937 !important;
          }
          
          .navbar-link:visited {
            color: #374151 !important;
          }
          
          .navbar-link:active {
            color: #1f2937 !important;
          }
          
          .navbar-user {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 16px;
            background-color: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
          }
          
          .navbar-user-info {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #6b7280;
            font-size: 14px;
          }
          
          .navbar-user-name {
            font-weight: 500;
            white-space: nowrap;
          }
          
          .navbar-admin-badge {
            background-color: #3b82f6;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
          
          .navbar-logout {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            background-color: #ef4444;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            white-space: nowrap;
          }
          
          .navbar-logout:hover {
            background-color: #dc2626;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          }
          
          .navbar-mobile-toggle {
            display: none;
            background: none;
            border: none;
            color: #374151;
            font-size: 24px;
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            transition: all 0.2s ease;
          }
          
          .navbar-mobile-toggle:hover {
            background-color: #f3f4f6;
            color: #1f2937;
          }
          
          /* Desktop - Show user section in navbar */
          @media (min-width: 769px) {
            .navbar-user {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 8px 16px;
              background-color: #f8fafc;
              border-radius: 12px;
              border: 1px solid #e5e7eb;
            }
            
            .navbar-user-info {
              display: flex;
              align-items: center;
              gap: 8px;
              color: #6b7280;
              font-size: 14px;
            }
            
            .navbar-user-name {
              font-weight: 500;
              white-space: nowrap;
            }
            
            .navbar-logout {
              display: flex;
              align-items: center;
              gap: 6px;
              padding: 8px 12px;
              background-color: #ef4444;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              white-space: nowrap;
            }
            
            .navbar-logout:hover {
              background-color: #dc2626;
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            }
          }
          
          /* Mobile Responsive */
          @media (max-width: 768px) {
            .navbar-container {
              padding: 0 16px;
            }
            
            .navbar-content {
              height: 64px;
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
            }
            
            .navbar-brand {
              font-size: 18px;
              margin-bottom: 0;
            }
            
            .navbar-mobile-toggle {
              display: block;
            }
            
            .navbar-nav {
              position: absolute;
              top: 100%;
              left: 0;
              right: 0;
              background-color: white;
              border-top: 1px solid #e5e7eb;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              flex-direction: column;
              gap: 0;
              width: 100%;
              transform: translateY(-100%);
              opacity: 0;
              visibility: hidden;
              transition: all 0.3s ease;
              z-index: 999;
            }
            
            .navbar-nav.mobile-open {
              transform: translateY(0);
              opacity: 1;
              visibility: visible;
            }
            
            .navbar-links {
              flex-direction: column;
              gap: 0;
              width: 100%;
            }
            
            .navbar-link {
              justify-content: flex-start;
              width: 100%;
              padding: 16px 20px;
              font-size: 15px;
              border-bottom: 1px solid #f3f4f6;
            }
            
            .navbar-link:last-child {
              border-bottom: none;
            }
            
            .navbar-user {
              flex-direction: column;
              gap: 12px;
              padding: 16px 20px;
              width: 100%;
              border-top: 1px solid #f3f4f6;
            }
            
            .navbar-user-info {
              flex-direction: column;
              gap: 8px;
              text-align: center;
            }
            
            .navbar-user-name {
              font-size: 16px;
            }
            
            .navbar-logout {
              width: 100%;
              justify-content: center;
              padding: 12px 16px;
              font-size: 15px;
            }
          }
          
          @media (max-width: 480px) {
            .navbar-container {
              padding: 0 12px;
            }
            
            .navbar-brand {
              font-size: 16px;
            }
            
            .navbar-link {
              padding: 10px 12px;
              font-size: 14px;
            }
            
            .navbar-logout {
              padding: 10px 12px;
              font-size: 14px;
            }
          }
        `}
      </style>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-content">
          <Link 
            to="/" 
              className="navbar-brand"
          >
            <FiBook size={24} style={{ color: '#3b82f6' }} />
            Records Management
          </Link>
          
            <button 
              className="navbar-mobile-toggle"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          
            <div className={`navbar-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
              <div className="navbar-links">
              {user?.role === 'admin' ? (
                <>
                  <Link 
                    to="/admin" 
                    className="navbar-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FiShield size={16} />
                    Admin Dashboard
                  </Link>
                  <Link 
                    to="/records" 
                    className="navbar-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FiBook size={16} />
                    Records
                  </Link>
                </>
              ) : user?.role === 'recordManager' ? (
                <>
                  <Link 
                    to="/record-manager" 
                    className="navbar-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FiShield size={16} />
                    Record Manager
                  </Link>
                  <Link 
                    to="/records" 
                    className="navbar-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FiBook size={16} />
                    Records
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/dashboard" 
                    className="navbar-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FiHome size={16} />
                    Dashboard
                  </Link>
                  <Link 
                    to="/records" 
                    className="navbar-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FiBook size={16} />
                    Records
                  </Link>
                </>
              )}
            </div>
            
              <div className="navbar-user">
                <div className="navbar-user-info">
                <FiUser size={16} />
                  <span className="navbar-user-name">{user?.name}</span>
                {isAdmin && (
                    <span className="navbar-admin-badge">
                    Admin
                  </span>
                )}
              </div>
              <button 
                  className="navbar-logout"
                  onClick={() => {
                    handleLogout()
                    setIsMobileMenuOpen(false)
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
    </>
  )
}

export default Navbar
