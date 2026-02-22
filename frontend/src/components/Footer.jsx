export default function Footer() {
  return (
    <footer className="relative z-10 mt-auto border-t border-gray-200 dark:border-white/10 bg-transparent">
      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-5">
        <p className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          All rights reserved | Matan Ohayon © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}
