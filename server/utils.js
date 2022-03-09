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

module.exports = {tryDeleteObject};
