import React from 'react';
import Logo from '../assets/logo.png'
import ConnectButton from './ConnectButton'

const Header = () => {
  return (
    <div className="sticky top-0 z-50 flex bg-[#0A2223] text-white font-bold py-8 px-6 md:px-20 items-center justify-between">
      <div className='flex'>
        <img src={Logo} alt="" />
      <h1 className="text-3xl font-light tracking-widest">CredLink</h1>
      </div>
      
        <ConnectButton/>
    </div>
  );
};

export default Header;
