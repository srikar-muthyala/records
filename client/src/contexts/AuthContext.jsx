import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'

// Configure axios base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
axios.defaults.baseURL = API_URL

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const passwordStatusChecked = useRef(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me')
      const user = response.data
      
      // The backend now includes usingDefaultPassword flag
      setUser(user)
    } catch (error) {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password })
      const { token, user } = response.data
      
      // The backend now includes usingDefaultPassword flag in the response
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      passwordStatusChecked.current = false
      
      return { success: true, user }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  const register = async (name, email, password) => {
    try {
      const response = await axios.post('/api/auth/register', { name, email, password })
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      passwordStatusChecked.current = false
      
      return { success: true, user }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      }
    }
  }

  const checkPasswordStatus = useCallback(async () => {
    // Avoid multiple calls if we've already checked recently
    if (passwordStatusChecked.current) {
      return user?.usingDefaultPassword || false
    }
    
    try {
      const response = await axios.get('/api/auth/check-password-status')
      const { usingDefaultPassword } = response.data
      
      passwordStatusChecked.current = true
      
      if (user) {
        setUser(prevUser => ({
          ...prevUser,
          usingDefaultPassword
        }))
      }
      
      return usingDefaultPassword
    } catch (error) {
      console.error('Error checking password status:', error)
      return false
    }
  }, [user])

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    passwordStatusChecked.current = false
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkPasswordStatus,
    isAdmin: user?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
