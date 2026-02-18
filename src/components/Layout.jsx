import { Outlet, Link } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Zap } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1f2937',
            border: '1px solid #374151',
            color: '#f3f4f6',
          },
        }}
      />
      <header className="sticky top-0 z-50 border-b border-gray-800/80 bg-gray-950/80 backdrop-blur-md px-6 py-3">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight hover:text-blue-400 transition-colors"
          >
            <Zap className="h-5 w-5 text-blue-500" />
            Quiz-App
          </Link>
          <Link
            to="/quizzes"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Alle Quizzes
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
