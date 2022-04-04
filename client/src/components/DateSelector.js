import React, {useState, useEffect, useRef, useCallback} from 'react';
import DatePicker from 'react-datepicker';
import {createPortal} from 'react-dom';

import './react-datepicker.css';

/**
 * DateSelector
 * @param {Object} props
 * @param {Date} props.date date to set the selector to.
 * @param {Function} props.update callback to call when the date changes.
 * @param {String} props.type 'year', 'day', or 'time'. defaults to 'day'.
 * @return {jsx}
 */
function DateSelector(props) {
  const [today,] = useState(new Date()); // eslint-disable-line
  const [date, setDate] = useState(props.date);
  const update = useRef(props.update);
  const onSubmit = props.onSubmit || false;

  let className = 'day-selector';
  let dateFormat = 'yyyy-MM-dd';
  let addFunc = addDays;
  let todayButtonLabel = '→ today';
  let extraAttrs = {};

  if (props.type === 'year') {
    className = 'year-selector';
    dateFormat = 'yyyy';
    addFunc = addYears;
    todayButtonLabel = '→ this year';
    extraAttrs = {showYearPicker: true, yearItemNumber: 6};
  } else if (props.type === 'time') {
    className = 'time-selector';
    dateFormat = 'HH:mm';
    addFunc = null;
    extraAttrs = {showTimeSelect: true, timeIntervals: 30, timeFormat: 'HH:mm'};
  }

  // to help avoid running the update hook unnecessarily
  const firstRenderRef = useRef(true);
  const isFirstRender = useCallback(() => {
    console.log('DateSelector: isFirstRender useCallback');
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return true;
    }
  }, [firstRenderRef]);

  useEffect(() => {
    console.log('DateSelector: useEffect called');
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
    console.log('DateSelector: selector useEffect called');
    if (selectorRef.current) {
      const selectorDiv = selectorRef.current;
      selectorDiv.addEventListener('wheel', scroll, {passive: false});
      return () => {
        selectorDiv.removeEventListener('wheel', scroll, {passive: false});
      };
    }
  });

  /**
   * Submit on enter
   * @param {Object} event
   */
  function handleSubmitKey(event) {
    if (event.keyCode === 13 && event.shiftKey === false) {
      event.preventDefault();
      if (onSubmit) onSubmit(event);
    }
  }

  return (
    <div className={className} ref={selectorRef}>
      {addFunc ? <button onClick={() => addFunc(-1)}>&lt;</button> : <></>}
      <DatePicker dateFormat={dateFormat}
                  selected={date}
                  onChange={(date) => setDate(date)}
                  onKeyDown={handleSubmitKey}
                  showWeekNumbers
                  maxDate={today}
                  popperContainer={
                    ({children}) => createPortal(children, document.body)}
                  todayButton={todayButtonLabel}
                  {...extraAttrs}/>
      {addFunc ?
       <button onClick={() => addFunc(1)}
               disabled={today.toDateString() === date.toDateString() ?
                         true : false}>
         &gt;
       </button> : <></>}
    </div>
  );
}

export default DateSelector;
