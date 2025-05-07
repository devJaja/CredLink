import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#0A2223] text-white py-10 px-6 md:px-20">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
        <div>
          <h1 className="text-2xl font-light tracking-widest mb-2">CredLink</h1>
          <p className="text-sm text-gray-400 max-w-xs">
            Empowering cross-border trade through trust and transparency on-chain.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 text-sm text-gray-300">
          <a href="#" className="hover:text-white transition">Home</a>
          <a href="#" className="hover:text-white transition">About</a>
          <a href="#" className="hover:text-white transition">Blog</a>
          <a href="#" className="hover:text-white transition">Contact</a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700 mt-10 pt-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} CredLink. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
