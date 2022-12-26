/**
 * Get tallies for year (number and duration of timers that match given
 *  matchers)
 * @param {Integer} year
 * @param {Object} save
 * @param {Object} matchers; should be of the form {'group1': ['matcher1', ..],
 *  'group2': ['matcher1', ..], ..}
 * @return {Object} tallies in the form {'group1': {'tally': 0, 'seconds': 0},
 *   'group2': {'tally': 0, 'seconds': 0}, ..}
 */
function talliesForYear(year, save, matchers) {
  return talliesForType('year', {year}, save, matchers);
}

/**
 * Get tallies for month (number and duration of timers that match given
 *  matchers)
 * @param {Integer} month
 * @param {Integer} year
 * @param {Object} save
 * @param {Object} matchers; should be of the form {'group1': ['matcher1', ..],
 *  'group2': ['matcher1', ..], ..}
 * @return {Object} tallies in the form {'group1': {'tally': 0, 'seconds': 0},
 *   'group2': {'tally': 0, 'seconds': 0}, ..}
 */
function talliesForMonth(month, year, save, matchers) {
  return talliesForType('month', {month, year}, save, matchers);
}

/**
 * Get tallies for year/month/day (number and duration of timers that match
 *  given matchers)
 * @param {String} type 'year'/'month'/'day'
 * @param {Object} info; in case of type 'year' should have year integer, in
 *  case of type 'month' should have year and month integers, in case of type
 *  'day' should have year month and day integers.
 * @param {Object} save
 * @param {Object} matchers; should be of the form {'group1': ['matcher1', ..],
 *  'group2': ['matcher1', ..], ..}
 * @return {Object} tallies in the form {'group1': {'tally': 0, 'seconds': 0},
 *   'group2': {'tally': 0, 'seconds': 0}, ..}
 */
function talliesForType(type, info, save, matchers) {
  const tallies = {};
  Object.keys(matchers).forEach((group) => {
    tallies[group] = {'tally': 0, 'seconds': 0};
  });

  if (['year', 'month', 'day'].includes(type)) {
    const yearDict = getYearDict(save, info.year);
    if (type === 'year') tallyYearDict(tallies, yearDict, matchers);
    else if (['month', 'day'].includes(type)) {
      const monthDict = getMonthDict(yearDict, info.month);
      if (type === 'month') tallyMonthDict(tallies, monthDict, matchers);
      else if (type === 'day') {
        const dayArray = getDayArray(monthDict, info.day);
        tallyDayArray(tallies, dayArray, matchers);
      }
    }
  } else if (type === 'range') {
    const structure = getNeededStructureForRange(info.from, info.to);
    for (const [y, yDict] of Object.entries(structure)) {
      const yearDict = getYearDict(save, y.replace(/^y/, ''));
      if (!yearDict) continue;
      for (const [m, mDict] of Object.entries(yDict)) {
        if (!yearDict[m]) continue;
        const monthDict = getMonthDict(yearDict, m.replace(/^m/, ''));
        if (!monthDict) continue;
        for (const [d, _] // eslint-disable-line no-unused-vars
             of Object.entries(mDict)) {
          if (!monthDict[d]) continue;
          const dayArray = getDayArray(monthDict, d.replace(/^d/, ''));
          if (!dayArray) continue;
          tallyDayArray(tallies, dayArray, matchers);
        }
      }
    }
  }

  return tallies;
}

const tallyYearDict = (tallies, yearDict, matchers) => {
  for (const [, monthDict] of Object.entries(yearDict)) {
    tallyMonthDict(tallies, monthDict, matchers);
  }
};

const tallyMonthDict = (tallies, monthDict, matchers) => {
  for (const [, dayArray] of Object.entries(monthDict)) {
    tallyDayArray(tallies, dayArray, matchers);
  }
};

const tallyDayArray = (tallies, dayArray, matchers) => {
  for (const timer of dayArray) {
    Object.entries(matchers).forEach(([group, matchersArray]) => {
      for (const matcher of matchersArray) {
        if (timerMatches(matcher, timer)) {
          tallies[group]['tally'] += 1;
          tallies[group]['seconds'] += timerSeconds(timer);
        }
      }
    });
  }
};

const getYearDict = (save, year) => {
  const yearDict = save['y' + Number(year)];
  if (!yearDict) return console.log('unable to access yearDict', year);
  return yearDict;
};

const getMonthDict = (yearDict, month) => {
  const monthDict = yearDict['m' + Number(month)];
  if (!monthDict) return console.log('unable to access monthDict', month);
  return monthDict;
};

const getDayArray = (monthDict, day) => {
  const dayArray = monthDict['d' + Number(day)];
  if (!dayArray) return console.log('unable to access dayArray', day);
  return dayArray;
};

/**
 * Return whether timer matches regex
 * @param {String} matcher; regex string
 * @param {Object} timer
 * @return {Bool}
 */
function timerMatches(matcher, timer) {
  return RegExp(matcher).test(timer.title);
}

/**
 * Return seconds duration of timer
 * @param {Object} timer
 * @return {Integer} seconds duration
 */
function timerSeconds(timer) {
  const start = new Date(timer.start);
  const end = new Date(timer.end);
  const msDuration = end.getTime() - start.getTime();
  const secondsDuration = Math.round(msDuration / 1000);
  return secondsDuration;
}

/**
 * Go through upQueue tallying the number of timers with no end time
 * @param {Array} upQueue
 * @return {Integer} num running
 */
function countRunning(upQueue) {
  let num = 0;
  for (const listing of upQueue) {
    for (const timer of Object.values(listing)) {
      if (timer.end == null) {
        num += 1;
      }
    }
  }
  return num;
}

/**
 * Get array of dates in the format yyyy-m-d between date strings 'from' and
 *  'to'
 * @param {String} from; start date str in the format yyyy-m-d or yyyy-mm-dd
 * @param {String} to; end date str in the format yyyy-m-d or yyyy-mm-dd
 * @return {Array}
 */
function getDatesFromRange(from, to) {
  const arr = [];
  const dt = new Date(from);
  while (dt<=new Date(to)) {
    const ndt = new Date(dt);
    arr.push(`${ndt.getFullYear()}-${ndt.getMonth()+1}-${ndt.getDate()}`);
    dt.setDate(dt.getDate()+1);
  }
  return arr;
}

/**
 * Get structure in the format {y: {m: {d: []}}} for dates in 'dtArray'
 * @param {Array} dtArray
 * @return {Object} structure
 */
function getNeededStructureForDates(dtArray) {
  const structure = {};
  dtArray.forEach((dt) => {
    let [y, m, d] = dt.split('-');
    y = 'y' + y;
    m = 'm' + m.replace(/^0/, '');
    d = 'd' + d.replace(/^0/, '');
    if (!structure[y]) structure[y] = {};
    if (!structure[y][m]) structure[y][m] = {};
    if (!structure[y][m][d]) structure[y][m][d] = [];
  });
  return structure;
}

const getNeededStructureForRange = (from, to) => {
  return getNeededStructureForDates(getDatesFromRange(from, to));
};

module.exports = {talliesForYear, talliesForMonth, talliesForType,
                  timerMatches, countRunning, getDatesFromRange,
                  getNeededStructureForDates};
