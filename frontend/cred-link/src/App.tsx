import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HeroPage from './HeroPage';

import './App.css'

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HeroPage />} />
      </Routes>
    </Router>
  )
}

export default App
