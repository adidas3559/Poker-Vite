
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import JoinGame from './pages/JoinGame';
import HostGame from './pages/HostGame';
import TestGameView from './pages/TestGameView';
import MobileTestGameView from './pages/MobileTestGameView';
// import logo from './assets/poker-logo.png';

function App() {

  return (
    <>

      <BrowserRouter>
        {/* Navigation */}
        {/* <nav className='nav'>
          <Link className='navLogo' to="/"><img src={logo} alt="Nav Logo" />Home</Link>
        </nav> */}

        {/* Routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/join-game" element={<JoinGame />} />
          <Route path="/host-game" element={<HostGame />} />
          <Route path="/test-game" element={<TestGameView />} />
          <Route path="/mobile-test" element={<MobileTestGameView />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
