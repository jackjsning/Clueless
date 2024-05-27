'use client'
import { useState, useEffect } from 'react';
import styles from '../components/styles.module.css';
import { io } from 'socket.io-client';
import {PopupForm} from './SubmitForm';
import PopupDisproveForm from './SubmitForm';
import {GetData, UpdateSessionStorage, Card, SelectPlayers, DisprovableCards, 
        GetCardID, ShownCards, MultiplePlayers, PlayerRoomId}  from './storage_util' 
import {Block, Player, characters, colors, rooms, weapons, Confetti} from './BoardComponents'

export default function GameBoard() {

  const [socket, setSocket] = useState(null);
  const [locations, setLocations] = useState([]);
  const [isSuggestionFormVisible, setSuggestionFormVisible] = useState(false);
  const [isAccusationFormVisible, setAccusationFormVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isDisproveFormVisible, setDisproveFormVisible] = useState(false);
  const [disprovable, setDisprovable] = useState([]);
  const [disableUserAction, setDisableUserAction] = useState(true);
  const [winner, setWinner] = useState(false);

  const grid = [
    [1, 2, 1, 2, 1],
    [3, 0, 3, 0, 3],
    [1, 2, 1, 2, 1],
    [3, 0, 3, 0, 3],
    [1, 2, 1, 2, 1],
  ];
  const roomNameMap = {
  '0-0': "Study",
  '0-2': "Hall",
  '0-4': "Lounge",
  '2-0': "Library",
  '2-2': "Billiard Room",
  '2-4': "Dining Room",
  '4-0': "Conservatory",
  '4-2': "Ballroom",
  '4-4': "Kitchen",
};
  var player = -1; // also available in storage

  useEffect(() => {
    // const newSocket = io('https://clueless-game-backend.azurewebsites.net');
    const newSocket = io('http://127.0.0.1:5000');
    
    newSocket.on('connect', () => {
        console.log('Connected to the server!');
        // temp
        sessionStorage.setItem('room_id', "yasgaegqresaa");
        if(GetData('player_id')) player = parseInt(GetData('player_id'));
        setNotificationMessage(sessionStorage.getItem('notification'));
        const room_id = GetData('room_id');
        const username = GetData('username');
      
        if (room_id && username && player != -1) {
        // If we have stored session information, try to rejoin the game. 
          newSocket.emit('rejoin_game_room', { room_id, username });
        }else{
          newSocket.emit('join_game_room', { room_id: "yasgaegqresaa", username }); // lily: dont understand why this is needed
        };    
    });

    newSocket.on('setup_info', (data) => {
      const username = GetData('username');
      player = data.game_status.user_to_player[username];
      const s = data.game_status.players;
      let current_turn_player = data.game_status.player_list[data.game_status.cur_player];
      sessionStorage.setItem('notification', `Game initiated, waiting for ${current_turn_player} to take action`);
        setNotificationMessage(GetData('notification', ''));
      if(s.length) setLocations(s);
      UpdateSessionStorage({game_status: data.game_status});
    });

    newSocket.on('game_update', (data) => {
        const s = data.players;
        if(s.length) setLocations(s);
        console.log(data.player_list);
        UpdateSessionStorage({game_status: data});
        let current_turn_player = data.player_list[data.cur_player];
        console.log(current_turn_player);
        let room_name = 'hallway'
        for (let i = 0; i< data.players.length; i++){
          if(i == data.cur_player){
            const x = data.players[i][0];
            const y = data.players[i][1];
            const key = `${x}-${y}`;
            if(x !== null && y !== null && grid[x][y] == 1){
              room_name = roomNameMap[key];
            }
            break;
          }
        }
        sessionStorage.setItem('notification', `${current_turn_player} moved to ${room_name}`);
        setNotificationMessage(GetData('notification', ''));

        if(GetData('player_id') != '-1' &&
        GetData('gameStatus') == 'Live' &&
        GetData('cur_player') == GetData('player_id'))
        {
          // user can take actions after moving into a room
          let location = JSON.parse(GetData('players'));
          let coord = location[parseInt(GetData('player_id'))];
          if(grid[coord[0]][coord[1]] == 1){
            setDisableUserAction(false)
          }else{
            setDisableUserAction(true)
          } 
        }else{
          setDisableUserAction(true)
        };
      });    

    newSocket.on('start_disprove', (data) => {
      const player = data.player;
      if(player != GetData('player_id'))
      {
        let disprovable_list = DisprovableCards(data);
        if( disprovable_list.length > 0){
          setDisprovable(disprovable_list);
          setDisproveFormVisible(true);
        }
      }
    });  
    
    newSocket.on('announce_winner', (data) => {
      UpdateSessionStorage({game_status: data});
      setWinner(true);
      newSocket.emit('game_over', {room_id: GetData('room_id')});
      setLocations([]);
      sessionStorage.setItem('username', null);
    });

    newSocket.on('close_form', (data) => {closeForm()});    

    setSocket(newSocket);
    const handleKeyPress = (e) => {
      if(GetData('player_id') != -1 && GetData('gameStatus') == 'Live' 
         && GetData('player_id') == GetData('cur_player')) // only active player can move
      {
        const room_id = GetData('room_id');
        const player = GetData('player_id');
        switch(e.key) {
          case 'ArrowUp':
            newSocket.emit('update_grid', { room_id, player, x: -1, y: 0 });
            break;
          case 'ArrowDown':
            newSocket.emit('update_grid', { room_id, player, x: 1, y: 0 });
            break;
          case 'ArrowLeft':
            newSocket.emit('update_grid', { room_id, player, x: 0, y: -1 });
            break;
          case 'ArrowRight':
            newSocket.emit('update_grid', { room_id, player, x: 0, y: 1 });
            break;
          default:
            break;
        }
      };
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      newSocket.disconnect();
    };
  }, []);


  const squares = [];

  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      let peopleHere = [];
      for( let i = 0; i < locations.length; i++)
      {
        if(x == locations[i][0] && y == locations[i][1]) {
          peopleHere.push(i); 
        }
      };

      const squareType = grid[x][y];
      const coordinate = `${x}-${y}`;

      const isHere = peopleHere.length > 0;
      var person = null;
      if(isHere) person = <MultiplePlayers ids={peopleHere}/>;
   
      if (squareType === 1) {
        squares.push(
          <Block key={coordinate} blockType='room' coord={coordinate} isPlayerHere={isHere} child={person} />
        );
      } else if (squareType === 2) {
        squares.push(
          <Block key={coordinate} blockType='hallwayH' coord={coordinate} isPlayerHere={isHere} child={person} />
        );
      } else if (squareType === 0) {
        squares.push(
          <Block key={coordinate} blockType='empty' coord={coordinate} isPlayerHere={isHere} child={person} />
        );
      } else if (squareType === 3) {
        squares.push(
          <Block key={coordinate} blockType='hallwayV' coord={coordinate} isPlayerHere={isHere} child={person} />
        );
      }
    }
  }

  const startGame = () => {
    if(socket){
      socket.emit('start_game', { room_id: GetData('room_id') });
    }
  };

  const makeAccusation = () => {
    setAccusationFormVisible(true);
  };

  const makeSuggestion = () => {
    setSuggestionFormVisible(true);
  };

  function closeForm(){
    setSuggestionFormVisible(false);
    setAccusationFormVisible(false);
    setDisproveFormVisible(false);
    setDisprovable(false);
    setWinner(false);
  };

  const submitSuggestion = (select) => {
    setDisableUserAction(true);
    let {Weapons: w, Suspects: s} = select;
    const room = PlayerRoomId();
    socket.emit('make_suggestion', {room_id: GetData('room_id'),
                                    player: GetData('player_id'),
                                    suspect: characters.indexOf(s),
                                    room,
                                    weapon: weapons.indexOf(w)} )
    closeForm();
  };

  const submitAccusation = (select) =>{
    setDisableUserAction(true);
    let {Rooms: r, Weapons: w, Suspects: s} = select;
    socket.emit('make_accusation', {room_id: GetData('room_id'),
                                    player: GetData('player_id'),
                                    suspect: characters.indexOf(s),
                                    room: rooms.indexOf(r),
                                    weapon: weapons.indexOf(w)} )
    closeForm();
  };

  const submitDisprove = (select) => {
    setDisproveFormVisible(true);
    let disprove_card = GetCardID(select);
    socket.emit('disprove', {room_id: GetData('room_id'),
                             player: GetData('player_id'),
                             disprove_card} )
    closeForm();
  };

  return (
  <div style={{display: 'flex', flexDirection: 'row',  margin: '30px'}}>
  <div className={styles.grid}>{squares}</div>
  <div style={{display: 'flex', flexDirection: 'column', width : '500px'}}>
    <div className={styles.notification_header}>Instructions</div>
    <div className={styles.notification}>Hello</div>
    <div className={styles.notification_header}>Game Status</div>
    <div className={styles.game_status}>
      <p>Game Status: {GetData('gameStatus')}
      <button className={styles.button} onClick={startGame} disabled={GetData('gameStatus') == 'Live'}>
          Start Game
      </button>
      </p>
      <p>Current Player: <Player name={characters[GetData('cur_player')]} bgcolor={colors[GetData('cur_player')]}/></p>
      <p>My Cards: <Card/></p>
      <p>Shown Cards: <ShownCards/></p>
      <p>Actions:
      <button className={styles.button} onClick={makeAccusation} disabled={GetData('cur_player') !== GetData('player_id')}>
          Make Accusation
      </button>
      <button className={styles.button} onClick={makeSuggestion} disabled={disableUserAction}>
          Make Suggestion
      </button>
      </p>
      <p>Live Players: <SelectPlayers live={true}/> </p> 
      <p>Lost Players: <SelectPlayers live={false}/></p> 
      {isSuggestionFormVisible && <PopupForm onClose={closeForm} onSubmit={submitSuggestion} action_type="suggest"/>}
      {isAccusationFormVisible && <PopupForm onClose={closeForm} onSubmit={submitAccusation} action_type="accuse"/>}
      {isDisproveFormVisible && <PopupDisproveForm onClose={closeForm} onSubmit={submitDisprove} option_list={disprovable}/>}
      {winner && <Confetti onClose={closeForm}/>}
    </div> 
  </div>
  </div>
  );
}
