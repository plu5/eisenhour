import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';

import Timeline from './Timeline';
import Statistics from './Statistics';

/**
 * Main
 * @return {jsx}
 */
function Main() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Timeline/>}></Route>
        <Route path='statistics' element={<Statistics/>}></Route>
      </Routes>
    </Router>
  );
}

export default Main;
