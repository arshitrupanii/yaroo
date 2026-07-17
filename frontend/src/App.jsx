import { useEffect } from 'react'
import { Route, Routes,Navigate } from 'react-router-dom'

import Navbar from './components/Navbar'
import Homepage from './Pages/Homepage'
import Profile from './Pages/Profile'
import LoginPage from './Pages/LoginPage'
import Signup from './Pages/Signup'
import SettingPage from './Pages/SettingPage'
import ForgotPassword from './Pages/ForgotPassword'
import ResetPassword from './Pages/ResetPassword'

import { Loader } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/useAuhstore'
import { Usethemes } from './store/useTheme'

function App() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const {theme} = Usethemes()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if(isCheckingAuth && !authUser) return(
    <div className='flex justify-center items-center h-screen'>
      <Loader className='animate-spin text-primary' size={50} />
    </div>
  )

  return (
    <div data-theme={theme} className="min-h-screen bg-base-100 text-base-content">
      <Navbar />
      
      <Routes>
        <Route path="/" element={authUser ? <Homepage /> : <Navigate to="/login" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/signup" element={!authUser ? <Signup /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={!authUser ? <ForgotPassword /> : <Navigate to="/" />} />
        <Route path="/reset-password/:token" element={!authUser ? <ResetPassword /> : <Navigate to="/" />} />
        <Route path="/profile" element={authUser ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/setting" element={ <SettingPage /> } />
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "6px",
            background: "hsl(var(--b1))",
            color: "hsl(var(--bc))",
            border: "1px solid hsl(var(--b3))",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          },
          error: {
            style: {
              border: "1px solid hsl(var(--er) / 0.35)",
            },
          },
          success: {
            style: {
              border: "1px solid hsl(var(--su) / 0.35)",
            },
          },
        }}
      />
    </div>
  )
}

export default App
