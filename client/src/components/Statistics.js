import React, {useState, useEffect} from 'react';

import YearSelector from './YearSelector';
import TaskGroup from './TaskGroup';

/**
 * Statistics
 * @return {jsx}
 */
function Statistics() {
  const [date, setDate] = useState(new Date());
  const [tallies, setTallies] = useState({});
  const [groups, setGroups] = useState([]);

  const update = async () => setGroups(await fetchGroups());

  // Update group data on load
  useEffect(() => {
    update();
  }, []);

  /**
   * get tallies
   */
  async function calculate() {
    setTallies(await fetchStatsOf(date.getFullYear()));
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

  return (
    <div className="statistics">
      <div className="task-groups">
        <span>Task groups</span>
        <button onClick={addGroup}>+</button>
        {groups.map((group, index) => (
          <span key={index}>
            <br/>
            <TaskGroup name={group.name} matchers={group.matchers}
                       colour={group.colour} edit={group.edit}
                       update={update}/>
          </span>
        ))}
      </div>

      <br/>
      <YearSelector date={date} update={setDate}/>
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
 * @param {String} year in the format yyyy
 */
async function fetchStatsOf(year) {
  const response = await fetch('groups/statistics/' + year);
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
