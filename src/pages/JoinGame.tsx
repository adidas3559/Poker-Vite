import { Link } from 'react-router-dom';
import TestGameView from './TestGameView';


const JoinGame = () => {

  return (
   <>
      <h1>Join Game!</h1>

      <Link to="/join-game">Join Game</Link>
      <Link to="/host-game">Host Game</Link>

      <TestGameView />
   </>
  )
}

export default JoinGame