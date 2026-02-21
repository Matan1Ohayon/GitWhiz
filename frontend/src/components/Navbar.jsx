import { useState } from 'react'
import { SunMedium } from 'lucide-react'


export default function Navbar({ toggleTheme, dark }) {
  return (
    <nav className="relative z-10 flex items-center justify-between px-4 sm:px-10 py-3 sm:py-5 border-b border-gray-200 dark:border-white/10 bg-transparent">
      <div className="flex items-center gap-2 sm:gap-3">
        <img className='h-8 sm:h-10' src="/gitwhiz_logo.png" alt="GitWhiz Cat Logo" />
        <span className="font-syne font-extrabold text-lg sm:text-xl bg-gradient-to-r from-cyan to-rose bg-clip-text text-transparent">
          GitWhiz
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="w-11 h-6 rounded-full border border-gray-300 bg-gray-200 dark:border-white/10 dark:bg-white/5 relative transition-all"
        >
          <div className={`absolute top-1 w-4 h-4 flex items-center rounded-full bg-gradient-to-r from-cyan to-rose transition-all ${dark ? 'left-1' : 'left-6'}`}><SunMedium className='h-3' /></div>
        </button>
      </div>
    </nav>
  )
}