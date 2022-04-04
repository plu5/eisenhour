import React, {useState, useEffect} from 'react';

/**
 * TimerElapsed react component
 * @param {Object} props
 * @param {Date} props.start start date
 * @param {Date} props.end end date
 * @param {Function} props.update callback
 * @return {jsx}
 */
function TimerElapsed(props) {
  const [isRunning, setIsRunning] = useState(
    props.start && !props.end ? true : false);
  const [elapsed, setElapsed] = useState(
    props.end ?
      calculateElapsed(props.start, props.end) :
      '0:00:00');

  // Update isRunning
  useEffect(() => {
    setIsRunning(props.end === null);
  }, [props.end]);

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

  // Tick elapsed every second while running
  useEffect(() => {
    let tickFunctionId = null;
    if (isRunning) {
      tickFunctionId = setInterval(() => {
        setElapsed(calculateElapsed(props.start, new Date()));
      }, 1000);
    } else if (!isRunning && elapsed !== '0:00:00') {
      clearInterval(tickFunctionId);
    }
    return () => clearInterval(tickFunctionId);
  }, [isRunning, props.start, elapsed]);

  return (
    <span className={'timer-elapsed' + (isRunning ? ' running' : '')}>
      {elapsed}
    </span>
  );
}

export default TimerElapsed;
