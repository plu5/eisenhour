import React, {useState, useEffect} from 'react';

import Todos from './Todos';
import Timeline from './Timeline';
import Statistics from './Statistics';

/**
 * Main
 * @return {jsx}
 */
function Main() {
  const [date, setDate] = useState(new Date());

  // Update date at midnight
  useEffect(() => {
    let timeoutId;

    /**
     * Set timeout to midnight
     * @return {Object} timeout
     */
    function setTimeoutToMidnight() {
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const now = new Date();
      const msUntilMidnight = midnight.getTime() - now.getTime();
      return setTimeout(function() {
        setDate(new Date());
        timeoutId = setTimeoutToMidnight();
      }, msUntilMidnight);
    }

    timeoutId = setTimeoutToMidnight();
    return () => {
      clearInterval(timeoutId);
    };
  }, []);

  return (
    <div className="container">
      <div className="container__main">
        <div className="container__left">
          <Todos date={date}/>
        </div>
        <div className="container__middle">
          <Timeline date={date} setDate={setDate}/>
        </div>
        <div className="container__right">
          <Statistics/>
        </div>
      </div>
    </div>
  );
}

export default Main;
