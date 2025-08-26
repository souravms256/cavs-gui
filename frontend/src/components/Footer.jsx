// src/components/Footer.jsx
import { FaLinkedin, FaInstagram, FaTwitter, FaGithub } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-white py-6 mt-8">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center px-4">
        {/* Copyright Section */}
        <p className="text-sm mb-4 sm:mb-0">
          © {currentYear} Auth<b>Verify</b>. All rights reserved.
        </p>

        {/* Social Media Icons */}
        <div className="flex space-x-6">
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-white hover:text-blue-500 transition-colors duration-300"
          >
            <FaLinkedin size={24} />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-white hover:text-pink-500 transition-colors duration-300"
          >
            <FaInstagram size={24} />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
            className="text-white hover:text-blue-400 transition-colors duration-300"
          >
            <FaTwitter size={24} />
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-white hover:text-gray-400 transition-colors duration-300"
          >
            <FaGithub size={24} />
          </a>
        </div>
      </div>
    </footer>
  );
}