import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Chat from '../components/Chat'
import { ChevronLeft, Search, Cpu, SquareLibrary , Rocket, FolderOpen} from 'lucide-react'

const TABS = ['Overview', 'Architecture', 'Get Started']

export default function DashboardPage({ repoData }) {
  const [activeTab, setActiveTab] = useState('Overview')
  const navigate = useNavigate()

  if (!repoData) { navigate('/'); return null }

  const { owner, repo, files_count, chunks_indexed, overview } = repoData

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] md:h-[calc(100vh-73px)] overflow-x-hidden">
      {/* REPO HEADER */}
      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 lg:px-8 py-3 sm:py-5 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-dark to-rose flex items-center justify-center text-lg sm:text-xl flex-shrink-0"><FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" /></div>
        <div className="flex-1 min-w-0">
          <h2 className="font-syne font-bold text-sm sm:text-lg truncate">{owner} / {repo}</h2>
          <div className="flex gap-1.5 sm:gap-2 mt-1 flex-wrap">
            <span className="text-[10px] sm:text-xs border border-cyan/30 text-cyan bg-cyan/5 px-2 sm:px-3 py-0.5 rounded-full">{files_count} files</span>
            {overview?.stack?.slice(0,3).map(s => (
              <span key={s} className="text-[10px] sm:text-xs border border-rose/30 text-rose bg-rose/5 px-2 sm:px-3 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        </div>
        <button onClick={() => navigate('/')} className="text-xs sm:text-sm border flex flex-row items-center border-gray-200 text-[#0f1f36]/40 dark:border-white/10 dark:text-white/40 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl hover:border-cyan hover:text-cyan transition-all flex-shrink-0">
          <ChevronLeft className='h-3.5 sm:h-4'/> 
          <p className="hidden sm:block">New repo</p>
        </button>
      </div>

      {/* STACKED ON MOBILE / SPLIT ON DESKTOP */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
        {/* TABS SECTION */}
        <div className="w-full lg:w-[60%] lg:overflow-y-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
            <div className="flex gap-1 p-1 bg-gray-100 border border-gray-200 dark:bg-[#0f1724] dark:border-white/10 rounded-xl w-fit mb-4 sm:mb-6">
                {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-syne font-semibold text-xs sm:text-sm transition-all ${
                    activeTab === tab
                        ? 'bg-gradient-to-r from-cyan-dark to-rose-dark text-white'
                        : 'text-[#0f1f36]/40 hover:text-[#0f1f36]/70 dark:text-white/40 dark:hover:text-white/70'
                    }`}>
                    {tab}
                </button>
                ))}
            </div>

          {activeTab === 'Overview' && (
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="bg-white border border-gray-200 dark:bg-[#0f1724] dark:border-white/10 rounded-2xl p-4 sm:p-6">
                <div className="text-xs font-syne flex flex-row items-center font-bold tracking-widest text-[#0f1f36]/30 dark:text-white/30 uppercase mb-2 sm:mb-3">
                    <Search className='h-4'/>
                    What is this?
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-[#0f1f36]/80 dark:text-white/80 font-light">{overview?.what}</p>
              </div>
              <div className="bg-white border border-gray-200 dark:bg-[#0f1724] dark:border-white/10 rounded-2xl p-4 sm:p-6">
                <div className="text-xs flex flex-row items-center font-syne font-bold tracking-widest text-[#0f1f36]/30 dark:text-white/30 uppercase mb-2 sm:mb-3">
                    <Cpu className='h-4' />
                    Tech Stack
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {overview?.stack?.map(s => (
                    <span key={s} className="text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg bg-gray-100 border border-gray-200 dark:bg-[#141d2e] dark:border-white/10 text-cyan-dark dark:text-cyan-light font-medium">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Architecture' && (
            <div className="bg-white border border-gray-200 dark:bg-[#0f1724] dark:border-white/10 rounded-2xl p-4 sm:p-6">
              <div className="text-xs font-syne flex flex-row items-center font-bold tracking-widest text-[#0f1f36]/30 dark:text-white/30 uppercase mb-2 sm:mb-3">
                <SquareLibrary className='h-4' />
                Architecture
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-[#0f1f36]/80 dark:text-white/80 font-light">{overview?.architecture}</p>
            </div>
          )}

          {activeTab === 'Get Started' && (
            <div className="bg-white border border-gray-200 dark:bg-[#0f1724] dark:border-white/10 rounded-2xl p-4 sm:p-6">
              <div className="text-xs font-syne flex flex-row items-center font-bold tracking-widest text-[#0f1f36]/30 dark:text-white/30 uppercase mb-2 sm:mb-3">
                <Rocket className='h-4' />
                Get Started
              </div>
              <div className="flex flex-col gap-3 sm:gap-4">
                {overview?.getting_started?.map((step, i) => (
                  <div key={i} className="flex gap-2 sm:gap-3 items-start items-center">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-cyan-dark to-rose flex items-center justify-center font-syne font-bold text-[10px] sm:text-xs text-white flex-shrink-0 mt-0.5">{i+1}</div>
                    <p className="text-xs sm:text-sm leading-relaxed text-[#0f1f36]/80 dark:text-white/80">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CHAT — below tabs on mobile, right side on desktop */}
        <div className="w-full lg:w-[40%] p-3 sm:p-6 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-white/10 lg:overflow-hidden min-h-[350px] sm:min-h-[400px]">
            <Chat repoName={`${owner}/${repo}`} />
        </div>
      </div>
    </div>
  )
}
