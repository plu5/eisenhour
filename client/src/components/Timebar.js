import React, {useState} from 'react';

import SubmittableInput from './SubmittableInput';

/**
 * Timebar
 * @param {Object} props
 * @return {jsx}
 */
function Timebar(props) {
  const [value, setValue] = useState('');

  /**
   * onChange function for value to keep in sync with DOM
   * @param {event} event
   */
  function handleValueChange(event) {
    setValue(event.target.value);
  }

  /**
   * onSubmit function for adding new timer
   * @param {event} event
   */
  function handleSubmit(event) {
    event.preventDefault();
    props.addTimer(value);
    setValue('');
  }

  return (
    <div className="timebar">
      <SubmittableInput value={value}
                        placeholder="What are you working on?"
                        onChange={handleValueChange}
                        onSubmit={handleSubmit}/>
    </div>
  );
}

export default Timebar;
