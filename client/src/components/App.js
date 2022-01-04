import React from 'react';

import './App.css';
import Main from './Main';

/**
 * React app
 * @return {jsx}
 */
function App() {
  // maybe could have a customisable message user could have in the title
  // like “you better work bitch”
  return (
    <>
      <div>
        <h1 style={{'textAlign': 'center'}}>Eisenhour</h1>
      </div>
      <Main/>
    </>
  );
}

export default App;
