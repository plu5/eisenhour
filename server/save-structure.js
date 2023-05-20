const {getSave} = require('./save');
const {tryDeleteObject} = require('./utils');

let save = null;

(async () => {
  save = await getSave();
})();


/**
 * Return keys in the save file for year, month, day, verifying the structure
 *  exists in the save file and creating it if not.
 * @param {Integer} year
 * @param {Integer} month
 * @param {Integer} day
 * @return {Array} keys for year, month, day
 */
function getSaveKeysAndVerifyStructureFor(year, month, day, save_=save) {
  const y = 'y' + year;
  const m = 'm' + month;
  const d = 'd' + day;
  if (!save_[y]) save_[y] = {};
  if (!save_[y][m]) save_[y][m] = {};
  if (!save_[y][m][d]) save_[y][m][d] = [];
  return [y, m, d];
}

/**
 * Return the save array for the given day.
 * @param {Integer} year
 * @param {Integer} month
 * @param {Integer} day
 * @return {Array} array of timers for given save day
 */
function getDayArray(year, month, day, save_=save) {
  const [y, m, d] = getSaveKeysAndVerifyStructureFor(year, month, day, save_);
  return save_[y][m][d];
}

/**
 * Return day array of timer with given id, or false if not found.
 * @param {String} id
 * @return {Array} dayArray if found, {Bool} false if not found.
 */
function getDayArrayById(id, save_=save) {
  for (const [, year] of Object.entries(save_)) {
    for (const [, month] of Object.entries(year)) {
      for (const [, dayArray] of Object.entries(month)) {
        const index = dayArray.findIndex((t) => t.id === id);
        if (index !== -1) {
          return dayArray;
        }
      }
    }
  }
  return false;
}

/**
 * Sort array by start time. Sorts in place but also returns the array.
 * @param {Array} array
 * @return {Array}
 */
function sortArrayByStart(array) {
  return array.sort((a, b) => {
    if (a.start < b.start) return -1;
    if (a.start > b.start) return 1;
    return 0;
  });
}

/**
 * Attempt to delete timer with given id from the entire save.
 * @param {String} id
 * @return {Bool} true if object was deleted, false if not found.
 */
function tryDeleteTimerFromSave(id) {
  const dayArray = getDayArrayById(id);
  if (dayArray) if (tryDeleteObject(id, dayArray)) return true;
  return false;
}


module.exports = {
  getSaveKeysAndVerifyStructureFor,
  getDayArray,
  getDayArrayById,
  sortArrayByStart,
  tryDeleteTimerFromSave,
};
