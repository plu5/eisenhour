import React, {useState, useEffect} from 'react';
// import SyncingEditor from './SyncingEditor';
import io from 'socket.io-client';

const socket = io('http://localhost:3003');

/**
 * app
 */
function App() {
  const gapi = window.gapi;
  const DISCOVERY_DOCS =
        ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
  const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    socket.once('credentials', (credentials) => {
      if (signedIn) return;
      
      const {client_id, api_key} = credentials;

      gapi.load('client:auth2', () => {
        gapi.client.init({
          apiKey: api_key,
          clientId: client_id,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES
        }).then(function() {
          console.log('then');
          // gapi.client.load('calendar', 'v3', () => console.log('loaded calendar'));
          gapi.auth2.getAuthInstance().signIn()
            .then(() => {
              console.log('signed in');
              setSignedIn(true);
              // gapi.client.calendar.events.list({
              //   'calendarId': 'primary',
              //   'timeMin': (new Date()).toISOString(),
              //   'showDeleted': false,
              //   'singleEvents': true,
              //   'maxResults': 10,
              //   'orderBy': 'startTime'
              // }).then(function(response) {
              //   const events = response.result.items;
              //   console.log(events);
              // });
            });
        }, function(error) {
          console.error(error);
        });
      });
    });
  }, []);

  return (
    <div>
      <h1>Hello</h1>
    </div>
  );
}

export default App;
