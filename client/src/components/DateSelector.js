import React, {useState, useEffect, useRef, useCallback} from 'react';
import DatePicker from 'react-datepicker';
import {createPortal} from 'react-dom';

import './react-datepicker.css';

/**
 * DateSelector
 * @param {Object} props
 * @return {jsx}
 */
function DateSelector(props) {
  const [today,] = useState(new Date()); // eslint-disable-line
  const [date, setDate] = useState(props.date);
  const update = useRef(props.update);

  const className = props.yearOnly ? 'year-selector' : 'day-selector';
  const dateFormat = props.yearOnly ? 'yyyy' : 'yyyy-MM-dd';
  const addFunc = props.yearOnly ? addYears : addDays;
  const todayButtonLabel = props.yearOnly ? '→ this year' : '→ today';
  const extraAttrs = props.yearOnly ? {showYearPicker: true,
                                       yearItemNumber: 6} : {};

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

  /**
   * Add num years to date.
   * @param {Integer} num years to add. Pass in a negative value to subtract.
   */
  function addYears(num) {
    const newDate = new Date(date.valueOf());
    newDate.setFullYear(date.getFullYear() + num);
    setDate(newDate);
  }

  /**
   * Scroll through days/years when scrolling the mousewheel
   * @param {Object} event
   */
  function scroll(event) {
    event.preventDefault();
    if (event.deltaY > 0) {
      if (today.toDateString() === date.toDateString()) return;
      addFunc(1);
    } else {
      addFunc(-1);
    }
  }

  // Workaround; attaching our onWheel function manually allows preventDefault
  //  to work (prevent page scroll), where otherwise it would not
  const selectorRef = useRef(null);
  useEffect(() => {
    if (selectorRef.current) {
      const selectorDiv = selectorRef.current;
      selectorDiv.addEventListener('wheel', scroll, {passive: false});
      return () => {
        selectorDiv.removeEventListener('wheel', scroll, {passive: false});
      };
    }
  });

  return (
    <div className={className} ref={selectorRef}>
      <button onClick={() => addFunc(-1)}>&lt;</button>
      <DatePicker dateFormat={dateFormat}
                  selected={date}
                  onChange={(date) => setDate(date)}
                  showWeekNumbers
                  maxDate={today}
                  popperContainer={
                    ({children}) => createPortal(children, document.body)}
                  todayButton={todayButtonLabel}
                  {...extraAttrs}/>
      <button onClick={() => addFunc(1)}
              disabled={today.toDateString() === date.toDateString() ?
                        true : false}>
        &gt;
      </button>
    </div>
  );
}

export default DateSelector;
