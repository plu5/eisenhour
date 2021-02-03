import React, {useState, useEffect, useRef, useCallback} from 'react';

import SubmittableInput from './SubmittableInput';

/**
 * Timer react component
 * @param {Object} props
 * @return {jsx}
 */
function Timer(props) {
  const [isRunning, setIsRunning] = useState(
    props.startTime && !props.endTime ? true : false);
  const [elapsed, setElapsed] = useState(
    props.endTime ?
      calculateElapsed(props.startTime, props.endTime) :
      '0:00:00');

  const [data, setData] = useState({
    id: props.id,
    startTime: props.startTime || null,
    endTime: props.endTime || null,
    title: props.title || '',
    description: props.description || ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [displayTimes, setDisplayTimes] = useState({
    start: props.startTime ?
      getDisplayTime(props.startTime) : '',
    end: props.endTime ?
      getDisplayTime(props.endTime) : ''
  });
  const [editValues, setEditValues] = useState({
    startTime: displayTimes.start,
    endTime: displayTimes.end,
    title: data.title,
    description: data.description
  });

  // to help avoid running the update hook unnecessarily
  const firstRenderRef = useRef(true);
  const isFirstRender = useCallback(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return true;
    }
  }, [firstRenderRef]);

  /**
   * Start timer, saving start time
   */
  function start() {
    const now = new Date();
    setData({...data, startTime: now});
    setDisplayTimes({...displayTimes, start: getDisplayTime(now)});
    setEditValues({...editValues, startTime: getDisplayTime(now)});
    setIsRunning(true);
  }

  /**
   * Stop timer, saving end time
   */
  function stop() {
    const now = new Date();
    setData({...data, endTime: now});
    setDisplayTimes({...displayTimes, end: getDisplayTime(now)});
    setEditValues({...editValues, endTime: getDisplayTime(now)});
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

  /**
   * Get display time (HH:MM) from date
   * @param {Date} date
   * @return {String}
   */
  function getDisplayTime(date) {
    return date.toLocaleTimeString('en-GB').substring(0, 5);
  }

  // Tick elapsed every second while running
  useEffect(() => {
    let tickFunctionId = null;
    if (isRunning) {
      tickFunctionId = setInterval(() => {
        setElapsed(calculateElapsed(data.startTime, new Date()));
      }, 1000);
    } else if (!isRunning && elapsed !== '0:00:00') {
      clearInterval(tickFunctionId);
    }
    return () => clearInterval(tickFunctionId);
  }, [isRunning, data.startTime, elapsed]);

  // Update server when (and only when) the times, title, or description change
  useEffect(() => {
    if (isFirstRender()) return;
    fetch('timerUpdate', {
      method: 'post',
      body: JSON.stringify(data),
      headers: {'Content-Type': 'application/json'},
    })
      .then((res) => res.json())
      .then((json) => console.log(json));
  }, [data, isFirstRender]);

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

    const newData = {};
    const newDisplayTimes = {};

    const [startHours, startMinutes] = editValues.startTime.split(':');
    // Clone the Date object before mutating it
    const newStartTime = new Date(data.startTime.valueOf());
    newStartTime.setHours(startHours);
    newStartTime.setMinutes(startMinutes);
    newData.startTime = newStartTime;
    newDisplayTimes.start = editValues.startTime;

    if (data.endTime) {
      const [endHours, endMinutes] = editValues.endTime.split(':');
      const newEndTime = new Date(data.endTime.valueOf());
      newEndTime.setHours(endHours);
      newEndTime.setMinutes(endMinutes);
      newData.endTime = newEndTime;
      newDisplayTimes.end = editValues.endTime;

      setElapsed(calculateElapsed(newStartTime, newEndTime));
    } else {
      setElapsed(calculateElapsed(newStartTime, new Date()));
    }

    newData.title = editValues.title;
    newData.description = editValues.description;

    setData({...data, ...newData});
    setDisplayTimes({...displayTimes, ...newDisplayTimes});

    setIsEditing(false);
  }

  /**
   * When user cancels editing, revert to old values
   */
  function handleCancel() {
    setEditValues({...editValues, startTime: displayTimes.start,
                   endTime: displayTimes.end, title: data.title,
                   description: data.description});
    setIsEditing(false);
  }

  return (
    <div className="timer">
      {/* title */}
      {isEditing ?
       <SubmittableInput name="title" value={editValues.title}
                         style={{width: editValues.title.length + 'ch'}}
                         onChange={handleEditValuesChange}
                         onSubmit={handleSubmit}/> :
       <button className="timer-title"
               onClick={() => setIsEditing(true)}>
         {data.title}
       </button>
      }
      {/* elapsed & start/stop */}
      <div className="time-section">
        {isEditing ? <></> :
         <>
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
         </>
        }
        <br/>
        {/* startTime */}
        {isEditing ?
         <SubmittableInput name="startTime" value={editValues.startTime}
                           style={{width: editValues.startTime.length + 'ch'}}
                           onChange={handleEditValuesChange}
                           onSubmit={handleSubmit} autoComplete="off"/> :
         data.startTime &&
         <button onClick={() => setIsEditing(true)} className="start-time"
                 title={data.startTime.toLocaleString('en-GB')}>
           {displayTimes.start}
         </button>
        }
        {/* separator */}
        {data.startTime ? <>-</> : <></>}
        {/* endTime */}
        {isEditing ?
         <SubmittableInput name="endTime" value={editValues.endTime}
                           style={{width: editValues.endTime.length + 'ch'}}
                           onChange={handleEditValuesChange}
                           onSubmit={handleSubmit} autoComplete="off"/> :
         data.endTime &&
         <button onClick={() => setIsEditing(true)} className="end-time"
                 title={data.endTime.toLocaleString('en-GB')}>
           {displayTimes.end}
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
       <SubmittableInput name="description" value={editValues.description}
                           style={{width: editValues.title.length + 'ch'}}
                           onChange={handleEditValuesChange}
                           onSubmit={handleSubmit}/> :
       <button className="timer-description"
               onClick={() => setIsEditing(true)}>
         {data.description}
       </button>
      }
    </div>
  );
}

export default Timer;
