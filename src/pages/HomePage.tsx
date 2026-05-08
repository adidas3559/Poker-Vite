import { Link } from 'react-router-dom';
import './HomePage.css';

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

      <div className="home-bg" />

      <div className="home-bar-top" />

      <div className="home-bar-bottom" />

      <div className="home-content">
        <h1 className="home-title">Red Read Royal</h1>
        <Link className='btn' to="/join-game">Join Game</Link>
        <Link className='btn' to="/host-game">Host Game</Link>
        <Link className='btn' to="/test-game">Test Game</Link>
        <Link className='btn' to="/mobile-test">Mobile Test</Link>
      </div>

    </div>
  );
};

export default HomePage
