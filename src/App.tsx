
import './App.css'
import SocketProvider from './contexts/SocketContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import JoinGame from './components/JoinGame';
import HostGame from './components/HostGame';
import GameView from './components/GameView';
import PostGame from './components/PostGame';
import Lobby from './components/Lobby';
// import logo from './assets/poker-logo.png';

function App() {

  return (
    <>

      <SocketProvider>
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
            <Route path="/game" element={<GameView />} />
            <Route path="/post-game" element={<PostGame />} />
            <Route path="/lobby" element={<Lobby />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </>
  )
}

export default App
