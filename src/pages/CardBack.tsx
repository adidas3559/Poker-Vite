
import Card from "../models/Card";

interface props {
  card: Card;
}

const CardFront = (props: props) => {
// console.log('🚀 ~ HomePage ~ card:', props.card);

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