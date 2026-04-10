import { Link } from 'react-router-dom';


const HomePage = () => {

  return (
   <div className='container flex-centered column bg-vintage'>
      <h1>Amazing World Of Poker!</h1>

      <Link className='btn' to="/join-game">Join Game</Link>
      <Link className='btn' to="/host-game">Host Game</Link>
   </div>
  )
}

export default HomePage