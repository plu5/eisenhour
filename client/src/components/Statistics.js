import React, {useState} from 'react';

import YearSelector from './YearSelector';

/**
 * Statistics
 * @return {jsx}
 */
function Statistics() {
  const [date, setDate] = useState(new Date());
  const [tallies, setTallies] = useState({});

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

  return (
    <div className="statistics">
      <YearSelector date={date} update={setDate}/>
      <button onClick={calculate}>Calculate</button>
      <br/>
      <table>
        <thead>
          <tr>
            <th>Group</th>
            <th># of timers</th>
            <th>Hours duration</th>
          </tr>
        </thead>
        <tbody>
          {renderTableData()}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Get array of stats from server
 * @param {String} year in the format yyyy
 */
async function fetchStatsOf(year) {
  const response = await fetch('statistics/' + year);
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

export default Statistics;
