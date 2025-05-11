import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HeroPage from './pages/HeroPage';
import Header from './components/Header';
import Footer from './components/Footer';
import BorrowerOnboardingForm from './components/BorrowerOnboardingForm';
import BorrowerProfile from './pages/BorrowerProfile';
import BorrowerDashboard from './components/BorrowerDashboard';

import './App.css'
import LenderDashboard from './pages/LenderDashboard';
import DepositDashboard from './components/DepositDashboard';

function App() {

  return (
    <Router>
      <div className='bg-[#0A2540]'>
        <Header/>
        <Routes>
          <Route path="/" element={<HeroPage />} />
          <Route path='/borrower-form' element={<BorrowerOnboardingForm/>} />
          <Route path='/borrower-profile' element={<BorrowerProfile/>} />
          <Route path='/borrower-dashboard' element={<BorrowerDashboard/>} />
          <Route path='/lender-dashboard' element={<LenderDashboard/>} />
          <Route path='/deposit' element={<DepositDashboard/>} />
        </Routes>
        <Footer/>
      </div>
    </Router>
  )
}

export default App
