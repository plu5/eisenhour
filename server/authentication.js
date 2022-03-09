const fs = require('fs');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const {google} = require('googleapis');

const secrets = require('./secrets');
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  // Next ones are needed for passportjs to compute the profile
  'profile',
  'email'
];

let access;
const accessFilePath = 'access.json';

const router = new express.Router();
router.use(session({
  secret: secrets.get('EXPRESS_SECRET'),
  resave: false,
  saveUninitialized: true,
}));

passport.use(
  'google-authentication',
  new GoogleStrategy(
    {
      clientID: secrets.get('GOOGLE_CLIENT_ID'),
      clientSecret: secrets.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: 'http://localhost:3003/authentication/google/callback',
      passReqToCallback: true
    },
    // save_token
    (req, accessToken, refreshToken, profile, done) => {
      req.session.accessToken = accessToken;
      req.session.refreshToken = refreshToken;
      fs.writeFileSync(accessFilePath, JSON.stringify(
        {access_token: accessToken,
         refresh_token: refreshToken}), (err) => {
           if (err) return console.log('Error saving access:', err);
      });
      return done(null, profile);
    }
  )
);

router.get('/google',
  passport.authenticate('google-authentication', {
    scope: GOOGLE_SCOPES,
    accessType: 'offline',
    prompt: 'consent',
    session: false
  })
);
router.get('/google/callback',
  passport.authenticate('google-authentication', {
    failureRedirect: 'http://localhost:3003',
    session: false
  }), (req, res) => res.redirect('/authentication/good')
);

router.get('/good', (req, res) => {
  const calendar = getCalendar();
  res.send(calendar);
});

/**
 * Use existing auth tokens to connect to google and give me a calendar object.
 * @return {Promise}
 */
async function getCalendar() {
  return new Promise((resolve) => {
    const oAuth2Client = new google.auth.OAuth2(
      secrets.get('GOOGLE_CLIENT_ID'), secrets.get('GOOGLE_CLIENT_SECRET'));
    // oAuth2Client.setCredentials(req.session.accessToken);
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
  router,
  getCalendar
};
