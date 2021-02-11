import React, {useState, useEffect, useRef, useCallback} from 'react';
import DatePicker from 'react-datepicker';
import {createPortal} from 'react-dom';

import './react-datepicker.css';

/**
 * DaySelector
 * @param {Object} props
 * @return {jsx}
 */
function DaySelector(props) {
  const [today,] = useState(new Date());
  const [date, setDate] = useState(props.date);
  const update = useRef(props.update);

  // to help avoid running the update hook unnecessarily
  const firstRenderRef = useRef(true);
  const isFirstRender = useCallback(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return true;
    }
  }, [firstRenderRef]);

  useEffect(() => {
    if (isFirstRender()) return;
    console.log('updating you');
    update.current(date);
  }, [update, date, isFirstRender]);

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
                  showWeekNumbers
                  maxDate={today}
                  popperContainer={
                    ({children}) => createPortal(children,document.body)}
                  todayButton="→ today"/>
      {today.toDateString() === date.toDateString() ?
       <></> :
       <button onClick={() => addDays(1)}>&gt;</button>
      }
    </div>
  );
}

export default DaySelector;
