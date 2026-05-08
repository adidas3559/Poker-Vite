
import type { CardState } from '../types/GameState';

interface props {
  card: CardState;
}

const CardFront = (props: props) => {

  const renderCard = () => {
    // let cardType: Suit;
    const title: string = `${props.card.suit}-${props.card.number}`;

    return (
      <img src={`../assets/cards/${title}.png`} alt="" />
    )
  }

  return (
    <div className='card'>
      {renderCard()}
    </div>
  )
}

export default CardFront;