import { useAccount } from "wagmi";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { UserIcon, HandCoinsIcon } from "lucide-react";
import Network from "../assets/network.jpeg";
import { useNavigate } from "react-router-dom";

const HeroPage = () => {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isBorrowerModalOpen, setIsBorrowerModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [borrowerId, setBorrowerId] = useState("");

  const handleOpen = () => {
    if (!isConnected) {
      setShowError(true);
      return;
    }
    setIsOpen(true);
    setShowError(false);
  };

  const handleInputChange = (e) => {
    setBorrowerId(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!borrowerId) return;
    alert(`Submitted ID: ${borrowerId}`);
    navigate("/borrower-dashboard");
    setIsLoginModalOpen(false);
  };

  const handleBorrowClick = () => {
    setIsOpen(false);
    setIsBorrowerModalOpen(true);
  };

  return (
    <div className="flex flex-col md:flex-row h-auto md:h-[550px]">
      <div className="w-full md:w-1/2 bg-[#0A2540] text-white flex items-center justify-center p-6 md:p-10">
        <div className="text-center max-w-md">
          <h2 className="text-3xl md:text-5xl font-light leading-tight tracking-wider mb-4 md:mb-6">
            DECENTRALIZED <br /> TRADE FINANCE <br /> PLATFORM.
          </h2>
          <p className="text-xs md:text-sm text-gray-300 leading-relaxed mb-6 md:mb-8">
            Unlocking Decentralized Trade Finance for FX-restricted Markets
          </p>
          <button
            onClick={handleOpen}
            className="border border-white px-5 py-2 md:px-6 md:py-3 rounded-full text-xs md:text-sm tracking-wider hover:bg-[#2563eb] hover:text-[#0A2223] transition"
          >
            GET STARTED
          </button>
          {showError && (
            <p className="mt-4 text-xs text-red-400">
              Please connect your wallet to continue.
            </p>
          )}
        </div>
      </div>

      <div className="w-full md:w-1/2 h-64 md:h-[550px]">
        <img src={Network} alt="Network" className="w-full h-full object-cover" />
      </div>

      {/* GET STARTED Modal */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 blur-sm" enterTo="opacity-100 blur-none" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center px-4 py-8 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-90" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-90">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all space-y-6">
                  <Dialog.Title className="text-2xl font-semibold text-center text-[#0A2540]">
                    Welcome to Credlink
                  </Dialog.Title>
                  <p className="text-sm text-gray-600 text-center">
                    Credlink enables businesses to access credit lines for international purchases, bypassing traditional banking limitations.
                  </p>

                  <div className="flex justify-around gap-4 pt-4">
                    <button
                      className="flex items-center gap-2 bg-[#0A2540] text-white px-5 py-2 rounded-full hover:bg-[#0a3a60] transition"
                      onClick={() => navigate("/lender-dashboard")}
                    >
                      <HandCoinsIcon size={18} />
                      LEND
                    </button>
                    <button
                      className="flex items-center gap-2 bg-[#0A2540] text-white px-5 py-2 rounded-full hover:bg-[#0a3a60] transition"
                      onClick={handleBorrowClick}
                    >
                      <UserIcon size={18} />
                      BORROW
                    </button>
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-sm text-gray-500 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Borrower Options Modal */}
      <Transition appear show={isBorrowerModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsBorrowerModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 blur-sm" enterTo="opacity-100 blur-none" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center px-4 py-8 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-90" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-90">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all space-y-6">
                  <Dialog.Title className="text-2xl font-semibold text-center text-[#0A2540]">
                    Onboard or Login
                  </Dialog.Title>
                  <p className="text-sm text-gray-600 text-center">
                    To proceed as a borrower, please choose one of the following options:
                  </p>

                  <div className="flex justify-around gap-4 pt-4">
                    <button
                      className="flex items-center gap-2 bg-[#0A2540] text-white px-5 py-2 rounded-full hover:bg-[#0a3a60] transition"
                      onClick={() => navigate("/borrower-form")}
                    >
                      Register
                    </button>
                    <button
                      className="flex items-center gap-2 bg-[#0A2540] text-white px-5 py-2 rounded-full hover:bg-[#0a3a60] transition"
                      onClick={() => {
                        setIsBorrowerModalOpen(false);
                        setIsLoginModalOpen(true);
                      }}
                    >
                      Login with ID
                    </button>
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      onClick={() => setIsBorrowerModalOpen(false)}
                      className="text-sm text-gray-500 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Login Modal */}
      <Transition appear show={isLoginModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsLoginModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 blur-sm" enterTo="opacity-100 blur-none" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center px-4 py-8 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-90" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-90">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <h1 className="text-2xl font-bold text-center text-blue-600 mb-4">
                    Welcome to the Borrower Platform!
                  </h1>
                  <p className="text-gray-600 text-center mb-6">
                    Please enter your ID to continue.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="borrowerId" className="block text-sm font-medium text-gray-700">
                        User ID
                      </label>
                      <input
                        type="text"
                        id="borrowerId"
                        name="borrowerId"
                        value={borrowerId}
                        onChange={handleInputChange}
                        placeholder="Enter your ID"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
                    >
                      Submit
                    </button>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default HeroPage;
