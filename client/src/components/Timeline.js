import React, {useState, useEffect, useCallback} from 'react';

import {add, sync} from '../api/TimerAPI';
import DateSelector from './DateSelector';
import QueueStatus from './QueueStatus';
import Timebar from './Timebar';
import Timer from './Timer';

require('json.date-extensions');

/**
 * Timeline
 * @param {Object} props
 * @param {Date} props.date
 * @param {Function} props.setDate
 * @return {jsx}
 */
function Timeline(props) {
  const [timers, setTimers] = useState([]);
  const [syncing, setSyncing] = useState(false);

  /**
   * Get a string in the format yyyy-m-d from a Date object.
   * @param {Date} date
   * @return {String} yyyy-m-d
   */
  function getDateStr(date) {
    return date.getFullYear() + '-' +
      (date.getMonth() + 1) + '-' + date.getDate();
  }

  const _update = useCallback(async () =>
    setTimers(await fetchTimers(getDateStr(props.date))), [props.date]);

  /**
   * Update timers data
   * @param {Date} [newDate] If provided the timeline will move to the given
   *  date before updating the list of timers.
   */
  async function update(newDate) {
    newDate ? props.setDate(newDate) : _update();
  }

  // Update timers data on load and on date change
  useEffect(() => {
    console.log('Timeline: update timers data useEffect');
    _update();
  }, [props.date, _update]);

  /**
   * Update page title based on number of running timers
   */
  const updateTitle = useCallback(async () => {
    console.log('Timeline: updateTitle called');
    const count = await fetchCount();
    document.title = (parseInt(count)>0 ? count + ' running | ' : '') +
      'Eisenhour';
  }, []);

  // Update page title on load and on timers change
  useEffect(() => {
    updateTitle();
  }, [timers, updateTitle]);

  /**
   * Add new timer starting now and move to today
   * @param {String} title
   */
  async function addTimer(title) {
    const start = new Date();
    props.setDate(start);
    const response = await add(title, start);
    setTimers(await jsonToTimersArray(response));
  }

  /**
   * Ask server to sync events
   */
  async function sync_() {
    setSyncing(true);
    const response = await sync();
    setTimers(await jsonToTimersArray(response));
    setSyncing(false);
  }

  return (
    <div className="timeline">
      <DateSelector date={props.date}
                    onChange={(e) => props.setDate(e.target.value)}
                    type="day"/>
      <div className="sync">
        <button onClick={sync_} title="sync" disabled={syncing}>↑↓</button>
        <QueueStatus syncing={syncing}/>
      </div>
      <Timebar addTimer={addTimer}/>
      {timers.map((t, i) => (
        // Setting key to be a combination of all the timer data because that
        //  way it will re-render the component when an update from the server
        //  caused e.g. only the title to change.
        <Timer {...t} update={update} onDataUpdated={updateTitle}
               key={Object.values(t).join()}/>
      ))}
    </div>
  );
}

/**
 * Get array of timers from JSON server response
 * @param {JSON} response
 * @return {Array} timer data array if exists or empty array
 */
async function jsonToTimersArray(response) {
  const timerData = await JSON.parseWithDate(await response.text());
  return timerData ? timerData.reverse() : [];
}

/**
 * Get array of timers from server
 * @param {String} dateStr in the format yyyy-m-d
 * @return {Array} timer data array
 */
async function fetchTimers(dateStr) {
  const response = await fetch('day/' + dateStr);
  return jsonToTimersArray(response);
}

/**
 * Get count of running timers from server
 * @return {Integer} count of running timers
 */
async function fetchCount() {
  const response = await fetch('timers/countRunning');
  return response.text();
}

export default Timeline;
