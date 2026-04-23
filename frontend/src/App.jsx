import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom'
import { useState } from 'react'

import './App.css'
import Login from './pages/Login'
import { useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import AlbumView from './pages/AlbumView'
import ImageDetail from './pages/ImageDetail'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"))

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")
    const email = params.get("email")

    if(token){
      localStorage.setItem("token", token)
      localStorage.setItem("email", email)
      setIsAuthenticated(true)
      window.history.replaceState({}, document.title, "/")
    }
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    setIsAuthenticated(false)
  }

  if(!isAuthenticated){
    return <Login />
  }

  return (
    <Router>
      <nav className="navbar navbar-dark bg-dark mb-4">
        <div className="container">
          <span className="navbar-brand mb-0 h1">📸 KaviosPix</span>
          <div>
            <span className="text-light me-3">{localStorage.getItem("email")}</span>
            <button className="btn btn-sm btn-outline-light" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      <div className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/albums/:albumId" element={<AlbumView />} />
          <Route path="/albums/:albumId/images/:imageId" element={<ImageDetail />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      
    </Router>
  )
}

export default App
