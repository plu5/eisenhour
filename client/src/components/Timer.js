import React, {useState, useEffect, useRef, useCallback} from 'react';
import useCustomCompareEffect from 'use-custom-compare-effect';

import TimerElapsed from './TimerElapsed';
import SubmittableInput from './SubmittableInput';

/**
 * Timer react component
 * @param {Object} props
 * @return {jsx}
 */
function Timer(props) {
  const [isRunning, setIsRunning] = useState(
    props.start && !props.end ? true : false);

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

  // to prevent content-jumping when editing
  const [heights, setHeights] = useState({});
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      if (titleRef.current) {
        setHeights({'title': titleRef.current.clientHeight,
                    'description': descriptionRef.current.clientHeight});
      }
    }, 0);
  }, [data]);

  /**
   * Start timer, saving start time and resetting end time
   */
  function restart() {
    const now = new Date();
    setData({...data, start: now, end: null});
    setDisplayTimes({...displayTimes, start: getDisplayTime(now), end: ''});
    setEditValues({...editValues, start: getDisplayTime(now), end: ''});
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
   * Get display time (HH:MM) from date
   * @param {Date} date
   * @return {String}
   */
  function getDisplayTime(date) {
    return date.toLocaleTimeString('en-GB').substring(0, 5);
  }

  // Update server when (and only when) the times, title, or description change
  useCustomCompareEffect(() => {
    console.log('Timer: useCustomCompareEffect called');
    if (isFirstRender()) return;
    console.log('Timer: useCustomCompareEffect updating server');
    fetch('timers/update', {
      method: 'post',
      body: JSON.stringify(data),
      headers: {'Content-Type': 'application/json'},
    })
      .then((res) => res.json())
      .then((json) => console.log(json))
      .then(() => props.onDataUpdated());
  }, [data, isFirstRender], (a, b) => {
    if (a.length !== b.length) return false;
    if (a[0].length !== b[0].length) return false;
    for (const key of Object.keys(data)) {
      if (a[0][key] !== b[0][key]) {
        return false;
      }
    }
    return true;
  });

  const [backgroundColour, setBackgroundColour] = useState(null);

  // Check matching groups on initial render and when data changes
  useEffect(() => {
    fetch('groups/matching', {
      method: 'post',
      body: JSON.stringify(data),
      headers: {'Content-Type': 'application/json'},
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.length) {
          const group = json[json.length-1];
          setBackgroundColour(group.colour);
        }
      });
  }, [data]);

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
    fetch('timers/delete', {
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

  /**
   * Duplicate self
   */
  function duplicate() {
    fetch('timers/duplicate', {
      method: 'post',
      body: JSON.stringify(data),
      headers: {'Content-Type': 'application/json'},
    })
      .then((res) => res.json())
      .then((json) => {
        console.log(json);
        props.update();
      });
  }

  return (
    <div className="timer"
         style={{backgroundColor: backgroundColour}}>
      <div className="name-section">
        {/* title */}
        {isEditing ?
         <SubmittableInput name="title" value={editValues.title}
                           title="title"
                           onChange={handleEditValuesChange}
                           onSubmit={handleSubmit}
                           style={{height: heights.title + 'px'}}/> :
         <span className="timer-title" ref={titleRef}>
           {data.title}
         </span>
        }
        <br/>
        {/* description */}
        {isEditing ?
         <SubmittableInput name="description" value={editValues.description}
                           title="description"
                           multiline={true}
                           onChange={handleEditValuesChange}
                           onSubmit={handleSubmit}
                           style={{height: heights.description < heights.title ?
                                   heights.title - 1 + 'px' :
                                   heights.description - 4.5 + 'px'}}/> :
         <span className="timer-description" ref={descriptionRef}>
           {data.description}
         </span>
        }
      </div>

      {/* edit button */}
      {isEditing ?
       <button className="edit-cancel-btn" onClick={handleCancel}>
         <span role="img" aria-label="cancel" title="cancel">✖️</span>
       </button>:
       <button className="edit-btn" onClick={() => setIsEditing(true)}>
         <span role="img" aria-label="edit" title="edit">✏️</span>
       </button>}

      {/* elapsed & start/stop */}
      <div className="time-section">
        {isEditing ? <></> :
         <>
           <TimerElapsed start={data.start} end={data.end}/>
           {isRunning ?
            <button title="stop" onClick={stop}>
              ⏹
            </button> :
            <>
              {/* TODO: Add are you sure as this is destructive */}
              <button title="restart" onClick={restart}>
                ▶
              </button>
              <button title="resume as new" onClick={duplicate}>
                +
              </button>
            </>
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
          <button className="delete-button"
                  title="delete task"
                  onClick={() => setIsDeleting(true)}>
            delete
          </button>) :
         <></>
        }
        {isDeleting ? <></> :
         <div>
           {/* edit confirm and cancel buttons */}
           {isEditing ?
            <>
              <button onClick={handleSubmit} title="confirm edit">v</button>
              <button onClick={handleCancel} title="cancel edit">x</button>
            </> : <></>
           }
           {/* start time */}
           {isEditing ?
            <SubmittableInput name="start" value={editValues.start}
                              title="start time"
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
                              title="end time"
                              style={{width: editValues.end.length + 'ch'}}
                              onChange={handleEditValuesChange}
                              onSubmit={handleSubmit} autoComplete="off"/> :
            data.end &&
            <button onClick={() => setIsEditing(true)} className="end-time"
                    title={data.end.toLocaleString('en-GB')}>
              {displayTimes.end}
            </button>
           }
         </div>
        }
      </div>
    </div>
  );
}

export default Timer;
