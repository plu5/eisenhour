const changeSubscribers = [];

/**
 * Add a function to changeSubscribers which will be called when a timer data
 *  function is called.
 * @param {Function} f
 */
function subscribe(f) {
  const existing = changeSubscribers.findIndex((e) =>
    Object.entries(e).toString() === Object.entries(f).toString());
  if (existing !== -1) {
    changeSubscribers[existing] = f;
  } else {
    changeSubscribers.push(f);
  }
}

/**
 * Base POST function
 * @param {String} route
 * @param {Object} body (unserialised)
 */
async function base(route, body) {
  const response = await fetch(route, {
    method: 'post',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json'},
  });

  for (const subscriber of changeSubscribers) {
    subscriber();
  }

  return response;
}

/**
 * Add timer
 * @param {String} title
 * @param {Date} start; start time
 * @return {Promise}
 */
async function add(title, start) {
  return base('timers/add', {title, start});
}

/**
 * Update timer
 * @param {Object} data
 * @return {Promise}
 */
async function update(data) {
  return base('timers/update', data);
}

/**
 * Delete timer
 * @param {String} id
 * @return {Promise}
 */
async function del(id) {
  return base('timers/delete', {id});
}

/**
 * Duplicate timer
 * @param {Object} data
 * @param {Date} start; start time
 * @return {Promise}
 */
async function dup(data, start) {
  return base('timers/duplicate', {...data, start});
}

/**
 * Sync
 * @return {Promise}
 */
async function sync() {
  return base('sync/sync', {});
}

/**
 * Sync down
 * @return {Promise}
 */
async function down() {
  return base('sync/down', {});
}

/**
 * Sync up
 * @return {Promise}
 */
async function up() {
  return base('sync/up', {});
}

module.exports = {
  add,
  update,
  del,
  dup,
  sync,
  down,
  up,
  subscribe,
};
