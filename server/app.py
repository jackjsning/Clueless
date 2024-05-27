from flask import Flask, jsonify, request, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import User
from __init__ import db, app
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, leave_room, send
import random 

CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# Game Logic
# use ids instead of semantic strings which are in front end

GRID = [[1, 2, 1, 2, 1],
        [2, 0, 2, 0, 2],
        [1, 2, 1, 2, 1],
        [2, 0, 2, 0, 2],
        [1, 2, 1, 2, 1]]
NUM_WEAPON = 6
NUM_ROOM = 9

class GameGrid:

    def __init__(self):
        self.grid = GRID    
        self.players = []
        self.width = len(GRID[0])
        self.height = len(GRID)
        self.live = False
        self.answer = {}
        self.winner = None
        self.current_player = None
        self.player_list = []
        self.cards = {} #str: array of array
        self.users = {}
        self.shown_cards = {} #str: array
        self.disaprovable = False # set to true after suggestion or accusation is made

    @property
    def game_status(self):
        print(self.users)
        return {'live': self.live,
                'players': self.players,
                'winner': self.winner,
                'cur_player': self.current_player,
                'cards': self.cards,
                'user_to_player': self.users, 
                'player_list' : {v: k for k, v in self.users.items()},
                'shown_cards': self.shown_cards}


    @staticmethod
    def random_assign(items: list, num_groups: int, skip: int, assign_start: int=0):
        random.shuffle(items)
        rslt = [[] for _ in range(num_groups)]
        i, j = 0, assign_start

        while i < len(items):
            if items[i] != skip:
                rslt[j].append(items[i])    
                j = (j + 1) % num_groups
            
            i += 1
        
        return rslt, j

    def distribute_cards(self):
        self.cards = {} # for the case of game restart after over
        num_groups = len(self.players)
        self.cards['suspect'], next_start = GameGrid.random_assign(list(range(num_groups)), num_groups, self.answer['killer'])
        self.cards['room'], next_start = GameGrid.random_assign(list(range(NUM_ROOM)), num_groups, self.answer['room'], assign_start=next_start)
        self.cards['weapon'], _ = GameGrid.random_assign(list(range(NUM_WEAPON)), num_groups, self.answer['weapon'], assign_start=next_start)
        print(f'cards assignments are {self.cards}')
        

    def add_player(self, user_name: str) -> int:
        if user_name in self.users:
            print(f'{user_name} already exist, player id is {self.users[user_name]}')
            return self.users[user_name]
        
        if not self.live:
            player_id = -1

            if len(self.players) < 6:
                player_id = len(self.players)
                self.players.append([None, None])
            else:
                for i in range(len(self.players)):
                    x, y = self.players[i]
                    if x is None or y is None:
                        player_id = i
                        break

            if player_id != -1:
                # assign location
                while(True):
                    x, y = random.randint(0, 4), random.randint(0, 4)
                    if [x, y] not in self.players and self.grid[x][y] != 0:
                        break

                self.players[player_id] = [x, y]
                self.users[user_name] = player_id
                self.current_player = player_id
                print(f'New player {user_name} is added with player id {player_id}')
                return player_id
 
        print(f'Game already start, player {user_name} can only audit.')
        return -1

    def move_player(self, player_id: int, x: int, y: int):
        if player_id < 0 or player_id >= len(self.players):
            raise ValueError("Invalid player")
        
        i, j = self.players[player_id]
        new_i, new_j = i + x, j + y

        if 0 <= new_i < self.height and 0 <= new_j < self.width \
            and self.grid[new_i][new_j] \
            and not ([new_i, new_j] in self.players and self.grid[new_i][new_j] == 2):
            self.players[player_id] = [new_i, new_j]
        elif (i, j) in [(0, 0), (4, 4), (0, 4), (4, 0)] \
            and [4 - i, 4 - j] not in self.players: 
            self.players[player_id] = [4 - i, 4 - j]
        else:
            return 0

        i, j = self.players[player_id]
        if self.grid[i][j] != 1:
            self.set_next_player()
        
        return 1
    
    def start_game(self):
        if not self.live: 
            if len(self.players):
                #for the case of game restart
                num = len(self.players)
                self.players = []
                for i in range(num):
                    self.add_player(i)

            self.live = True
            self.answer['weapon'] = random.choice(list(range(NUM_WEAPON)))
            self.answer['room'] = random.choice(list(range(NUM_ROOM)))
            self.answer['killer'] = random.choice(list(range(len(self.players))))
            print(self.answer)
            self.distribute_cards()
            self.current_player = 0
            # below are for game restarted only
            self.winner = None
            self.shown_cards = {}
        else:
            print('Game already started.')

    def is_player_live(self, player_id: int) -> bool:
        return 0 <= player_id < len(self.players) and \
                self.players[player_id][0] != -1 and self.players[player_id][1] != -1
    
    def terminate_player(self, player_id: int) -> bool:
        if self.live and self.is_player_live(player_id):
            self.players[player_id] = [None, None]
            print(f'Player {player_id} is terminated successfully.')
            return True
        
        print(f'Player {player_id} can not be terminated')
        return False

    def __get_room_coord(self, room_id: int):
        # with valid room_id
        return [room_id // 3 * 2, room_id % 3 * 2 ]

    def set_next_player(self):
        self.shown_card_new = False

        if self.current_player is not None:
            next_player = (self.current_player + 1) % len(self.players)
            while self.players[next_player][0] is None:
                next_player = (next_player + 1) % len(self.players)
            self.current_player = next_player
        else:
            self.current_player = 0
        print(f"setting next player to {self.current_player}")
        socketio.emit('set_active_player', {'active_player': self.current_player})

    def is_suggestion_valid(self, player_id: int, suspect: int, room_id: int, weapon_id: int):
        return self.is_player_live(player_id) and self.is_player_live(suspect) \
            and 0 <= room_id < 9 and 0 <= weapon_id < 6 \
            and self.__get_room_coord(room_id) == self.players[player_id]
    
    def is_accusation_valid(self, player_id: int, suspect: int, room_id: int, weapon_id: int):
        return self.is_player_live(player_id) and self.is_player_live(suspect) \
            and 0 <= room_id < 9 and 0 <= weapon_id < 6 

    def _check_answer(self, suspect: int, room: int, weapon: int) -> bool:
        return self.answer.get('killer', -1) == suspect and \
               self.answer.get('room', -1) == room and \
               self.answer.get('weapon', -1) == weapon

    def terminate_game(self):
        for i in range(len(self.players)):
            self.terminate_player(i)
        self.live = False
        self.answer = {}
        self.current_player = None
        self.disaprovable = False 

    def suggest(self, player_id: int, suspect: int, room_id: int, weapon_id: int):
        if self.is_suggestion_valid(player_id, suspect, room_id, weapon_id):
            self.disaprovable = True
            self.players[suspect] = self.__get_room_coord(room_id)
            if self._check_answer(suspect, room_id, weapon_id):
                self.winner = player_id
                return True    
        else:
            print('Suggestion is not valid')
        
        return False

    def accuse(self, player_id: int, suspect: int, room: int, weapon: int) -> bool:
        if self.is_accusation_valid(player_id, suspect, room, weapon):
            print(f'Valid accusation, comparing with {self.answer}')       
            self.disaprovable = True

            if self._check_answer(suspect, room, weapon):
                print(f'Accusation is correct, {player_id} wins the game')
                self.winner = player_id
                return True
        
        print('Accusation is not valid or false. User is terminated')
        self.terminate_player(player_id)    
        if self.num_live_players == 1:
            self.winner = self.get_winner() 
        return False
    
    @property
    def num_live_players(self):
        num = 0
        for x, y in self.players:
            if x is not None and y is not None and x > -1 and y > -1:
                num += 1
        return num

    def get_winner(self):
        if self.num_live_players == 1:
            for i in len(range(self.players)):
                x, y = self.players[i]
                if x is not None and y is not None and x > -1 and y > -1:
                    return i
        return None

    def disprove(self, player_id: int, card_type: str, card_id: int):
        # disprove recognize the fastest player only
        if self.disaprovable and card_id in self.cards[card_type][player_id]:
            self.disaprovable = False

            self.cards[card_type][player_id].remove(card_id)
            
            # add to shown cards
            if card_type in self.shown_cards:
                self.shown_cards[card_type].append(card_id)
            else:
                self.shown_cards[card_type] = [card_id]
            
            self.set_next_player()

    def possible_to_disprove_by_others(self, player_id: int, suspect: int, room: int, weapon: int):
        return weapon != self.answer['weapon'] or suspect != self.answer['killer'] or (room not in self.cards['room'][player_id])



class Rooms:

    def __init__(self):
        self.rooms = {}

    def register_new_room(self, room_id):
        if room_id not in self.rooms:
            self.rooms[room_id] = GameGrid()
            print(f'new room {room_id} is registered')

    def get_game(self, room_id) -> GameGrid:
        self.register_new_room(room_id)
        return self.rooms[room_id]
    
    def start_game_in_room(self, room_id):
        self.register_new_room(room_id)
        self.rooms[room_id].start_game()


room_obj = Rooms()

@app.route('/')
def index():
    return jsonify(message="Hello from Flask!")

@app.route('/signin', methods=['POST'])
def signin():
    data = request.get_json()

    # Check if username or email already exists
    existing_user = User.query.filter_by(username=data['username']).first()
    if existing_user:
        if existing_user.check_password(data['password']):
            return jsonify(message="User already exists. Logged in successfully."), 200
        else:
            return jsonify(message="Incorrect password."), 400

    user = User(username=data['username'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()

    return jsonify(message="User created successfully."), 201


connected_players = {}


@socketio.on('connect')
def handle_connect():
    player_id = request.sid
    room_obj = Rooms()
    connected_players[player_id] = {
        "player_id": player_id,
        "game_room": None  # Will store the game room ID when the player joins a game
    }

@socketio.on('join_game_room')
def join_game_room(data):
    room = data['room_id']
    player = data['username']
    game = room_obj.get_game(room)
    new_player = game.add_player(player)
    if(new_player == -1):
        socketio.emit('message', {'message': f"{player} has entered the room as a audience.",
                                  'player_id': player}), 
        socketio.emit('setup_info', {'game_status': game.game_status})
    else:
        socketio.emit('message', {'message': f"{player} has entered the room as a player.", 
                                  'game' : game.game_status, 
                                  'id' : new_player})


@socketio.on('send_chat_message')
def handle_chat_message(data):
    room = data['room_id']
    player = data['player_id']
    message = data['message']
    print(data)
    socketio.emit('message', {'message': message, 'player_id': player})

@socketio.on('leave_game_room')
def leave_game_room(data):
    room = data['room_id']
    player_id = data['player']
    leave_room(room)
    game = room_obj.get_game(room)
    game.terminate_player(int(player_id))
    socketio.emit('message', {'message': f"{player} has left the room."})

@socketio.on('send_message')
def handle_send_message(msg):
    print(f"Received {msg} event from React")
    socketio.emit('message_response', msg)

@socketio.on('get_cur_player')
def handle_get_cur_player(data):
    room_id = data['room_id']
    game = room_obj.get_game(room_id)
    print(game.current_player)
    return game.current_player

@socketio.on('start_game')
def handle_start_game(data):
    room_id = data['room_id']
    room_obj.start_game_in_room(room_id)
    game = room_obj.get_game(room_id)
    print('Game started!')
    socketio.emit('setup_info', {'game_status': game.game_status})

@socketio.on('update_grid')
def handle_update_grid(data):
    room_id = data['room_id']
    print('update grid with data ', data)
    player = int(data['player'])
    print(room_obj)
    x = data['x']
    y = data['y']
    game = room_obj.get_game(room_id)
    mv = game.move_player(player, x, y)
    send('move player {} by ({}, {}) is {}valid'.format(player, x, y, '' if mv else 'in'), broadcast=True)
    send(f'player at {game.players[player]}')
    socketio.emit('game_update', game.game_status)

@socketio.on('make_suggestion')
def handle_make_suggestion(data):
    room_id = data['room_id']
    player = data['player']
    suspect = data['suspect']
    room = data['room']
    weapon = data['weapon']

    message = f'Room{room_id}: Suggestion made by player {player} on suspect {suspect}, room {room} and weapon {weapon}'
    print(message)
    socketio.emit('message', {'message': message}) # todo: notification
    game = room_obj.get_game(room_id)
    outcome = game.suggest(int(player), int(suspect), int(room), int(weapon))
    if(outcome):
        socketio.emit('announce_winner', game.game_status) 
    else:
        if game.possible_to_disprove_by_others(int(player), int(suspect), int(room), int(weapon)):
            socketio.emit('message', {'message': 'Please start to disprove!'}) 
            socketio.emit('start_disprove', data)
        else:
            game.set_next_player()
            socketio.emit('game_update', game.game_status) # game status changed


@socketio.on('make_accusation')
def handle_make_accusation(data):
    room_id = data['room_id']
    player = data['player']
    suspect = data['suspect']
    room = data['room']
    weapon = data['weapon']

    message = f'Room{room_id}: Accusation made by player {player} on suspect {suspect}, room {room} and weapon {weapon}'
    print(message)
    socketio.emit('message', {'message': message}) # todo: notification
    game = room_obj.get_game(room_id)
    outcome = game.accuse(int(player), int(suspect), int(room), int(weapon))

    if(outcome):
        print(game.game_status)
        socketio.emit('announce_winner', game.game_status) # todo: announce winner
    else:
        if game.num_live_players == 1:
            socketio.emit('announce_winner', game.game_status)

        socketio.emit('message', {'message': 'Please start to disprove!'})
        socketio.emit('start_disprove', data)

@socketio.on('disprove')
def handle_disprove(data):
    print(f'disprove using: {data}')
    room_id = data['room_id']
    player_id = data['player']
    card_type, card_id = data['disprove_card']
    game = room_obj.get_game(room_id)
    game.disprove(int(player_id), card_type, int(card_id))
    socketio.emit('close_form', {})
    socketio.emit('message', {'message': f'player{player_id} disproved using {card_type} card # {card_id}'})
    socketio.emit('game_update', game.game_status) # game status changed

@socketio.on('rejoin_game_room')
def handle_rejoin_game_room(data):
    room_id = data['room_id']
    game = room_obj.get_game(room_id)

    socketio.emit('setup_info', {'game_status': game.game_status})

@socketio.on('game_over')
def handle_game_over(data):
    room_id = data['room_id']
    game = room_obj.get_game(room_id)
    game.terminate_game()
    socketio.emit('setup_info', {'game_status': game.game_status}) # game status changed


if __name__ == '__main__':
    app.debug = True 
    socketio.run(app, port=5000, debug=True)

