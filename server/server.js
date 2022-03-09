const express = require('express');
const bodyParser = require('body-parser');

const authentication = require('./authentication');
const groups = require('./task-groups');
const timers = require('./timers');
const sync = require('./sync');
const {updateCurrentTimers} = require('./timers');

// Set up express
const app = express();
const port = process.env.PORT || 3003;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.listen(port, () => console.log(`Listening on port ${port}`));

// Routes
app.use('/authentication', authentication.router);
app.use('/groups', groups);
app.use('/timers', timers.router);
app.use('/sync', sync.router);

app.get('/day/:year-:month-:day', (req, res) => {
  const p = req.params;
  res.send(updateCurrentTimers(p.year, p.month, p.day));
});
