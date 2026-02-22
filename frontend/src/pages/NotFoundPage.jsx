import { Link } from 'react-router-dom'
import { Home, Search } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-57px)] sm:min-h-[calc(100vh-73px)] px-4 sm:px-6 text-center">
      <div className="max-w-md w-full">
        {/* 404 number */}
        <div className="flex flex-col items-center gap-3 mb-10 font-syne font-extrabold text-[8rem] sm:text-[10rem] leading-none tracking-tighter bg-gradient-to-r from-cyan to-rose bg-clip-text text-transparent select-none">
          404
          <img
            className="h-20 sm:h-24 opacity-90"
            src="/gitwhiz_logo.png"
            alt="GitWhiz"
          />
        </div>

        {/* Cat illustration / logo */}
        <div className="flex justify-center -mt-90  sm:-mt-8 mb-4">

        </div>

        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs font-medium tracking-widest uppercase text-cyan border border-cyan/20 bg-cyan/5 dark:bg-cyan/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6">
          <Search className="w-3.5 h-3.5" />
          Page not found
        </div>

        <h1 className="font-syne font-bold text-xl sm:text-2xl text-[#0f1f36] dark:text-white mb-2">
          This page went for a walk
        </h1>
        <p className="text-[#0f1f36]/50 dark:text-white/50 text-sm sm:text-base mb-8">
          The URL you're looking for doesn't exist or was moved. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-syne font-semibold text-sm bg-gradient-to-r from-cyan-dark to-rose-dark text-white hover:scale-105 transition-all shadow-lg shadow-cyan/20"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
