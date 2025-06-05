// src/components/Footer.tsx
export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 p-4 w-full shadow-inner">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between text-sm">
        <div className="flex items-center gap-2 mb-2 md:mb-0">
          <span className="text-indigo-400">🍽️</span>
          <span className="font-medium">
            &copy; {new Date().getFullYear()} Rasant Solutions. All rights reserved.
          </span>
        </div>
        <div className="flex gap-4">
          <a href="/about" className="hover:text-white transition-colors">
            About
          </a>
          <a href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </a>
          <a href="/contact" className="hover:text-white transition-colors">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
