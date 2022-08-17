const nanoid = require('nanoid').nanoid;
const express = require('express');

const {tryDeleteObject, getYearMonthDay} = require('./utils');
const {countRunning} = require('./statistics');
const {addToQueue} = require('./queue');

const {
  getDayArray,
  getDayArrayById,
  sortArrayByStart
} = require('./save-structure');

const {
  getQueue,
  saveSave
} = require('./save');

let currentTimers = [];

const router = new express.Router();


/**
 * Return currentTimers
 * @return {Array} currentTimers
 */
function getCurrentTimers() {
  return sortArrayByStart(currentTimers);
}

/**
 * Update currentTimers to array in save.year.month.day and return it.
 * @param {Integer} year
 * @param {Integer} month
 * @param {Integer} day
 * @return {Array} currentTimers
 */
function updateCurrentTimers(year, month, day) {
  currentTimers = getDayArray(year, month, day);
  return getCurrentTimers();
}

/**
 * Return timer with given id, or false if not found.
 * @param {String} id
 * @return {Object} timer if found, {Bool} false if not found.
 */
function findTimer(id) {
  const dayArray = getDayArrayById(id);
  if (dayArray) {
    const timer = dayArray.find((t) => t.id === id);
    if (timer) return timer;
  }
  return false;
}


router.post('/update', (req, res) => {
  const timerIndex = currentTimers.findIndex(((t) => t.id === req.body.id));
  currentTimers[timerIndex] = {...req.body};
  res.send(currentTimers[timerIndex]);
  console.log('update:', currentTimers[timerIndex]);
  saveSave();
  addToQueue('update', currentTimers[timerIndex]);
});

router.post('/add', (req, res) => {
  const p = req.body;
  updateCurrentTimers(...getYearMonthDay(new Date(p.start)));
  currentTimers.push({id: nanoid(), title: p.title,
                      start: p.start});
  res.send(currentTimers);
  console.log('new:', currentTimers[currentTimers.length - 1]);
  saveSave();
  addToQueue('new', currentTimers[currentTimers.length - 1]);
});

router.post('/delete', (req, res) => {
  console.log('delete', JSON.stringify(
    currentTimers.find((t) => t.id === req.body.id))); // temp
  addToQueue('delete', JSON.parse(JSON.stringify(
    currentTimers.find((t) => t.id === req.body.id))));
  tryDeleteObject(req.body.id, currentTimers);
  res.send({deleted: req.body.id});
  saveSave();
});

router.post('/duplicate', (req, res) => {
  const p = req.body;
  updateCurrentTimers(...getYearMonthDay(new Date(p.start)));
  const duplicateTimer = {id: nanoid(), title: p.title,
                          description: p.description,
                          start: p.start};
  currentTimers.push(duplicateTimer);
  res.send({duplicated: p.id, as: duplicateTimer.id});
  console.log('new (duplicate):', currentTimers[currentTimers.length - 1]);
  saveSave();
  addToQueue('new', currentTimers[currentTimers.length - 1]);
});

router.get('/countRunning', async (req, res) => {
  res.send(countRunning(await getQueue()).toString());
});


module.exports = {
  getCurrentTimers,
  updateCurrentTimers,
  findTimer,
  router,
};
