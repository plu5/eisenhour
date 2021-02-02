import React, {useState} from 'react';

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
      <form onSubmit={handleSubmit}>
        <input placeholder="What are you working on?"
               value={value}
               onChange={handleValueChange}/>
        <button type="submit" style={{display: 'none'}}/>
      </form>
    </div>
  );
}

export default Timebar;
