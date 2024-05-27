'use client'
import { useState, useEffect } from 'react';
import ChatRoom from '../components/ChatRoom';
import GameBoard from '../components/GameBoard';
import styles from '../components/styles.module.css';

const Header = () => {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>GAME OF CLUE</h1>
      <p className={styles.byline}>BY CLUEFUL CODERS</p>
    </div>
  );
};


export default function HomePage() {
  const [likes, setLikes] = useState(0);

  function handleClick() {
    setLikes(likes + 1);
  }

  return (
    <div className="centered-image-container">
      <Header/>
      <GameBoard/>
      <ChatRoom />    
    </div>
  );
}


