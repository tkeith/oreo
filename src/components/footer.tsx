import { Link } from "@tanstack/react-router";

interface FooterProps {
  className?: string;
}

export function Footer({ className = "" }: FooterProps) {
  return (
    <footer className={`border-t border-gray-200 bg-white py-6 ${className}`}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
          <div className="text-sm text-gray-500">
            Built at the YC Agents Hackathon by @tsrkeith and @rileyshu_rs
          </div>
          <nav className="flex items-center space-x-6">
            <a
              href="mailto:trevor@codapt.ai"
              className="text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              Email us
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
