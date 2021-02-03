import React, {useState, useEffect, useRef} from 'react';
import DatePicker from 'react-datepicker';
import {createPortal} from 'react-dom';

import './react-datepicker.css';

/**
 * DaySelector
 * @param {Object} props
 * @return {jsx}
 */
function DaySelector(props) {
  const [date, setDate] = useState(new Date());
  const update = useRef(props.update);

  useEffect(() => {
    console.log('updating');
    update.current(date);
  }, [update, date]);

  /**
   * Add num days to date.
   * @param {Integer} num days to add. Pass in a negative value to subtract.
   */
  function addDays(num) {
    const newDate = new Date(date.valueOf()); 
    newDate.setDate(date.getDate() + num);
    setDate(newDate);
  }

  return (
    <div className="day-selector">
      <button onClick={() => addDays(-1)}>&lt;</button>
      <DatePicker dateFormat="yyyy-MM-dd" selected={date}
                  onChange={(date) => setDate(date)}
                  popperContainer={
                    ({children}) => createPortal(children,document.body)}
                  todayButton="→ today"/>
      <button onClick={() => addDays(1)}>&gt;</button>
    </div>
  );
}

export default DaySelector;
