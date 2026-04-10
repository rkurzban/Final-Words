import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/AppShell'
import AuthPage from './pages/AuthPage'
import AuthCallback from './pages/AuthCallback'
import MessagesPage from './pages/MessagesPage'
import MessageFormPage from './pages/MessageFormPage'
import ExecutorsPage from './pages/ExecutorsPage'
import ExecutorDashboard from './pages/ExecutorDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/messages" replace />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/new" element={<MessageFormPage />} />
          <Route path="/messages/:id" element={<MessageFormPage />} />
          <Route path="/executors" element={<ExecutorsPage />} />
          <Route path="/executor" element={<ExecutorDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
