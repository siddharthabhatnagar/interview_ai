import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Button } from './Button';
import { BookOpen } from 'lucide-react';

export function Navbar() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center cursor-pointer"
          >
            <h1 className="text-2xl font-bold text-blue-600">IntervuAI</h1>
          </div>

          {/* Menu */}
          <div className="flex items-center gap-4">
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:scale-110 transition-transform"
              title="Toggle dark mode"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {currentUser && (
              <>
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm"
                >
                  Home
                </button>
                <button
                  onClick={() => navigate('/docs')}
                  className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Docs</span>
                </button>
                <button
                  onClick={() => navigate('/pricing')}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm"
                >
                  Pricing
                </button>
                <div className="hidden sm:flex items-center gap-3">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {currentUser.name}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold">
                    {currentUser.credits || 0} credits
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
