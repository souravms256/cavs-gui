import { useState } from "react";
import { FaBars, FaTimes } from 'react-icons/fa';

export default function Header({ onNavigate, isLoggedIn, onSignOut }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    onSignOut();
    onNavigate("landing");
  };

  return (
    <header className="absolute top-0 left-0 w-full z-50 p-6 text-white bg-black bg-opacity-10 backdrop-filter transition-colors duration-300">
      <div className="container mx-auto flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">
          <button
            onClick={() => onNavigate("landing")}
            className="focus:outline-none hover:text-gray-300 transition-colors duration-200"
          >
            <span className="font-light">Auth</span>Verify
          </button>
        </h1>

        {/* Mobile toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <FaTimes className="h-6 w-6" />
            ) : (
              <FaBars className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Nav links */}
        <nav
          className={`md:flex md:items-center md:space-x-6 ${
            isMobileMenuOpen
              ? "flex flex-col items-center mt-4 space-y-4 w-full absolute top-full left-0 bg-black bg-opacity-20 py-4 transition-all duration-300 ease-in-out"
              : "hidden"
          }`}
        >
          {/* Always show HOME link */}
          <button onClick={() => onNavigate("landing")} className="mx-2 text-base font-normal hover:text-gray-300">
            HOME
          </button>
          
          {!isLoggedIn ? (
            <>
              {/* Landing page section links */}
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="mx-2 text-base font-normal hover:text-gray-300">
                FEATURES
              </a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="mx-2 text-base font-normal hover:text-gray-300">
                PRICING
              </a>
              <a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)} className="mx-2 text-base font-normal hover:text-gray-300">
                TESTIMONIALS
              </a>

              {/* Authentication links */}
              <button onClick={() => onNavigate("signin")} className="mx-2 hover:text-gray-300">SIGN IN</button>
              <button onClick={() => onNavigate("signup")} className="mx-2 hover:text-gray-300">SIGN UP</button>
            </>
          ) : (
            <>
              {/* Logged in links */}
              <button onClick={() => onNavigate("dashboard")} className="mx-2 hover:text-gray-300">DASHBOARD</button>
              <button onClick={handleSignOut} className="mx-2 hover:text-gray-300">SIGN OUT</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
