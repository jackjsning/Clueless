import {roomNameMap, characters, weapons, colors, rooms, Player, CardComponent} from './BoardComponents'


export const UpdateSessionStorage = ({game_status}) => {
    const { live, players: s, winner: w, cur_player, cards, user_to_player, shown_cards} = game_status;

    if(live){
      sessionStorage.setItem('gameStatus', 'Live');
    }
    else{
      sessionStorage.setItem('gameStatus', 'Not Live');
    };  

    sessionStorage.setItem('players', JSON.stringify(s));
    sessionStorage.setItem('winner', w);
    sessionStorage.setItem('cur_player', cur_player);
    sessionStorage.setItem('cards', JSON.stringify(cards));
    sessionStorage.setItem('player_id', user_to_player[GetData('username')]);
    sessionStorage.setItem('shown_cards', JSON.stringify(shown_cards))
};

export const GetData = (key) => {
    if (typeof sessionStorage !== 'undefined') 
    {
      return(sessionStorage.getItem(key));
    };
    return('');
};

export function CardArray(){
  let all_cards = [];

  try{
    const cards = GetData('cards');
    let player_id = GetData('player_id');
    const card_obj = JSON.parse(cards);
    player_id = parseInt(player_id);
    
    const suspect = card_obj.suspect[player_id].map((s, i) => characters[s]);
    const weapon = card_obj.weapon[player_id].map((s, i) => weapons[s]);
    const room = card_obj.room[player_id].map((s, i) => roomNameMap[`${Math.floor(s / 3)*2}-${(s%3) * 2}`]);
    all_cards = suspect.concat(weapon.concat(room));
    }catch(e){};

  return(all_cards);
};

export function PlayerRoomId()
{
  const players = JSON.parse(GetData('players'));
  const player_id = GetData('player_id');
  let coord = players[player_id];
  return(coord[0]/2*3 + coord[1]/2)
};

export const Card = () => {
    let all_cards = CardArray();
    return(<CardComponent all_cards={all_cards}/>)
};

function playerSelector(live){
  const outputList = [];
  const players_string = GetData('players');
  try
  {
    const players = JSON.parse(players_string);
    
    for (let i = 0; i < players.length; i++) {
      if(players[i][0] == null || players[i][1] == null) {
          if(!live) outputList.push(i);
      }else{
          if(live) outputList.push(i);
      }
    };
  }catch(e){};
  
  return(outputList);
};

export const SelectPlayers = ({live}) => {
  let outputList = playerSelector(live);
  if(!outputList.length) return(<div></div>);
  return(<MultiplePlayers ids={outputList}/>)
};

export const MultiplePlayers = ({ids}) => {
  return(
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
    {ids.map((player_id, _) => 
      <div style={{ display: 'flex', flexWrap: 'wrap', margin: '20px'}}>
        <Player name={characters[player_id]} bgcolor={colors[player_id]}/>
      </div>)}
    </div>
    )
}; 

export function DisprovableCards(disprove_data){
  let {suspect: s, weapon: w, room: r} = disprove_data;
  const all_cards = CardArray();
  let disprove_card = [characters[s], weapons[w], rooms[r]];
  let outputList = all_cards.filter(value => disprove_card.includes(value));
  return(outputList);
};

export function UsableCards(){
  return(CardArray());
};

export function GetCardID(card_name){
  if(rooms.indexOf(card_name) != -1) return(['room', rooms.indexOf(card_name)]);
  if(weapons.indexOf(card_name) != -1) return(['weapon', weapons.indexOf(card_name)]);
  if(characters.indexOf(card_name) != -1) return(['suspect', characters.indexOf(card_name)]);
  return([null, null])
};

export function GetShownCards(){
  let outputList = [];

  try{
    const shown_cards = GetData('shown_cards');
    const card_obj = JSON.parse(shown_cards);
    let suspect = [];
    let weapon = [];
    let room = [];
    if('suspect' in card_obj) suspect = card_obj.suspect.map((s, i) => characters[s]);
    if('weapon' in card_obj) weapon = card_obj.weapon.map((s, i) => weapons[s]);
    if('room' in card_obj) room = card_obj.room.map((s, i) => roomNameMap[`${Math.floor(s / 3)*2}-${(s%3) * 2}`]);
    outputList = suspect.concat(weapon.concat(room));
    }catch(e){};
  
  return(outputList);
};

export const ShownCards = () => {
  const outputList = GetShownCards();
  return(<CardComponent all_cards={outputList}/>)
};
