
import type { CardState } from '../types/GameState';

interface props {
  card: CardState;
}

const CardFront = (props: props) => {
  console.log('🚀 ~ CardFront ~ props:', props);

  const renderCard = () => {
    // let cardType: Suit;
    const title: string = `${props.card.number}-${props.card.suit}`;
    console.log('🚀 ~ renderCard ~ title:', title);

    return (
      <img src={`../assets/cardsAlt/${title}.svg`} alt="" />
      // <img src='../assets/cardsAlt/spades-queen.svg' />
    )
  }

  return (
    <div className='card'>
      {renderCard()}
    </div>
  )
}

export default CardFront;