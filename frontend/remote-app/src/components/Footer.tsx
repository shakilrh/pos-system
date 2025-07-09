import { useEffect } from 'react';

export default function Footer() {
  useEffect(() => {
    const handleThemeChange = (e: CustomEvent) => {
      const { theme } = e.detail;
      document.documentElement.setAttribute('data-theme', theme);
    };
    window.addEventListener('themeChange', handleThemeChange as EventListener);
    return () => window.removeEventListener('themeChange', handleThemeChange as EventListener);
  }, []);

  return (
    <footer className="p-4 w-full shadow-inner"
      style={{
        backgroundColor: 'var(--background-secondary)',
        borderColor: 'var(--border-color)'
      }}>
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between text-sm">
        <div className="flex items-center gap-2 mb-2 md:mb-0">
          <span className="text-indigo-400">🍽️</span>
          <span className="font-medium" style={{ color: 'var(--primary-color)' }}>
            © {new Date().getFullYear()} Rasant Solutions. All rights reserved.
          </span>
        </div>
        <div className="flex gap-4">
          <a
            href="/about"
            className="transition-colors hover:text-[var(--primary-600)]"
            style={{ color: 'var(--primary-color)' }}
          >
            About
          </a>
          <a
            href="/privacy"
            className="transition-colors hover:text-[var(--primary-600)]"
            style={{ color: 'var(--primary-color)' }}
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="transition-colors hover:text-[var(--primary-600)]"
            style={{ color: 'var(--primary-color)' }}
          >
            Terms of Service
          </a>
          <a
            href="/contact"
            className="transition-colors hover:text-[var(--primary-600)]"
            style={{ color: 'var(--primary-color)' }}
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}