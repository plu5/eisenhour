import React, {useState} from 'react';

/**
 * TodoItem
 * @param {Object} props
 * @param {Object} props.data todo item data
 * @param {String} props.data.text todo item text
 * @param {Bool} props.data.done todo item completion status
 * @param {Function} props.onCheckedChange called when the todo item gets
 *   checked/unchecked. Passes item data and checked status.
 * @param {Function} props.onSelfDestruct called when the todo item wants to be
 *   deleted. Passes item data.
 * @return {jsx}
 */
function TodoItem(props) {
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * onChange event handler for checkbox
   * @param {Object} e
   */
  function handleCheckedChange(e) {
    props.onCheckedChange(props.data, e.target.checked);
  }

  /**
   * Delete todo item
   */
  function selfDestruct() {
    props.onSelfDestruct(props.data);
  }

  return (
    <li key={props.data.id}
        className={props.data.done ? 'todo-li done': 'todo-li'}>
      <div className="todo-item">
        <label>
          <input className="todo-checkbox" type="checkbox"
                 checked={props.data.done} onChange={handleCheckedChange}/>
          {props.data.title}
        </label>
        {isDeleting ?
         <div>
           <span style={{color: 'darkred'}}>delete, are you sure?</span>
           <button onClick={selfDestruct}>v</button>
           <button onClick={() => setIsDeleting(false)}>x</button>
         </div> :
         <button className="todo-del-btn"
                 onClick={() => setIsDeleting(true)}>x</button>
         }
      </div>
    </li>
  );
}

export default TodoItem;
