import React, {useState, useEffect} from 'react';
import Timer from './Timer';

require('json.date-extensions');

/**
 * Timeline
 * @return {jsx}
 */
function Timeline() {
  const [timers, setTimers] = useState([]);

  useEffect(() => {
    (async () => {
      const response = await fetch('timerData');
      const timerData = await JSON.parseWithDate(await response.text());
      if (timerData) {
        setTimers(timerData);
      }
    })();
  }, []);

  return (
    <div className="timeline">
      {timers.map((t, i) => (
        <Timer {...t} key={i}/>
      ))}
    </div>
  );
}

export default Timeline;
