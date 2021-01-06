import React, {useMemo, useState, useRef, useEffect} from 'react';
import {createEditor} from 'slate';
import {Slate, Editable, withReact} from 'slate-react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

export default function SyncingEditor() {
  const editor = useMemo(() => withReact(createEditor()), []);
  // Add the initial value when setting up our state.
  const [value, setValue] = useState(initialValue);
  const id = useRef(`${Date.now()}`);
  const editorRef = useRef(editor);
  const remote = useRef(false);

  useEffect(() => {
    socket.once('init-value', (value) => {
      setValue(value);
    });

    socket.on('new-remote-operations', ({editorId, ops}) => {
      if (id.current !== editorId) {
        remote.current = true;
        ops.forEach((op) => editorRef.current.apply(op));
        // NOTE(plu5): without the setTimeout bad things happen
        setTimeout(function() {
          remote.current = false;
        });
      }
    });

    // cleanup function
    return () => {
      socket.off('new-remote-operations');
    };
  }, []);

  return (
    <Slate editor={editor} value={value}
           onChange={(newValue) => {
             setValue(newValue);

             const ops = editor.operations
                   .filter((o) => {
                     if (o) {
                       return (
                         o.type !== 'set_selection' &&
                           o.type !== 'set_value'
                       );
                     }
                     return false;
                   });
             if (ops.length && remote.current === false) {
               socket.emit('new-operations', {editorId: id.current,
                                              ops,
                                              value: newValue});
             }
           }}>
      <Editable
        style={{
          backgroundColor: '#fafafa',
          maxWidth: 800,
          minHeight: 150,
        }}
        autoFocus/>
    </Slate>
  );
}

const initialValue = [
  {
    type: 'paragraph',
    children: [{text: 'A line of text in a paragraph.'}],
  },
];
