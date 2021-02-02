import React, {useState, useEffect} from 'react';
import Timebar from './Timebar';
import Timer from './Timer';

require('json.date-extensions');

/**
 * Timeline
 * @return {jsx}
 */
function Timeline() {
  const [timers, setTimers] = useState([]);

  // Get timer data on load
  useEffect(() => {
    fetchTimers();
  }, []);

  /**
   * Update timers from server timer data
   */
  async function fetchTimers() {
    const response = await fetch('timerData');
    const timerData = await JSON.parseWithDate(await response.text());
    if (timerData) {
      setTimers(timerData.reverse());
    }
  }

  /**
   * Add new timer and update data
   * @param {String} title
   */
  function addTimer(title) {
    fetch('timerAdd', {
      method: 'post',
      body: JSON.stringify({title}),
      headers: {'Content-Type': 'application/json'},
    })
      .then((res) => res.json())
      .then((json) => {
        console.log(json);
        fetchTimers();
      });
  }

  return (
    <div className="timeline">
      <Timebar addTimer={addTimer}/>
      {timers.map((t, i) => (
        <Timer {...t} key={t.id}/>
      ))}
    </div>
  );
}

export default Timeline;
