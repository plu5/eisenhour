const fs = require('fs');
const express = require('express');

const {tryDeleteObject} = require('./utils');
const {getSave} = require('./save');
const statistics = require('./statistics');

const router = new express.Router();

let groups = [];
const groupsSaveFilePath = 'task-groups.json';

// Load groups save, create if doesn’t exist
if (!fs.existsSync(groupsSaveFilePath)) {
  fs.writeFileSync(groupsSaveFilePath, '[]', (err) => {
    if (err) return console.log('Error creating groups save:', err);
  });
}
fs.readFile(groupsSaveFilePath, (err, content) => {
  if (err) return console.log('Error loading groups save:', err);
  groups = JSON.parse(content);
});

/**
 * Save groups save file
 */
function saveGroups() {
  fs.writeFile(groupsSaveFilePath, JSON.stringify(groups, null, 2), (err) => {
    if (err) return console.log('Error saving save:', err);
  });
}

router.get('/', (req, res) => {
  res.send(groups);
});

router.post('/update', (req, res) => {
  const groupIndex = groups.findIndex(((g) => g.name === req.body.name));
  if (groupIndex === -1) {
    groups.push(req.body);
  } else {
    groups[groupIndex] = req.body;
  }
  res.send(groups);
  saveGroups();
});

router.post('/delete', (req, res) => {
  tryDeleteObject(req.body.name, groups, 'name');
  res.send({deleted: req.body.name});
  saveGroups();
});

router.get('/statistics/:year', async (req, res) => {
  const p = req.params;
  const matchers = {};
  for (const group of groups) {
    matchers[group.name] = group.matchers;
  }
  console.log(matchers);
  const tallies = statistics.talliesForYear(p.year, await getSave(), matchers);
  console.log(tallies);
  res.send(tallies);
});

module.exports = router;
