const express = require('express');
const bodyParser = require('body-parser');

const groups = require('./task-groups');
const timers = require('./timers');
const todos = require('./todos');
const sync = require('./sync');
const {updateCurrentTimers} = require('./timers');

// Set up express
const app = express();
const port = process.env.PORT || 3003;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.listen(port, () => console.log(`Listening on port ${port}`));

// Routes
app.use('/groups', groups);
app.use('/timers', timers.router);
app.use('/todos', todos.router);
app.use('/sync', sync.router);

app.get('/day/:year-:month-:day', (req, res) => {
  const p = req.params;
  res.send(updateCurrentTimers(p.year, p.month, p.day));
});
