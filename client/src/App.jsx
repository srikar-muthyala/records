import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import RecordManagerDashboard from './pages/RecordManagerDashboard'
import UserDashboard from './pages/UserDashboard'
import Records from './pages/Records'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const { user, loading } = useAuth()


  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="App">
      {user && <Navbar />}
      <div className="container">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to={
              user.role === 'admin' ? '/admin' : 
              user.role === 'recordManager' ? '/record-manager' : 
              '/dashboard'
            } /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to={
              user.role === 'admin' ? '/admin' : 
              user.role === 'recordManager' ? '/record-manager' : 
              '/dashboard'
            } /> : <Register />} 
          />
          <Route 
            path="/admin" 
            element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/record-manager" 
            element={user?.role === 'recordManager' ? <RecordManagerDashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? (
              user.role === 'recordManager' ? <Navigate to="/record-manager" /> :
              user.role === 'admin' ? <Navigate to="/admin" /> :
              <UserDashboard />
            ) : <Navigate to="/login" />} 
          />
          <Route 
            path="/records" 
            element={user ? <Records /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={user ? <Navigate to={
              user.role === 'admin' ? '/admin' : 
              user.role === 'recordManager' ? '/record-manager' : 
              '/dashboard'
            } /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </div>
  )
}

export default App
