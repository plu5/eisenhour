import React, {useState, useEffect, useRef, useCallback} from 'react';

import SubmittableInput from './SubmittableInput';

/**
 * Task Group react component
 * @param {Object} props
 * @return {jsx}
 */
function TaskGroup(props) {
  const [isEditing, setIsEditing] = useState(props.edit ? true : false);
  const [data, setData] = useState({
    name: props.name,
    matchers: props.matchers,
    colour: props.colour
  });
  const [editValues, setEditValues] = useState({...data});

  // to help avoid running the update hook unnecessarily
  const firstRenderRef = useRef(true);
  const isFirstRender = useCallback(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return true;
    }
  }, [firstRenderRef]);

  // Update server when data changes
  useEffect(() => {
    if (isFirstRender()) return;
    fetch('groups/update', {
      method: 'post',
      body: JSON.stringify(data),
      headers: {'Content-Type': 'application/json'},
    })
      .then((res) => res.json())
      .then((json) => console.log(json));
  }, [data, isFirstRender]);

  /**
   * onChange function for edit values to keep in sync with DOM
   * @param {Object} event
   */
  function handleEditValuesChange(event) {
    setEditValues({...editValues, [event.target.name]: event.target.value});
  }

  /**
   * Curried onChange function for matcher edit values to keep in sync with DOM
   * @param {Integer} index of matcher
   * @return {Function}
   */
  const handleMatcherValueChange = (index) => (event) => {
    const newEditValues = {...editValues};
    newEditValues.matchers[index] = event.target.value;
    setEditValues(newEditValues);
  };

  /**
   * Add matcher
   */
  function addMatcher() {
    const newEditValues = {...editValues};
    newEditValues.matchers.push('');
    setEditValues(newEditValues);
  }

  /**
   * Curried function to delete a matcher with given index
   * @param {Integer} index of matcher
   * @return {Function}
   */
  const deleteMatcher = (index) => () => {
    const newEditValues = {...editValues};
    newEditValues.matchers = [...newEditValues.matchers.slice(0, index),
                              ...newEditValues.matchers.slice(index + 1)];
    setEditValues(newEditValues);
  };

  /**
   * onSubmit function for updating data with the edited values, but not if the
   *  name or matchers fields are empty
   * @param {Object} event
   */
  function handleSubmit(event) {
    event.preventDefault();

    if (editValues.name.length === 0) return;
    // FIXME: now that matchers is a list i guess i need to check each ones, or
    //  at least remove the empty ones
    if (editValues.matchers[0].length === 0) return;
    // TODO: Also check that the name doesn’t already exist, as this is what
    //  is being used as id and has to be unique
    // TODO: Validate regex

    setData({...editValues});
    setIsEditing(false);
  }

  /**
   * When user cancels editing, revert to old values
   */
  function handleCancel() {
    setEditValues({...data});
    setIsEditing(false);
  }

  /**
   * Delete self
   */
  function selfDestruct() {
    fetch('groups/delete', {
      method: 'post',
      body: JSON.stringify({name: data.name}),
      headers: {'Content-Type': 'application/json'},
    })
      .then((res) => res.json())
      .then((json) => {
        console.log(json);
        props.update();
      });
  }

  return (
    <div className="task-group">
      {isEditing ?
       <>
         <SubmittableInput
           onChange={handleEditValuesChange}
           onSubmit={handleSubmit}
           autoComplete="off"
           name="name" placeholder="name"
           value={editValues.name}/>
         {editValues.matchers.map((matcher, index) => (
           <span key={index}>
             <br/>
             <SubmittableInput
               onChange={handleMatcherValueChange(index)}
               onSubmit={handleSubmit}
               autoComplete="off"
               name="matcher" placeholder="matcher"
               value={matcher}/>
             {index > 0 ?
              <button onClick={deleteMatcher(index)}>x</button> : <></>}
           </span>
         ))}
         <button onClick={addMatcher}>+</button>
         <SubmittableInput
           onChange={handleEditValuesChange}
           onSubmit={handleSubmit}
           autoComplete="off"
           name="colour" placeholder="colour"
           value={editValues.colour}/>
         <button onClick={handleSubmit}>v</button>
         <button onClick={handleCancel}>x</button>
         <button onClick={selfDestruct}>delete</button>
       </> :
       <button onClick={() => setIsEditing(true)}
               style={{backgroundColor: data.colour}}>
         {data.name}
       </button>
      }
    </div>
  );
}

export default TaskGroup;
