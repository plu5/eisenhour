import React, {useState, useCallback, useEffect, useRef} from 'react';

import {getTodoList, add, update, del, swap} from '../api/TodosAPI';
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
   * Add new todo list items
   * @param {Array} titles: array of strings
   */
  async function addTodos(titles) {
    let res;
    for (const title of titles) res = await add(title);
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
      const toAdd = [];
      for (const line of lines) if (line) toAdd.push(line);
      addTodos(toAdd);
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

  const dragItemId = useRef(null);
  const dragOverItemId = useRef(null);

  const indexFromId = (id) => items.findIndex((item) => item.id === id);

  /**
   * Swap positions of two items
   * @param {String} id1 : id of item 1
   * @param {String} id2 : id of item 2
   */
  function swapItems(id1, id2) {
    setItems((items) => {
      const items_ = [...items];
      items_.splice(indexFromId(id2), 0,
                    items_.splice(indexFromId(id1), 1)[0]);
      return items_;
    });
  }

  /**
   * Todo item onDrop event handler
   */
  function handleItemDrop() {
    swapItems(dragItemId.current, dragOverItemId.current);
    swap(dragItemId.current, dragOverItemId.current);
  }

  return (
    <div className="todos">
      <span className="todos-info"
            title={items.filter((item) => item.done === true).length + '/' +
                   items.length + ' done'}>
        {items.length === 0 ? 'No' : items.length} items in day’s todo list
      </span>
      <ul>
        {items.map((item) => (
          <TodoItem key={item.id} data={item}
                    onCheckedChange={handleTodoItemCheckedChange}
                    onSelfDestruct={deleteItem}
                    onDragStart={(e) => dragItemId.current = item.id}
                    onDragEnter={(e) => dragOverItemId.current = item.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={handleItemDrop}/>
        ))}
      </ul>
      <textarea className="add-todo"
                placeholder="Add an item"
                data-autosize="true"
                value={inputValue}
                onChange={handleInputChange}
                onKeyUp={handleInputKeyUp}>
      </textarea>
    </div>
  );
}

export default Todos;
