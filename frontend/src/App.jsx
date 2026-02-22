import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  const [repoData, setRepoData] = useState(null)
  const [dark, setDark] = useState(true)

  function toggleTheme() {
    document.documentElement.classList.toggle('dark')
    setDark(!dark)
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#f0f6ff] dark:bg-[#090d14] dark:text-[#e2eaf8] text-[#0f1f36]">
        <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-cyan opacity-10 blur-[120px] pointer-events-none z-0" />
        <div className="fixed bottom-[-50px] right-[-100px] w-[400px] h-[400px] rounded-full bg-rose opacity-10 blur-[120px] pointer-events-none z-0" />

        <Navbar toggleTheme={toggleTheme} dark={dark} />

        <main className="flex-1 min-h-0 flex flex-col">
          <Routes>
            <Route path="/" element={<LandingPage setRepoData={setRepoData} />} />
            <Route path="/dashboard" element={<DashboardPage repoData={repoData} />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App