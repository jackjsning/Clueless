import styles from '../components/styles.module.css';
import { characters, rooms, weapons } from './BoardComponents';
import { useState, useEffect } from 'react';
import { GetData, CardArray, GetShownCards } from './storage_util';

const SelectButtonsComponent = ({options, onSubmit}) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const handleConfirm = () => {
    onSubmit(selectedOption)
  };

  const optionsPerRow = 8;
  return(    
    <div className={styles.quiz_container}>
      <h6>Select any one card from below to disprove:</h6>
      <div className={styles.options_container}>
        {options.map((option) => (
          <label key={option} className={styles.option_label}>
            <input
              type="radio"
              value={option}
              checked={selectedOption === option}
              onChange={handleOptionChange}
            />
            {option}
          </label>
        ))}
      </div>
      <button onClick={handleConfirm} disabled={!selectedOption} className={styles.button}>
        Confirm
      </button>
    </div>
  )
};


const RadioInput = ({ name, value, checked, onChange }) => (
  <label>
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
    />
    {value}
  </label>
);

export default function PopupDisproveForm({ onClose, onSubmit, option_list }){
  return (
    <div className={styles.popup_overlay}>
          <div className={styles.popup_container}>
            <button onClick={onClose} className={styles.close_button}>
              Close
            </button>
            <form onSubmit={onSubmit}>
            <SelectButtonsComponent options={option_list} onSubmit={onSubmit}/>
            </form>
          </div>
    </div>
  );
};

export function PopupForm({ onClose, onSubmit, action_type }){
  const players = JSON.parse(GetData('players'));
  const mycards = CardArray();
  const shown_cards = GetShownCards();

  const categories = [
    { name: 'Weapons', options: weapons.filter(value => (!mycards.includes(value)) && !shown_cards.includes(value)) },
    { name: 'Suspects', options: characters.slice(0, players.length).filter(value => (!mycards.includes(value) && !shown_cards.includes(value))) },
  ];

  if(action_type == "accuse") 
  {
    categories.push( { name: 'Rooms', options: rooms.filter(value => (!mycards.includes(value) && !shown_cards.includes(value))) });
  };

  const [selectedOptions, setSelectedOptions] = useState(
    Object.fromEntries(categories.map(category => [category.name, '']))
  );

  const handleOptionChange = (categoryName, optionValue) => {
    setSelectedOptions({
      ...selectedOptions,
      [categoryName]: optionValue,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(selectedOptions);
  };

  return (    
  <div className={styles.popup_overlay}>
    <div className={styles.popup_container}>
      <button onClick={onClose} className={styles.close_button}>
        Close
      </button>
      <form onSubmit={handleSubmit}>
      {categories.map((category) => (
        <div key={category.name}>
        <h6>{category.name}</h6>
          {category.options.map((option) => (
            <RadioInput
              key={option}
              name={category.name}
              value={option}
              checked={selectedOptions[category.name] === option}
              onChange={() => handleOptionChange(category.name, option)}
            />
          ))}
        </div>
      ))}
      <button type="submit" className={styles.button}>Submit</button>
    </form>
      </div>
    </div>
  );
};
