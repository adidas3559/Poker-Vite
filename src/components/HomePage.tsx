import { Link } from 'react-router-dom';
import './HomePage.css';
import bg1 from '../assets/bg1.jpg';
import bg2 from '../assets/bg2.webp';
import bg3 from '../assets/bg3.jpg';
import bg4 from '../assets/bg4.jpg';
import bg5 from '../assets/bg5.jpg';
import bg6 from '../assets/bg6.jpg';
import bg7 from '../assets/bg7.jpg';
import bg8 from '../assets/bg8.jpg';

const BG_IMAGES = [bg1, bg2, bg3, bg4, bg5, bg6, bg7, bg8];
const bg = BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)];

const HomePage = () => {

  return (
    <div className="home-wrapper">

      {/* SVG filter that roughens the bar edges — must stay in JSX, can't live in CSS */}
      <svg className="home-svg-filter">
        <defs>
          <filter id="distress" x="-5%" y="-10%" width="110%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="8" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="home-bg" style={{ backgroundImage: `url(${bg})` }} />

      <div className="home-bar-top" />

      <div className="home-bar-bottom" />

      <div className="home-content">
        <h1 className="home-title">Red Read Royal</h1>
        <Link className='btn' to="/join-game">Join Game</Link>
        <Link className='btn' to="/host-game">Host Game</Link>
        {/* <Link className='btn' to="/test-game">Test Game</Link>
        <Link className='btn' to="/mobile-test">Mobile Test</Link> */}
      </div>

    </div>
  );
};

export default HomePage
