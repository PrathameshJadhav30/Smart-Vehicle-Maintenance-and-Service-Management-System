import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-blue-300 text-sm mb-4 md:mb-0">
            &copy; 2026 SVMMS. All rights reserved.
          </p>
          <div>
            <ul className="flex flex-wrap justify-center space-x-6 text-sm text-blue-300">
              <li><Link to="/privacy" className="hover:text-white transition-colors cursor-pointer">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors cursor-pointer">Terms of Service</Link></li>
              <li><Link to="/support" className="hover:text-white transition-colors cursor-pointer">Support</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;