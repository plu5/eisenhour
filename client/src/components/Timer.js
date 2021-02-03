import React, {useState, useEffect, useRef, useCallback} from 'react';

import SubmittableInput from './SubmittableInput';

/**
 * Timer react component
 * @param {Object} props
 * @return {jsx}
 */
function Timer(props) {
  const [isRunning, setIsRunning] = useState(
    props.start && !props.end ? true : false);
  const [elapsed, setElapsed] = useState(
    props.end ?
      calculateElapsed(props.start, props.end) :
      '0:00:00');

  const [data, setData] = useState({
    id: props.id,
    start: props.start || null,
    end: props.end || null,
    title: props.title || '',
    description: props.description || ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [displayTimes, setDisplayTimes] = useState({
    start: props.start ?
      getDisplayTime(props.start) : '',
    end: props.end ?
      getDisplayTime(props.end) : ''
  });
  const [editValues, setEditValues] = useState({
    start: displayTimes.start,
    end: displayTimes.end,
    title: data.title,
    description: data.description
  });
  const [isDeleting, setIsDeleting] = useState(false);

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
    setData({...data, start: now});
    setDisplayTimes({...displayTimes, start: getDisplayTime(now)});
    setEditValues({...editValues, start: getDisplayTime(now)});
    setIsRunning(true);
  }

  /**
   * Stop timer, saving end time
   */
  function stop() {
    const now = new Date();
    setData({...data, end: now});
    setDisplayTimes({...displayTimes, end: getDisplayTime(now)});
    setEditValues({...editValues, end: getDisplayTime(now)});
    setIsRunning(false);
  }

  /**
   * Calculate elapsed time between start and end and return as a string
   *  in the format H:MM:SS
   * @param {Date} start
   * @param {Date} end
   * @return {String} elapsed time
   */
  function calculateElapsed(start, end) {
    let ms = end.getTime() - start.getTime();
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
        setElapsed(calculateElapsed(data.start, new Date()));
      }, 1000);
    } else if (!isRunning && elapsed !== '0:00:00') {
      clearInterval(tickFunctionId);
    }
    return () => clearInterval(tickFunctionId);
  }, [isRunning, data.start, elapsed]);

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
   * onSubmit function for updating start and end in accordance with
   *  startEditValue and endEditValue
   * @param {event} event
   */
  function handleSubmit(event) {
    event.preventDefault();

    const newData = {};
    const newDisplayTimes = {};

    const [startHours, startMinutes] = editValues.start.split(':');
    // Clone the Date object before mutating it
    const newStart = new Date(data.start.valueOf());
    newStart.setHours(startHours);
    newStart.setMinutes(startMinutes);
    newData.start = newStart;
    newDisplayTimes.start = editValues.start;

    if (data.end) {
      const [endHours, endMinutes] = editValues.end.split(':');
      const newEnd = new Date(data.end.valueOf());
      newEnd.setHours(endHours);
      newEnd.setMinutes(endMinutes);
      newData.end = newEnd;
      newDisplayTimes.end = editValues.end;

      setElapsed(calculateElapsed(newStart, newEnd));
    } else {
      setElapsed(calculateElapsed(newStart, new Date()));
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
    setEditValues({...editValues, start: displayTimes.start,
                   end: displayTimes.end, title: data.title,
                   description: data.description});
    setIsEditing(false);
  }

  /**
   * Delete self
   */
  function selfDestruct() {
    fetch('timerDelete', {
      method: 'post',
      body: JSON.stringify({id: data.id}),
      headers: {'Content-Type': 'application/json'},
    })
      .then((res) => res.json())
      .then((json) => {
        console.log(json);
        props.update();
      });
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
        {/* delete button */}
        {isEditing ?
         (isDeleting ?
          <>
            <span style={{color: 'darkred'}}>delete, are you sure? </span>
            <button onClick={selfDestruct}>v</button>
            <button onClick={() => setIsDeleting(false)}>x</button>
          </> :
          <button className="delete-button" onClick={() => setIsDeleting(true)}>
            delete
          </button>) :
         <></>
        }
        <br/>
        {isDeleting ? <></> :
         <div>
           {/* start time */}
           {isEditing ?
            <SubmittableInput name="start" value={editValues.start}
                              style={{width: editValues.start.length + 'ch'}}
                              onChange={handleEditValuesChange}
                              onSubmit={handleSubmit} autoComplete="off"/> :
            data.start &&
            <button onClick={() => setIsEditing(true)} className="start-time"
                    title={data.start.toLocaleString('en-GB')}>
              {displayTimes.start}
            </button>
           }
           {/* separator */}
           {data.start ? <>-</> : <></>}
           {/* end time */}
           {isEditing ?
            <SubmittableInput name="end" value={editValues.end}
                              style={{width: editValues.end.length + 'ch'}}
                              onChange={handleEditValuesChange}
                              onSubmit={handleSubmit} autoComplete="off"/> :
            data.end &&
            <button onClick={() => setIsEditing(true)} className="end-time"
                    title={data.end.toLocaleString('en-GB')}>
              {displayTimes.end}
            </button>
           }
           {/* edit confirm and cancel buttons */}
           {isEditing ?
            <>
              <button onClick={handleSubmit}>v</button>
              <button onClick={handleCancel}>x</button>
            </> : <></>
           }
         </div>
        }
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
