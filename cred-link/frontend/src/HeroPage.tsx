import Network from '../src/assets/network.jpeg';

const HeroPage = () => {
  return (
    <div className="flex h-[550px] ">
      <div className="w-1/2 bg-[#0A2540] text-white flex items-center justify-center p-10">
        <div className="text-center max-w-md">
          <h2 className="text-5xl font-light leading-tight tracking-wider mb-6">
           DECENTRALIZED <br /> TRADE FINANCE <br /> PLATFORM.
          </h2>
          <p className="text-sm leading-relaxed text-gray-300 mb-8">
            Unlocking Decentralized Trade Finance for FX-restricted Markets
          </p>
          <button className="border border-white px-6 py-3 rounded-full text-sm tracking-wider hover:bg-white hover:text-[#0A2223] transition">
            GET STARTED
          </button>
        </div>
      </div>
      <div className="w-1/2 h-[550px]">
        <img
          src={Network}
          alt="Claire Background"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default HeroPage;
