import React, {useState, useEffect} from 'react';

/**
 * Timer react component
 * @param {Object} props
 * @return {jsx}
 */
function Timer(props) {
  const [isRunning, setIsRunning] = useState(
    props.startTime && !props.endTime ? true : false);
  const [startTime, setStartTime] = useState(props.startTime || null);
  const [endTime, setEndTime] = useState(props.endTime || null);
  const [elapsed, setElapsed] = useState(
    props.endTime ?
      calculateElapsed(props.startTime, props.endTime) :
      '0:00:00');

  const [isEditing, setIsEditing] = useState(false);
  const [startTimeDisplayValue, setStartTimeDisplayValue] = useState(
    props.startTime ?
      props.startTime.toLocaleTimeString('en-GB').substring(0, 5) : '');
  const [endTimeDisplayValue, setEndTimeDisplayValue] = useState(
    props.endTime ?
      props.endTime.toLocaleTimeString('en-GB').substring(0, 5) : '');
  const [startTimeEditValue, setStartTimeEditValue] =
        useState(startTimeDisplayValue);
  const [endTimeEditValue, setEndTimeEditValue] =
        useState(endTimeDisplayValue);

  /**
   * Start timer, saving start time
   */
  function start() {
    const now = new Date();
    setStartTime(now);
    setStartTimeDisplayValue(now.toLocaleTimeString('en-GB').substring(0, 5));
    setStartTimeEditValue(now.toLocaleTimeString('en-GB').substring(0, 5));
    setIsRunning(true);
  }

  /**
   * Stop timer, saving end time
   */
  function stop() {
    const now = new Date();
    setEndTime(now);
    setEndTimeDisplayValue(now.toLocaleTimeString('en-GB').substring(0, 5));
    setEndTimeEditValue(now.toLocaleTimeString('en-GB').substring(0, 5));
    setIsRunning(false);
  }

  /**
   * Calculate elapsed time between startTime and endTime and return as a string
   *  in the format H:MM:SS
   * @param {Date} startTime
   * @param {Date} endTime
   * @return {String} elapsed time
   */
  function calculateElapsed(startTime, endTime) {
    let ms = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(ms / (60**2 * 1000));
    ms -= hours * (60**2 * 1000);
    let minutes = Math.floor(ms / (60 * 1000));
    ms -= minutes * (60 * 1000);
    let seconds = Math.floor(ms / 1000);
    if (minutes < 10) minutes = '0' + minutes;
    if (seconds < 10) seconds = '0' + seconds;

    return hours + ':' + minutes + ':' + seconds;
  }

  useEffect(() => {
    let tickFunctionId = null;
    if (isRunning) {
      tickFunctionId = setInterval(() => {
        setElapsed(calculateElapsed(startTime, new Date()));
      }, 1000);
    } else if (!isRunning && elapsed !== '0:00:00') {
      clearInterval(tickFunctionId);
    }
    return () => clearInterval(tickFunctionId);
  }, [isRunning, startTime, elapsed]);

  useEffect(() => {
    fetch('timerUpdate', {
      method: 'post',
      body: JSON.stringify({...props, startTime, endTime}),
      headers: {'Content-Type': 'application/json'},
    })
      .then((res) => res.json())
      .then((json) => console.log(json));
  }, [props, startTime, endTime]);

  /**
   * onChange function for startTimeEditValue to keep in sync with DOM
   * @param {event} event
   */
  function handleStartTimeEditChange(event) {
    setStartTimeEditValue(event.target.value);
  }

  /**
   * onChange function for endTimeEditValue to keep in sync with DOM
   * @param {event} event
   */
  function handleEndTimeEditChange(event) {
    setEndTimeEditValue(event.target.value);
  }

  /**
   * onSubmit function for updating startTime and endTime in accordance with
   *  startTimeEditValue and endTimeEditValue
   * @param {event} event
   */
  function handleSubmit(event) {
    event.preventDefault();

    const [startHours, startMinutes] = startTimeEditValue.split(':');
    // Have to clone the Date object before mutating it, otherwise the
    //  useEffect hook won’t be called when we set the state
    const newStartTime = new Date(startTime.valueOf());
    newStartTime.setHours(startHours);
    newStartTime.setMinutes(startMinutes);
    setStartTime(newStartTime);

    const [endHours, endMinutes] = endTimeEditValue.split(':');
    const newEndTime = new Date(endTime.valueOf());
    newEndTime.setHours(endHours);
    newEndTime.setMinutes(endMinutes);
    setEndTime(newEndTime);

    setStartTimeDisplayValue(startTimeEditValue);
    setEndTimeDisplayValue(endTimeEditValue);

    setElapsed(calculateElapsed(startTime, endTime));
    setIsEditing(false);
  }

  /**
   * When user cancels editing
   */
  function handleCancel() {
    setStartTimeEditValue(startTimeDisplayValue);
    setEndTimeEditValue(endTimeDisplayValue);
    setIsEditing(false);
  }

  return (
    <div className="timer">
      <button className="timer-title">{props.title}</button>
      <div className="time-section">
        <span className={'timer-elapsed' +
                         (isRunning ? ' running' : '')}>
          {elapsed}
        </span>
        {isRunning ?
         <button onClick={stop}>
           ⏹ stop
         </button> :
         <button onClick={start}>
           ▶ start
         </button>
        }
        <br/>
        {isEditing ?
         <form onSubmit={handleSubmit} autoComplete="off">
           <input value={startTimeEditValue}
                  onChange={handleStartTimeEditChange}
                  style={{width: startTimeEditValue.length + 'ch'}}/>
           <button type="submit" style={{display: 'none'}}/>
         </form> :
         startTime &&
         <button onClick={() => setIsEditing(true)} className="start-time"
                 title={startTime.toLocaleString('en-GB')}>
           {startTimeDisplayValue}
         </button>
        }
        {startTime ? <>-</> : <></>}
        {isEditing ?
         <form onSubmit={handleSubmit} autoComplete="off">
           <input value={endTimeEditValue}
                  onChange={handleEndTimeEditChange}
                  style={{width: endTimeEditValue.length + 'ch'}}/>
           <button type="submit" style={{display: 'none'}}/>
         </form> :
         endTime &&
         <button onClick={() => setIsEditing(true)} className="end-time"
                 title={endTime.toLocaleString('en-GB')}>
           {endTimeDisplayValue}
         </button>
        }
        {isEditing ?
         <>
           <button onClick={handleSubmit}>v</button>
           <button onClick={handleCancel}>x</button>
         </> : <></>}
      </div>
      <br/>
      <button className="timer-description">{props.description}</button>
    </div>
  );
}

export default Timer;
