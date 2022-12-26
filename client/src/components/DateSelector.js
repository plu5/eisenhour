import React, {useState, useEffect, useRef, useCallback} from 'react';
import DatePicker from 'react-datepicker';
import {createPortal} from 'react-dom';

import './react-datepicker.css';

/**
 * DateSelector
 * @param {Object} props
 * @param {Date} props.date date to set the selector to.
 * @param {String} props.name name to pass through when calling props.onChange.
 *   This is useful if you have several DateSelectors that use the same
 *   onChange function, which can then be handled similarly to how it is done
 *   with onChange events for HTML elements in forms.
 * @param {Function} props.onChange callback to call when the date changes.
 *   Gets passed object similar to an event: {target: {name, value}} where name
 *   is props.name and value is the new date.
 * @param {String} props.type 'year', 'month', 'day', 'daterange-start',
 *   'daterange-end', or 'time'. defaults to 'day'.
 * @param {Date} props.startDate required with type 'daterange-end'. Represents 
 *  the start of the range.
 * @param {Date} props.endDate required with type 'daterange-start'. Represents
 *  the end of the range.
 * @return {jsx}
 */
function DateSelector(props) {
  const [date, setDate] = useState(props.date);
  const [maxDate, setMaxDate] = useState(new Date());
  const name = props.name;
  const onChange = useRef(props.onChange);
  const onSubmit = props.onSubmit || false;

  let className = 'day-selector';
  let dateFormat = 'yyyy-MM-dd';
  let addFunc = addDays;
  let todayButtonLabel = '→ today';
  let extraAttrs = {};
  let minDate = null;

  if (props.type === 'year') {
    className = 'year-selector';
    dateFormat = 'yyyy';
    addFunc = addYears;
    todayButtonLabel = '→ this year';
    extraAttrs = {showYearPicker: true, yearItemNumber: 6};
  } else if (props.type === 'month') {
    className = 'month-selector';
    dateFormat = 'MM-yyyy';
    addFunc = addMonths;
    todayButtonLabel = '→ this month';
    extraAttrs = {showMonthYearPicker: true};
  } else if (props.type === 'time') {
    className = 'time-selector';
    dateFormat = 'HH:mm';
    addFunc = null;
    extraAttrs = {showTimeSelect: true, timeIntervals: 30, timeFormat: 'HH:mm'};
  } else if (props.type === 'daterange-start') {
    extraAttrs = {selectsStart: true, startDate: date, endDate: props.endDate};
  } else if (props.type === 'daterange-end') {
    minDate = props.startDate;
    extraAttrs = {selectsEnd: true, startDate: props.startDate, endDate: date,
                  minDate: minDate};
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

  // Notify parent when date changes
  useEffect(() => {
    console.log('DateSelector: useEffect called');
    if (isFirstRender()) return;
    onChange.current({target: {name, value: date}});
  }, [onChange, name, date, isFirstRender]);

  // Update date when props.date changes
  useEffect(() => {
    console.log('DateSelector: props.date useEffect called');
    setMaxDate(new Date());
    setDate(props.date);
  }, [props.date]);

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
  /**
   * Add num months to date.
   * @param {Integer} num months to add. Pass in a negative value to subtract.
   */
  function addMonths(num) {
    const newDate = new Date(date.valueOf());
    newDate.setMonth(date.getMonth() + num);
    setDate(newDate);
    handleChange(newDate);
  }

  /**
   * Scroll through days/years when scrolling the mousewheel
   * @param {Object} event
   */
  const scroll = useCallback((event) => {
    if (!addFunc) return;
    event.preventDefault();
    if (event.deltaY > 0) {
      if (maxDate && maxDate.toDateString() === date.toDateString()) return;
      addFunc(1);
    } else {
      if (minDate && minDate.toDateString() === date.toDateString()) return;
      addFunc(-1);
    }
  }, [addFunc, date, maxDate]);

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
  }, [selectorRef, scroll]);

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
      {addFunc ?
       <button onClick={() => addFunc(-1)}
               disabled={minDate &&
                         minDate.toDateString() === date.toDateString() ?
                         true : false}>
       &lt;</button> : <></>}
      <DatePicker dateFormat={dateFormat}
                  selected={date}
                  onChange={(date) => setDate(date)}
                  onKeyDown={handleSubmitKey}
                  showWeekNumbers
                  maxDate={maxDate}
                  popperContainer={
                    ({children}) => createPortal(children, document.body)}
                  todayButton={todayButtonLabel}
                  {...extraAttrs}/>
      {addFunc ?
       <button onClick={() => addFunc(1)}
               disabled={maxDate &&
                         maxDate.toDateString() === date.toDateString() ?
                         true : false}>
         &gt;
       </button> : <></>}
    </div>
  );
}

export default DateSelector;
