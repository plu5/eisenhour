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
  const [title, setTitle] = useState(props.title || '');
  const [description, setDescription] = useState(props.description || '');

  const [isEditing, setIsEditing] = useState(false);
  const [startTimeDisplayValue, setStartTimeDisplayValue] = useState(
    props.startTime ?
      props.startTime.toLocaleTimeString('en-GB').substring(0, 5) : '');
  const [endTimeDisplayValue, setEndTimeDisplayValue] = useState(
    props.endTime ?
      props.endTime.toLocaleTimeString('en-GB').substring(0, 5) : '');
  const [editValues, setEditValues] = useState({
    startTime: startTimeDisplayValue,
    endTime: endTimeDisplayValue,
    title: title,
    description: description});

  /**
   * Start timer, saving start time
   */
  function start() {
    const now = new Date();
    setStartTime(now);
    setStartTimeDisplayValue(now.toLocaleTimeString('en-GB').substring(0, 5));
    setEditValues({...editValues,
                   startTime: now.toLocaleTimeString('en-GB').substring(0, 5)});
    setIsRunning(true);
  }

  /**
   * Stop timer, saving end time
   */
  function stop() {
    const now = new Date();
    setEndTime(now);
    setEndTimeDisplayValue(now.toLocaleTimeString('en-GB').substring(0, 5));
    setEditValues({...editValues,
                   endTime: now.toLocaleTimeString('en-GB').substring(0, 5)});
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

  // Update data on server when the times, title, or description change
  useEffect(() => {
    fetch('timerUpdate', {
      method: 'post',
      body: JSON.stringify({...props, startTime, endTime, title, description}),
      headers: {'Content-Type': 'application/json'},
    })
      .then((res) => res.json())
      .then((json) => console.log(json));
  }, [props, startTime, endTime, title, description]);

  /**
   * onChange function for edit values to keep in sync with DOM
   * @param {event} event
   */
  function handleEditValuesChange(event) {
    setEditValues({...editValues, [event.target.name]: event.target.value});
  }

  /**
   * onSubmit function for updating startTime and endTime in accordance with
   *  startTimeEditValue and endTimeEditValue
   * @param {event} event
   */
  function handleSubmit(event) {
    event.preventDefault();

    const [startHours, startMinutes] = editValues.startTime.split(':');
    // Have to clone the Date object before mutating it, otherwise the
    //  useEffect hook won’t be called when we set the state
    const newStartTime = new Date(startTime.valueOf());
    newStartTime.setHours(startHours);
    newStartTime.setMinutes(startMinutes);
    setStartTime(newStartTime);

    const [endHours, endMinutes] = editValues.endTime.split(':');
    const newEndTime = new Date(endTime.valueOf());
    newEndTime.setHours(endHours);
    newEndTime.setMinutes(endMinutes);
    setEndTime(newEndTime);

    setStartTimeDisplayValue(editValues.startTime);
    setEndTimeDisplayValue(editValues.endTime);

    setElapsed(calculateElapsed(newStartTime, newEndTime));

    setTitle(editValues.title);
    setDescription(editValues.description);

    setIsEditing(false);
  }

  /**
   * When user cancels editing, revert to old values
   */
  function handleCancel() {
    setEditValues({...editValues, startTime: startTimeDisplayValue,
                   endTime: endTimeDisplayValue, title, description});
    setIsEditing(false);
  }

  return (
    <div className="timer">
      {/* title */}
      {isEditing ?
       <form onSubmit={handleSubmit}>
         <input name="title" value={editValues.title}
                onChange={handleEditValuesChange}
                style={{width: editValues.title.length + 'ch'}}/>
         <button type="submit" style={{display: 'none'}}/>
       </form> :
       <button className="timer-title"
               onClick={() => setIsEditing(true)}>
         {title}
       </button>
      }
      {/* elapsed & start/stop */}
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
        {/* startTime */}
        {isEditing ?
         <form onSubmit={handleSubmit} autoComplete="off">
           <input name="startTime" value={editValues.startTime}
                  onChange={handleEditValuesChange}
                  style={{width: editValues.startTime.length + 'ch'}}/>
           <button type="submit" style={{display: 'none'}}/>
         </form> :
         startTime &&
         <button onClick={() => setIsEditing(true)} className="start-time"
                 title={startTime.toLocaleString('en-GB')}>
           {startTimeDisplayValue}
         </button>
        }
        {/* separator */}
        {startTime ? <>-</> : <></>}
        {/* endTime */}
        {isEditing ?
         <form onSubmit={handleSubmit} autoComplete="off">
           <input name="endTime" value={editValues.endTime}
                  onChange={handleEditValuesChange}
                  style={{width: editValues.endTime.length + 'ch'}}/>
           <button type="submit" style={{display: 'none'}}/>
         </form> :
         endTime &&
         <button onClick={() => setIsEditing(true)} className="end-time"
                 title={endTime.toLocaleString('en-GB')}>
           {endTimeDisplayValue}
         </button>
        }
        {/* edit confirm and cancel buttons */}
        {isEditing ?
         <>
           <button onClick={handleSubmit}>v</button>
           <button onClick={handleCancel}>x</button>
         </> : <></>}
      </div>
      <br/>
      {/* description */}
      {isEditing ?
       <form onSubmit={handleSubmit}>
         <input name="description" value={editValues.description}
                onChange={handleEditValuesChange}
                style={{width: editValues.title.length + 'ch'}}/>
         <button type="submit" style={{display: 'none'}}/>
       </form> :
       <button className="timer-description"
               onClick={() => setIsEditing(true)}>
         {description}
       </button>
      }
    </div>
  );
}

export default Timer;
