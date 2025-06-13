import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#262626]/95 backdrop-blur-md py-2 shadow-lg"
          : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-2"
            >
              <img src="/images/1.png" alt="Clyne Logo" className="h-12 w-auto" />
              <span className="text-2xl font-bold bg-gradient-to-r from-[#6C5DD3] to-[#8875FF] bg-clip-text text-transparent">Clyne</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-white hover:text-[#6C5DD3] transition-colors">Home</Link>
          </div>

          {/* Dashboard button */}
          <div className="hidden md:flex items-center">
            <Link
              to="/dashboard"
              className="bg-[#6C5DD3] hover:bg-[#5849B1] text-white py-2 px-6 rounded-lg transition-colors shadow-md"
            >
              Dashboard
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              className="text-white hover:text-[#6C5DD3] focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#262626] border-t border-[#3A3A3D] mt-2">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className="block px-3 py-2 text-white hover:bg-[#3A3A3D] rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            
            <div className="pt-4 flex flex-col space-y-2">
              <Link
                to="/dashboard"
                className="block px-3 py-2 text-center bg-[#6C5DD3] hover:bg-[#5849B1] text-white rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 