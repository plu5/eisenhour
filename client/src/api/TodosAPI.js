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

  return await JSON.parse(await response.text());
}

/**
 * Get todo list for current day
 * @param {Date} date
 * @return {Promise}
 */
async function getTodoList(date) {
  return base('todos', {year: date.getFullYear(),
                        month: date.getMonth() + 1,
                        day: date.getDate()});
}

/**
 * Add todo
 * @param {String} title
 * @return {Promise}
 */
async function add(title) {
  return base('todos/add', {title});
}

/**
 * Update todo
 * @param {Object} data
 * @return {Promise}
 */
async function update(data) {
  return base('todos/update', data);
}

/**
 * Delete todo
 * @param {String} id
 * @return {Promise}
 */
async function del(id) {
  return base('todos/delete', {id});
}

module.exports = {
  getTodoList,
  add,
  update,
  del,
};
