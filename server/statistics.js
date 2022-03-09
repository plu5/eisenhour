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
  const tallies = {};
  Object.keys(matchers).forEach((group) => {
    tallies[group] = {'tally': 0, 'seconds': 0};
  });

  const yearDict = save['y' + year];
  if (!yearDict) return;

  for (const [, month] of Object.entries(yearDict)) {
    for (const [, dayArray] of Object.entries(month)) {
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
    }
  }

  return tallies;
}

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

module.exports = {talliesForYear, timerMatches, countRunning};
