import { useEffect } from 'react'
import { Route, Routes, Navigate, useLocation } from 'react-router-dom'

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
import { useChatStore } from './store/useChatstore'
import { Usethemes } from './store/useTheme'
import { updateThemeBrand } from './lib/themeBrand'

function App() {
  const { authUser, checkAuth, isCheckingAuth, socket } = useAuthStore();
  const { subscribeToMessages, unsubscribeFromMessages } = useChatStore();
  const {theme} = Usethemes()
  const location = useLocation()
  const isChatPage = location.pathname === '/' && Boolean(authUser)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    const updateViewportHeight = () => {
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight
      document.documentElement.style.setProperty('--app-height', `${viewportHeight}px`)
    }

    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    window.visualViewport?.addEventListener('resize', updateViewportHeight)

    return () => {
      window.removeEventListener('resize', updateViewportHeight)
      window.visualViewport?.removeEventListener('resize', updateViewportHeight)
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('chat-page-open', isChatPage)
    return () => document.body.classList.remove('chat-page-open')
  }, [isChatPage])

  useEffect(() => {
    updateThemeBrand(theme);
  }, [theme]);

  useEffect(() => {
    if (!authUser || !socket) return undefined;

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [authUser, socket, subscribeToMessages, unsubscribeFromMessages]);

  if(isCheckingAuth && !authUser) return(
    <div data-theme={theme} className='flex h-[100dvh] items-center justify-center bg-base-100 text-base-content'>
      <Loader className='animate-spin text-primary' size={42} />
    </div>
  )

  return (
    <div
      data-theme={theme}
      className={`${isChatPage ? 'flex h-[var(--app-height)] flex-col overflow-hidden' : 'min-h-[var(--app-height)]'} bg-base-100 text-base-content`}
    >
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
            maxWidth: "360px",
            borderRadius: "8px",
            background: "hsl(var(--b1))",
            color: "hsl(var(--bc))",
            border: "1px solid hsl(var(--b3))",
            boxShadow: "0 10px 30px rgba(0,0,0,0.14)",
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
