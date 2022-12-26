import React, {useState, useEffect} from 'react';

import DateSelector from './DateSelector';
import TaskGroup from './TaskGroup';

/**
 * Statistics
 * @return {jsx}
 */
function Statistics() {
  const [date, setDate] = useState(new Date());
  const [toDate, setToDate] = useState(date); // Only used for range type
  const [tallies, setTallies] = useState({});
  const [groups, setGroups] = useState([]);
  const [dateType, setDateType] = useState('month');

  const update = async () => setGroups(await fetchGroups());

  // Update group data on load
  useEffect(() => {
    update();
  }, []);

  /**
   * get tallies
   */
  async function calculate() {
    setTallies(await fetchStatsOf(date, dateType, toDate));
  }

  /**
   * format tallies into html table rows
   * @return {jsx}
   */
  function renderTableData() {
    return Object.keys(tallies).map((group, index) => {
      const {tally, seconds} = tallies[group];
      return (
        <tr key={group}>
          <td>{group}</td>
          <td>{tally}</td>
          <td>{round(seconds/60/60, 1)}</td>
        </tr>
      );
    });
  }

  /**
   * Add group button onClick function
   * @param {Object} event
   */
  function addGroup(event) {
    event.preventDefault();
    const newGroups = groups.concat([{name: '', matchers: [''], colour: '',
                                      edit: true}]);
    setGroups(newGroups);
  }

  /**
   * dateType select onChange function
   * @param {Object} event
   */
  function handleDateTypeChange(event) {
    setDateType(event.target.value);
  }

  /**
   * JSX date selector for the given type
   * @param {String} type (year, month, or range)
   * @return {jsx}
   */
  function getDateSelector(type) {
    if (type === 'year') {
      return (
        <DateSelector date={date} onChange={(e) => setDate(e.target.value)}
                      type="year"/>
      );
    } else if (type === 'month') {
      return (
        <DateSelector date={date} onChange={(e) => setDate(e.target.value)}
                      type="month"/>
      );
    } else if (type === 'day') {
      return (
        <DateSelector date={date} onChange={(e) => setDate(e.target.value)}
                      type="day"/>
      );
    } else {
      return (
        <>
          <DateSelector date={date} onChange={(e) => setDate(e.target.value)}
                        type="daterange-start" endDate={toDate}/>
          <DateSelector date={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        type="daterange-end" startDate={date}/>
        </>
      );
    }
  }

  return (
    <div className="statistics">
      <div className="task-groups">
        <span>Task groups</span>
        <button onClick={addGroup}>+</button>
        <br/>
        {groups.map((group, index) => (
          <TaskGroup name={group.name} matchers={group.matchers}
                     colour={group.colour} edit={group.edit}
                     update={update} key={index}/>
        ))}
      </div>

      <br/>
      <select value={dateType} onChange={handleDateTypeChange}>
        <option value="year">Year</option>
        <option value="month">Month</option>
        <option value="day">Day</option>
        <option value="range">Range</option>
      </select>
      <br/>
      {getDateSelector(dateType)}
      <button onClick={calculate}>Calculate</button>
      <br/>
      <div className="group-statistics">
        <table>
          <thead>
            <tr>
              <th>Group</th>
              <th># of tasks</th>
              <th>Duration (hours)</th>
            </tr>
          </thead>
          <tbody>
            {renderTableData()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Get array of stats from server
 * @param {Date} date
 * @param {String} dateType 'year'/'month'/'day'/'range'
 * @param {Date} to; required in 'range' dateType, not used otherwise
 */
async function fetchStatsOf(date, dateType, to=null) {
  let route = 'groups/statistics/';
  if (['year', 'month', 'day'].includes(dateType)) {
    route += date.getFullYear();
    // NOTE: JavaScript Date months are 0-based
    if (['month', 'day'].includes(dateType)) {
      route += '/' + (date.getMonth() + 1);
      if (dateType === 'day') route += '/' + date.getDate();
    }
  } else if (dateType === 'range') {
    if (!to) throw new Error('range type specified but no to date provided');
    const dtStr = (dt) => [
      dt.getFullYear(), (dt.getMonth() + 1), dt.getDate()].join('-');
    route += 'range/' + [dtStr(date), dtStr(to)].join('/');
  }
  const response = await fetch(route);
  const json = await response.json();
  return json;
}

/**
 * Round 'value' to 'precision' decimal places
 * by Billy Moon https://stackoverflow.com/a/7343013
 * @param {Float} value
 * @param {Integer} precision
 * @return {Float} rounded value
 */
function round(value, precision) {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}

/**
 * Get array of task groups from server
 */
async function fetchGroups() {
  const response = await fetch('groups/');
  const json = await response.json();
  return json;
}

export default Statistics;
