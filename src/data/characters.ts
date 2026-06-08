import charArthur from '../assets/characters/char_arthur.png';
import charDutch from '../assets/characters/char_dutch.png';
import charHosea from '../assets/characters/char_hosea.png';
import charJavier from '../assets/characters/char_javier.png';
import charJohnMarston from '../assets/characters/char_john-marston.png';
import charLenny from '../assets/characters/char_lenny.png';
import charMicah from '../assets/characters/char_micah.png';
import charSadie from '../assets/characters/char_sadie.png';
import charSean from '../assets/characters/char_sean.png';

export type Character = { id: string; img: string; name: string };

export const CHARACTERS: Character[] = [
  { id: 'char_arthur',       img: charArthur,      name: 'Arthur Morgan'      },
  { id: 'char_dutch',        img: charDutch,       name: 'Dutch van der Linde' },
  { id: 'char_hosea',        img: charHosea,       name: 'Hosea Matthews'     },
  { id: 'char_javier',       img: charJavier,      name: 'Javier Escuella'    },
  { id: 'char_john-marston', img: charJohnMarston, name: 'John Marston'       },
  { id: 'char_lenny',        img: charLenny,       name: 'Lenny Summers'      },
  { id: 'char_micah',        img: charMicah,       name: 'Micah Bell'         },
  { id: 'char_sadie',        img: charSadie,       name: 'Sadie Adler'        },
  { id: 'char_sean',         img: charSean,        name: 'Sean MacGuire'      },
];

export const getCharacterById = (id: string): Character | undefined =>
  CHARACTERS.find(c => c.id === id);
