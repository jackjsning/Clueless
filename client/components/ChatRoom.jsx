import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { io } from 'socket.io-client';
import styled from 'styled-components';
import styles from '../components/styles.module.css';
function GameComponent() {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isMinimized, setIsMinimized] = useState(true);

    useEffect(() => {
        const newSocket = io('http://127.0.0.1:5000');
        
        newSocket.on('reconnect', () => {
            // Emit an event to join the room again and get the current state
            newSocket.emit('rejoin_game_room', { room_id: room_id, player_id: sessionStorage.getItem('username') });
          });
        newSocket.on('message', (data) => {  
            let message = '';
            if (data.id != null && data.game != null && data.message.includes('has entered the room')){
                sessionStorage.setItem('player_id', data.id);
                console.log('player_id', sessionStorage.getItem('player_id'));
                
                if(data.game.live)
                    {sessionStorage.setItem('gameStatus', "Live")}
                else
                    {sessionStorage.setItem('gameStatus', "Not Live")};
                    {sessionStorage.setItem('notification', "Waiting for more players to join")}

                message = data.message;
                setMessages((prevMessages) => [...prevMessages, message]);
            }
            else if (data.message != null){
                if(data.player_id != null){
                    message = `${data.player_id}: ${data.message}`
                }else{
                    message = data.message
                };
                
                setMessages((prevMessages) => [...prevMessages, message]);
            }
            else{
                console.log('New message:', message);
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('Connection Error:', error);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const handleSendMessage = () => {
        if (socket) {
            socket.emit('send_chat_message', 
            { message: inputValue, 
              room_id: sessionStorage.getItem('room_id'), 
              player_id: sessionStorage.getItem('username')});

            setInputValue('');  
        }
    };

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
      };

    return (
        <div>
         <div style={{display: 'flex', flexDirection: 'column', width : '500px',
                         left: '85%', position: 'fixed', bottom: 20,
                        right: 0}}>
         <div className={`${styles.messageBox} ${isMinimized ? styles.minimized : ''}`}>
            {messages.map((msg, index) => (
                <p key={index}>{msg}</p>
            ))}
        </div>
        <div className={styles.chatInput}>
            <input className={styles.inputField}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Chat with the room..."
                
            />
            <button className={styles.chat_button} onClick={handleSendMessage}>Send</button> 
            <button className={styles.minimizeButton} onClick={toggleMinimize}>{isMinimized ? '+' : '-'}</button>
        </div>
        </div>
    </div>
        );

      };


export default GameComponent;