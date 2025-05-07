import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HeroPage from './HeroPage';
import Header from './components/Header';
import Footer from './components/Footer';

import './App.css'

function App() {

  return (
    <Router>
      <div className='bg-[#0A2540]'>
        <Header/>
        <Routes>
          <Route path="/" element={<HeroPage />} />
        </Routes>
        <Footer/>
      </div>
    </Router>
  )
}

export default App
