import React, {useState, useCallback, useEffect} from 'react';

import {getTodoList, add, update, del} from '../api/TodosAPI';
import TodoItem from './TodoItem';


/**
 * Todos
 * @param {Object} props
 * @param {Date} props.date
 * @return {jsx}
 */
function Todos(props) {
  const [items, setItems] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const _update = useCallback(async () =>
    setItems(await getTodoList(props.date)), [props.date]);

  useEffect(() => {
    console.log('Todos: update todos data useEffect');
    _update();
  }, [props.date, _update]);

  /**
   * Add new todo list item
   * @param {String} title
   */
  async function addTodo(title) {
    const res = await add(title);
    setItems(res);
  }

  /**
   * onChange event handler for item input
   * @param {Object} e
   */
  function handleInputChange(e) {
    setInputValue(e.target.value);
  }

  /**
   * onKeyUp event handler for item input
   * @param {Object} e
   */
  function handleInputKeyUp(e) {
    if (e.keyCode === 13 && inputValue) {
      const lines = inputValue.split('\n');
      for (const line of lines) if (line) addTodo(line);
      setInputValue('');
    }
  }

  /**
   * Update items when a todo item is checked/unchecked
   * @param {Object} item data
   * @param {Bool} checked
   */
  async function handleTodoItemCheckedChange(item, checked) {
    const res = await update({...item, done: checked});
    setItems(res);
  }

  /**
   * Delete a todo item
   * @param {Object} item data
   */
  async function deleteItem(item) {
    const res = await del(item.id);
    setItems(res);
  }

  return (
    <div className="todos">
      <ul>
        {items.map((item) => (
          <TodoItem key={item.id} data={item}
                    onCheckedChange={handleTodoItemCheckedChange}
                    onSelfDestruct={deleteItem}/>
        ))}
        <textarea className="add-todo"
                  placeholder="Add an item"
                  data-autosize="true"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyUp={handleInputKeyUp}>
        </textarea>
      </ul>
    </div>
  );
}

export default Todos;
