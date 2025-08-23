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
            Built at the YC Agents Hackathon by{" "}
            <a
              href="https://x.com/tsrkeith"
              className="text-gray-500 hover:text-gray-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              @tsrkeith
            </a>{" "}
            and{" "}
            <a
              href="https://x.com/rileyshu_rs"
              className="text-gray-500 hover:text-gray-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              @rileyshu_rs
            </a>
          </div>
          <nav className="flex items-center space-x-6">
            <a
              href="mailto:trevor@codapt.ai"
              className="text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              {/* Footer right side text */}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
