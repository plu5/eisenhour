import React from 'react';

import './App.css';
import Timer from './Timer';

/**
 * React app
 * @return {jsx}
 */
function App() {
  return (
    <>
      <div>
        <h1>Eisenhour</h1>
      </div>
      <Timer title='test' description='test'/>
    </>
  );
}

export default App;
