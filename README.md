cursor
======

cursor provides a way to read and update data using deep references and an immutable data structure


creating a cursor
-----------------

create a cursor by passing some initial data and an onChange callback

```coffeescript
Cursor.create initialData, (rootCursor, undo, redo) ->
```

Any objects passed in to the cursor will be frozen.  The `onChange` callback will be called one time initially and on each change to the data, passing a root cursor object and undo/redo callbacks.


using cursors
-------------

Cursor objects store a path through the root data object, and expose methods to read or update data at
their path or below it.

- `cursor(path = [])` - creates and returns a new subcursor appending the passed path to the current path
- `get(path = [])` - returns the value at path
- `set(path, value, silent = false)` - replaces the value at path with a new value.  if the optional *silent* argument is included, the changes will not be stored in the undo history
- `merge(data, silent = false)` - replaces the value at path with a new object created by deeply merging the current value and the provided argument
- `bind(path = [], pre = (v) -> v, silent = false)` - returns a setter function for the provided path.  If the optional pre argument is included, it will be composed with the setter to preproccess values.
- `batched(cb, silent = false)` - allows batched updates while running the onChange callback only one time.

Path arguments are flexible - they can be omitted to reference the value the cursor references directly,
they can be be a single string to reference a property of an object the cursor references, or an array of
strings to reach deep inside nested objects.
