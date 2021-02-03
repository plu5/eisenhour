import React, {useState, useEffect, useRef} from 'react';

import DaySelector from './DaySelector';
import Timebar from './Timebar';
import Timer from './Timer';

require('json.date-extensions');

/**
 * Timeline
 * @return {jsx}
 */
function Timeline() {
  const [timers, setTimers] = useState([]);

  const getDay = (date) => {
    return date.getFullYear() + '-' +
      (date.getMonth() + 1) + '-' + date.getDate();
  };
  const day = useRef(getDay(new Date()));

  // Get timer data on load
  useEffect(() => {
    fetchTimers();
  }, []);

  /**
   * Update timers from server timer data
   */
  async function fetchTimers() {
    console.log(day.current);
    const response = await fetch('day/' + day.current);
    const timerData = await JSON.parseWithDate(await response.text());
    if (timerData) {
      setTimers(timerData.reverse());
    }
  }

  function updateDay(date) {
    day.current = getDay(date);
    console.log(day);
    fetchTimers();
  }

  /**
   * Add new timer and update data
   * @param {String} title
   */
  async function addTimer(title) {
    const start = new Date();
    updateDay(start);
    await fetchTimers();
    await fetch('timerAdd', {
      method: 'post',
      body: JSON.stringify({title, start}),
      headers: {'Content-Type': 'application/json'},
    });
    await fetchTimers();
  }

  return (
    <div className="timeline">
      <DaySelector update={updateDay}/>
      <Timebar addTimer={addTimer}/>
      {timers.map((t, i) => (
        <Timer {...t} update={fetchTimers} key={t.id}/>
      ))}
    </div>
  );
}

export default Timeline;
