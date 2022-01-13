import React from 'react';

/**
 * SubmittableInput
 * @param {Object} props
 * @return {jsx}
 */
function SubmittableInput(props) {
  const InputType = props.multiline || false ? 'textarea' : 'input';

  /**
   * Submit on enter
   * @param {Object} event
   */
  function handleSubmitKey(event) {
    if (event.keyCode === 13 && event.shiftKey === false) {
      event.preventDefault();
      props.onSubmit(event);
    }
  }

  return (
    <form autoComplete={props.autoComplete || 'on'}
          onSubmit={props.onSubmit}>
      <InputType name={props.name}
                 title={props.title}
                 value={props.value}
                 placeholder={props.placeholder}
                 onChange={props.onChange}
                 onKeyDown={handleSubmitKey}
                 style={props.style}/>
      <button type="submit" style={{display: 'none'}}/>
    </form>
  );
}

export default SubmittableInput;
