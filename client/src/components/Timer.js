import React, {useState, useEffect} from 'react';

/**
 * Timer react component
 * @param {Object} props
 * @return {jsx}
 */
function Timer(props) {
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [elapsed, setElapsed] = useState('0:00:00');
  const [isEditing, setIsEditing] = useState(false);
  const [startTimeEditValue, setStartTimeEditValue] = useState('');
  const [endTimeEditValue, setEndTimeEditValue] = useState('');

  /**
   * Start timer, saving start time
   */
  function start() {
    const now = new Date();
    setStartTime(now);
    setStartTimeEditValue(now.toLocaleTimeString('en-GB').substring(0, 5));
    setIsActive(true);
  }

  /**
   * Stop timer, saving end time
   */
  function stop() {
    const now = new Date();
    setEndTime(now);
    setEndTimeEditValue(now.toLocaleTimeString('en-GB').substring(0, 5));
    setIsActive(false);
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
    if (isActive) {
      tickFunctionId = setInterval(() => {
        setElapsed(calculateElapsed(startTime, new Date()));
      }, 1000);
    } else if (!isActive && elapsed !== '0:00:00') {
      clearInterval(tickFunctionId);
    }
    return () => clearInterval(tickFunctionId);
  }, [isActive, startTime, elapsed]);

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
    startTime.setHours(startHours);
    startTime.setMinutes(startMinutes);
    setStartTime(startTime);

    const [endHours, endMinutes] = endTimeEditValue.split(':');
    endTime.setHours(endHours);
    endTime.setMinutes(endMinutes);
    setEndTime(endTime);

    setElapsed(calculateElapsed(startTime, endTime));
    setIsEditing(false);
  }

  return (
    <div className="timer">
      {props.title}
      {elapsed}
      {isActive ?
       <button onClick={stop}>
         ⏹ stop
       </button> :
       <button onClick={start}>
         ▶ start
       </button>
      }
      {isEditing ?
       <form onSubmit={handleSubmit} autoComplete="off">
         <input value={startTimeEditValue}
                onChange={handleStartTimeEditChange}
                style={{width: startTimeEditValue.length + 'ch'}}/>
         <button type="submit" style={{display: 'none'}}/>
       </form> :
       startTime &&
       <button onClick={() => setIsEditing(true)}>
         {startTimeEditValue}
       </button>
      }
      -
      {isEditing ?
       <form onSubmit={handleSubmit} autoComplete="off">
         <input value={endTimeEditValue}
                onChange={handleEndTimeEditChange}
                style={{width: endTimeEditValue.length + 'ch'}}/>
         <button type="submit" style={{display: 'none'}}/>
       </form> :
       endTime &&
       <button onClick={() => setIsEditing(true)}>
         {endTimeEditValue}
       </button>
      }
      {props.description}
    </div>
  );
}

export default Timer;
