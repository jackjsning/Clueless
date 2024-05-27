import styles from './styles.module.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import React from 'react';
import ReactCanvasConfetti from 'react-canvas-confetti';
import { GetData } from './storage_util';

export const roomNameMap = {
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

export const colors = ['purple', 'pink', 'green', 'blue', 'orange', 'red'];
export const characters = ['Prof.Plum', 'Mrs.Peacock', 'Mr.Green', 'Mrs.White', 'Col.Mustard', 'MissScarlet'];
export const weapons = ['Rope', 'Lead Pipe', 'Knife', 'Wrench', 'Candlestick', 'Revolver'];
export const rooms = ["Study", "Hall", "Lounge", "Library", "Billiard Room", "Dining Room", 
                      "Conservatory", "Ballroom", "Kitchen"];

export const Block = ({blockType, coord, isPlayerHere, child}) => {
  let className = '';

  switch (blockType) {
    case "room":
      className = styles.room;
      break;
    case "hallwayV":
      className = styles.vhallway;
      break;
    case "hallwayH":
      className = styles.hhallway;
      break;
    case "empty":
      className = styles.empty;
      break;
    default:
      break;
  }

  if(blockType == 'room')
  {
    const name = roomNameMap[coord];
    if(isPlayerHere){
      return (<div className={styles.room}>{name}{child}</div>)
    } else {
      return(<div className={styles.room}>{name}</div>);
    };
  };

  if (isPlayerHere) {
    return <div className={className}>{child}</div>;
  } else {
    return <div className={className}>{child}</div>;
  };

};

export const Player = ({name, bgcolor}) => {
  if (bgcolor==null)
    return(<div className={styles.player }style={{'fontSize': '10px'}}>{name}</div>)
  else
    return(<div className={styles.player } style={{'backgroundColor': bgcolor, 'fontSize': '10px'}}>{name}</div>);
};

export const CardComponent = ({all_cards}) => {
  if(!all_cards) return(<div></div>);

  const cardsPerRow = 10;

  return(    
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
    {all_cards.map((card, index) => (
      <div className={styles.card} key={index} style={{ width: `${100 / cardsPerRow}%` }}>
        {card}
      </div>
    ))}
  </div>
  )
};


export function Confetti({onClose}) {
  const refAnimationInstance = useRef(null);

  const getInstance = useCallback(instance => {
    refAnimationInstance.current = instance;
  }, []);

  const makeShot = useCallback((particleRatio, opts) => {
    refAnimationInstance.current &&
      refAnimationInstance.current({
        ...opts,
        origin: { y: 0.7 },
        particleCount: Math.floor(200 * particleRatio)
      });
  }, []);

  useEffect(() => fire(), []);

  const fire = useCallback(() => {
    makeShot(0.25, {
      spread: 26,
      startVelocity: 55
    });

    makeShot(0.2, {
      spread: 60
    });

    makeShot(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });

    makeShot(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });

    makeShot(0.1, {
      spread: 120,
      startVelocity: 45
    });
  }, [makeShot]);

  return (<div>
    <button onClick={onClose} className={styles.close_button}>Close</button>
    <ReactCanvasConfetti
      refConfetti={getInstance}
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0
      }}
    />
    <div className={styles.winner_scene}> {characters[GetData("winner")]} WON, CONGRATS!</div>
    </div>
  );
}