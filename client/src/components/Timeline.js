import React, {useState, useEffect} from 'react';

import DateSelector from './DateSelector';
import Timebar from './Timebar';
import Timer from './Timer';

require('json.date-extensions');

/**
 * Timeline
 * @return {jsx}
 */
function Timeline() {
  const [timers, setTimers] = useState([]);
  const update = async () => setTimers(await fetchTimers(day));

  const getDay = (date) => {
    return date.getFullYear() + '-' +
      (date.getMonth() + 1) + '-' + date.getDate();
  };
  const [day, setDay] = useState(getDay(new Date()));
  const updateDay = (date) => setDay(getDay(date));

  // Update timer data on load and on date change
  useEffect(() => {
    (async () => setTimers(await fetchTimers(day)))();
  }, [day]);

  /**
   * Add new timer starting now and move to today
   * @param {String} title
   */
  async function addTimer(title) {
    const start = new Date();
    updateDay(start);
    const response = await fetch('timerAdd', {
      method: 'post',
      body: JSON.stringify({title, start}),
      headers: {'Content-Type': 'application/json'},
    });
    setTimers(await jsonToTimersArray(response));
  }

  async function syncDown() {
    const response = await fetch('syncDown', {
      method: 'post',
      body: JSON.stringify({}),
      headers: {'Content-Type': 'application/json'},
    });
    setTimers(await jsonToTimersArray(response));
  }

  async function syncUp() {
    const response = await fetch('syncUp', {
      method: 'post',
      body: JSON.stringify({}),
      headers: {'Content-Type': 'application/json'},
    });
    setTimers(await jsonToTimersArray(response));
  }

  return (
    <div className="timeline">
      <DateSelector date={new Date(day.split('-'))} update={updateDay}/>
      <div className="sync">
        <button onClick={syncDown} title="sync down">↓</button>
        <button onClick={syncUp} title="sync up">↑</button>
      </div>
      <Timebar addTimer={addTimer}/>
      {timers.map((t, i) => (
        // Setting key to be a combination of all the timer data because that
        //  way it will re-render the component when an update from the server
        //  caused e.g. only the title to change.
        <Timer {...t} update={update} key={Object.values(t).join()}/>
      ))}
    </div>
  );
}

/**
 * Get array of timers from JSON server response
 * @param {JSON} response
 */
async function jsonToTimersArray(response) {
  const timerData = await JSON.parseWithDate(await response.text());
  return timerData ? timerData.reverse() : [];
}

/**
 * Get array of timers from server
 * @param {String} day in the format yyyy-m-d
 */
async function fetchTimers(day) {
  const response = await fetch('day/' + day);
  return jsonToTimersArray(response);
}

export default Timeline;
