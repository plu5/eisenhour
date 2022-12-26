import React, {useState, useEffect, useRef, useCallback} from 'react';
import useCustomCompareEffect from 'use-custom-compare-effect';

import {update, del, dup} from '../api/TimerAPI';
import TimerElapsed from './TimerElapsed';
import SubmittableInput from './SubmittableInput';
import DateSelector from './DateSelector';

/**
 * Timer react component
 * @param {Object} props
 * @param {String} props.id
 * @param {Date} props.start
 * @param {Date} props.end
 * @param {String} props.title
 * @param {String} props.description
 * @param {Function} props.update called when a timeline update is desired,
 *  e.g. after the timer gets deleted. Expected to optionally take a date
 *  parameter to update the timeline to a given date.
 * @param {Function} props.onDataUpdated called when times, title, or
 *  description change
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
    start: data.start,
    end: data.end,
    title: data.title,
    description: data.description
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

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
    setEditValues({...editValues, start: now, end: null});
    props.update(now);
    setIsRunning(true);
    setIsRestarting(false);
  }

  /**
   * Stop timer, saving end time
   */
  function stop() {
    const now = new Date();
    setData({...data, end: now});
    setDisplayTimes({...displayTimes, end: getDisplayTime(now)});
    setEditValues({...editValues, end: now});
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
    update(data)
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
   * onChange handler for edit values to keep in sync with DOM
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

    // Clone the Date object before mutating it
    const newStart = new Date(editValues.start.valueOf());
    newData.start = newStart;
    newDisplayTimes.start = getDisplayTime(newStart);

    if (data.end) {
      const newEnd = new Date(editValues.end.valueOf());
      newData.end = newEnd;
      newDisplayTimes.end = getDisplayTime(newEnd);
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
    setEditValues({...editValues, start: data.start, end: data.end,
                   title: data.title, description: data.description});
    setIsEditing(false);
  }

  /**
   * Delete self
   */
  function selfDestruct() {
    del(data.id)
      .then((res) => res.json())
      .then((json) => {
        console.log(json);
        props.update();
        setIsDeleting(false);
      });
  }

  /**
   * Duplicate self
   */
  function duplicate() {
    const now = new Date();
    dup(data, now)
      .then((res) => res.json())
      .then((json) => {
        console.log(json);
        props.update(now);
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
              {isRestarting ?
               <>
                 <span style={{color: 'darkred'}}>restart, are you sure?</span>
                 <button onClick={restart}>v</button>
                 <button onClick={() => setIsRestarting(false)}>x</button>
               </> :
               <button title="restart" onClick={() => setIsRestarting(true)}>
                 ▶
               </button>
              }
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
            <DateSelector name="start" date={data.start} type="time"
                          title="start time"
                          onChange={handleEditValuesChange}
                          onSubmit={handleSubmit}/> :
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
            <DateSelector name="end" date={data.end} type="time"
                          title="end time"
                          onChange={handleEditValuesChange}
                          onSubmit={handleSubmit}/> :
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
