const {
  getQueue,
  saveQueue
} = require('./save');

let queue = null;

(async () => {
  queue = await getQueue();
})();


/**
 * Add required gcal change to queue.
 * @param {String} typeOfChange : new, update, delete
 * @param {Object} timer
 */
function addToQueue(typeOfChange, timer) {
  // Only keep latest (remove all previous change entries to same timer)
  let staleUpdateIndex = -1;
  do {
    staleUpdateIndex = queue.findIndex((entry) => {
      if (!Object.values(entry)[0]) return false;
      return Object.values(entry)[0].id === timer.id;
    });
    if (staleUpdateIndex !== -1) {
      queue.splice(staleUpdateIndex, 1);
    }
  } while (staleUpdateIndex !== -1);

  // Not on gcal yet, so if delete ignore, otherwise new
  if (timer.id.length === 21) {
    if (typeOfChange === 'delete') {
      // pass
    } else {
      queue.push({'new': timer});
    }
  //
  } else {
    queue.push({[typeOfChange]: timer});
  }

  console.log('addToQueue queue state:', queue);
  saveQueue(queue);
}

/**
 * Remove entry from up sync queue.
 * @param {Integer} index of entry to remove
 */
function removeFromQueue(index) {
  queue.splice(index, 1);
  console.log('removeFromQueue queue state:', queue);
  saveQueue(queue);
}


module.exports = {
  addToQueue,
  removeFromQueue,
};
