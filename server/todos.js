const fs = require('fs');
const express = require('express');
const nanoid = require('nanoid').nanoid;

const {tryDeleteObject} = require('./utils');
const {getDayArray} = require('./save-structure');


const router = new express.Router();

let currentTodos = [];
let todosSave = null;
const todosSaveFilePath = 'todos.json';

// Load todos save, create if doesn’t exist
if (!fs.existsSync(todosSaveFilePath)) {
  fs.writeFileSync(todosSaveFilePath, '{}', (err) => {
    if (err) return console.log('Error creating todos save:', err);
  });
}
fs.readFile(todosSaveFilePath, (err, content) => {
  if (err) return console.log('Error loading todos save:', err);
  todosSave = JSON.parse(content);
});

/**
 * Save todos save file
 */
function saveTodos() {
  fs.writeFile(todosSaveFilePath, JSON.stringify(todosSave, null, 2), (err) => {
    if (err) return console.log('Error saving todos save:', err);
  });
}

/**
 * Update currentTodos to array in todosSave.year.month.day and return it.
 * @param {Integer} year
 * @param {Integer} month
 * @param {Integer} day
 * @return {Array} currentTodos
 */
function updateCurrentTodos(year, month, day) {
  currentTodos = getDayArray(year, month, day, todosSave);
  return currentTodos;
}

const indexFromId = (id) => currentTodos.findIndex((item) => item.id === id);

/**
 * Swap positions of two items
 * @param {String} id1 : id of item 1
 * @param {String} id2 : id of item 2
 */
function swapItems(id1, id2) {
  currentTodos.splice(indexFromId(id2), 0,
                      currentTodos.splice(indexFromId(id1), 1)[0]);
}


router.post('/', (req, res) => {
  const p = req.body;
  res.send(updateCurrentTodos(p.year, p.month, p.day));
});

router.post('/add', (req, res) => {
  const p = req.body;
  currentTodos.push({id: nanoid(), title: p.title, done: false});
  res.send(currentTodos);
  saveTodos();
});

router.post('/update', (req, res) => {
  const p = req.body;
  const todoItemIndex = currentTodos.findIndex((t) => t.id === p.id);
  currentTodos[todoItemIndex] = {...p};
  res.send(currentTodos);
  saveTodos();
});

router.post('/delete', (req, res) => {
  const p = req.body;
  tryDeleteObject(p.id, currentTodos);
  res.send(currentTodos);
  saveTodos();
});

router.post('/swap', (req, res) => {
  const p = req.body;
  swapItems(p.id1, p.id2);
  res.send(currentTodos);
  saveTodos();
});


module.exports = {router};
