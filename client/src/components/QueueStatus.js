import React, {useState, useEffect} from 'react';

import {subscribe} from '../api/TimerAPI';

/**
 * QueueStatus
 * @param {Object} props
 * @param {bool} props.syncing whether a sync is in progress
 * @return {jsx}
 */
function QueueStatus(props) {
  const [count, setCount] = useState('0');

  /**
   * Update status
   */
  async function updateStatus() {
    setCount(props.syncing ? '⌛' : await fetchCount());
  }

  subscribe(updateStatus);

  useEffect(() => {
    updateStatus();
  });

  return (
    <div className="queue-status">
      <span title="# of updates due to sync up"
            style={{color: count === '0' ? 'white' : 'green'}}>
        {count}
      </span>
    </div>
  );
}


/**
 * Get count of running timers from server
 * @return {Integer} count of running timers
 */
async function fetchCount() {
  const response = await fetch('sync/countQueue');
  return response.text();
}

export default QueueStatus;
