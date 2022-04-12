const fs = require('fs');
const {google} = require('googleapis');

const secrets = require('./secrets');


let access;
const accessFilePath = 'access.json';


/**
 * Use existing auth tokens to connect to google and give me a calendar object.
 * @return {Promise}
 */
async function getCalendar() {
  return new Promise((resolve) => {
    const oAuth2Client = new google.auth.OAuth2(
      secrets.get('GOOGLE_CLIENT_ID'), secrets.get('GOOGLE_CLIENT_SECRET'));
    fs.readFile(accessFilePath, (err, content) => {
      if (err) return console.log('Error loading save:', err);
      access = JSON.parse(content);
      oAuth2Client.setCredentials(access);
      const calendar = google.calendar({version: 'v3', auth: oAuth2Client});

      oAuth2Client.on('tokens', (tokens) => {
        console.log('new tokens:', tokens);
        access.access_token = tokens.access_token;
        fs.writeFile(accessFilePath, JSON.stringify(access, null, 2), (err) => {
            if (err) return console.log('Error saving save:', err);
          });
      });

      resolve(calendar);
    });
  });
}

module.exports = {
  getCalendar,
};
