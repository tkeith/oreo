import { Link } from "@tanstack/react-router";

interface FooterProps {
  className?: string;
}

export function Footer({ className = "" }: FooterProps) {
  return (
    <footer className={`border-t border-gray-200 bg-white py-6 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
          <div className="text-sm text-gray-500">
            © 2025 Oreo. All rights reserved.
          </div>
          <nav className="flex items-center space-x-6">
            <a
              href="mailto:contact@example.com"
              className="text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
