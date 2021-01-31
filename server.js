const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');

let timerData = [{id: 0, title: 'test title one', description: 'description 1',
                  startTime: new Date(), endTime: new Date()},
                 {id: 1, title: 'test title two', description: 'description 2',
                  startTime: new Date(), endTime: new Date()},
                 {id: 2, title: 'timer that hasn’t started'},
                 {id: 3, title: 'timer in progress', startTime: new Date()}];

// Set up express and io
const app = module.exports.app = express();
const port = process.env.PORT || 3003;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
const server = app.listen(port, () => console.log(`Listening on port ${port}`));
const io = module.exports.io = require('socket.io')(server);

io.on('connection', function(socket) {
  console.log('a user connected');
  // Load client secrets from a local file.
  // fs.readFile('credentials.json', (err, content) => {
  //   if (err) return console.log('Error loading client secret file:', err);
  //   // Pass on to client
  //   io.emit('credentials', JSON.parse(content).web);
  // });
});

app.get('/timerData', (req, res) => {
  res.send(timerData);
});

app.post('/timerData', (req, res) => {
  timerData = {...req.body};
  res.send(timerData);
});

app.post('/timerUpdate', (req, res) => {
  const timerIndex = timerData.findIndex(((t) => t.id === req.body.id));
  timerData[timerIndex] = {...req.body};
  res.send(timerData[timerIndex]);
  console.log(timerData[timerIndex]);
});
