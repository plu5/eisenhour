import React from 'react';

import Timeline from './Timeline';
import Statistics from './Statistics';

/**
 * Main
 * @return {jsx}
 */
function Main() {
  return (
    <div className="container">
      <div className="container__main">
        <div className="container__left">
        </div>
        <div className="container__middle">
          <Timeline/>
        </div>
        <div className="container__right">
          <Statistics/>
        </div>
      </div>
    </div>
  );
}

export default Main;
