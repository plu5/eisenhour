/**
 * Attempt to delete object with given key value from given array.
 * @param {String} value
 * @param {Array} array
 * @param {String} key
 * @return {Bool} true if object was deleted, false if not found.
 */
function tryDeleteObject(value, array, key='id') {
  const index = array.findIndex((t) => t[key] === value);
  if (index !== -1) {
    console.log('delete:', array[index]);
    array.splice(index, 1);
    return true;
  } else {
    return false;
  }
}

/**
 * Get year, month, day from a Date object.
 * @param {Date} date
 * @return {Array} [year, month, day]
 */
function getYearMonthDay(date) {
  return [date.getFullYear(),
          (date.getMonth() + 1),
          date.getDate()];
}

/**
 * Get date string in the format yyyy-mm-dd_HH-MM-SS
 * @param {Date} date
 * @return {String}
 */
function getDateStr(date) {
  const pad = (num) => num <= 9 ? `0${num}` : num;
  return `${date.getFullYear()}-${pad(date.getMonth())}-\
${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-\
${pad(date.getSeconds())}`;
}

module.exports = {tryDeleteObject, getYearMonthDay, getDateStr};
