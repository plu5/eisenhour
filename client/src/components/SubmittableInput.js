import React from 'react';

/**
 * SubmittableInput
 * @param {Object} props
 * @return {jsx}
 */
function SubmittableInput(props) {
  return (
    <form autoComplete={props.autoComplete || 'on'}
          onSubmit={props.onSubmit}>
      <input name={props.name}
             value={props.value}
             placeholder={props.placeholder}
             onChange={props.onChange}
             style={props.style}/>
      <button type="submit" style={{display: 'none'}}/>
    </form>
  );
}

export default SubmittableInput;
