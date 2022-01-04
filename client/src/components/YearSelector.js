import React, {useState, useEffect, useRef, useCallback} from 'react';
import DatePicker from 'react-datepicker';
import {createPortal} from 'react-dom';

import './react-datepicker.css';

/**
 * YearSelector
 * @param {Object} props
 * @return {jsx}
 */
function YearSelector(props) {
  const [today,] = useState(new Date()); // eslint-disable-line
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
   * Add num years to date.
   * @param {Integer} num years to add. Pass in a negative value to subtract.
   */
  function addYears(num) {
    const newDate = new Date(date.valueOf());
    newDate.setFullYear(date.getFullYear() + num);
    setDate(newDate);
  }

  return (
    <div className="year-selector">
      <button onClick={() => addYears(-1)}>&lt;</button>
      <DatePicker selected={date}
                  onChange={(date) => setDate(date)}
                  maxDate={today}
                  showYearPicker
                  dateFormat="yyyy"
                  yearItemNumber={9}
                  popperContainer={
                    ({children}) => createPortal(children, document.body)}
                  todayButton="→ this year"/>
      <button onClick={() => addYears(1)}
              disabled={today.toDateString() === date.toDateString() ?
                        true : false}>
        &gt;
      </button>
    </div>
  );
}

export default YearSelector;
