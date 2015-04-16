cursor
======

Cursor is a javascript library for reading from and updating an immutable data
structure.  It is designed w/ the following goals in mind:


- to provide a **simple, familiar, human friendly api** - working with immutable
data shouldn't be hard - cursors expose get, set, and merge which work exactly
as you would exepect them to.

- to **enforce immutability** - cursor uses Object.freeze on immutible data to
prevent bugs caused by unexpected changes.

- to **work well with**, but **avoid coupling to react.js** - data can easily be
shared between react and other parts of an app, or between multiple top level
react components in different parts of a page.

- to be **'pure render' friendly** - cursor objects are cached so that any two
cursors pointing to the same object will be referentially equal, allowing them
to work with react's pure render mixin.



creating a cursor
-----------------

create a cursor by passing some initial data and an onChange callback

```javascript
Cursor.create(initialData, function(rootCursor) { ... })
```

The initialData object passed in to the cursor will be frozen.  The `onChange`
callback will be called one time initially and any time the data is changed.
If you are using Cursor with React, this callback is a great place to render
components.



using cursors
-------------

Cursor objects store a path through the root data object, and expose methods to
read or update data at their path or below it.

**Cursor API**:

- `cursor(path)` - creates and returns a new subcursor appending the path
argument to the cursor's current path. References to cursors are cached so that
two cursors w/ identical path will be referentially equal as long as thir
target object is unchanged.

- `get(path)` - returns the value at path

- `set(path, value)` - replaces the value at path with a new value.  Objects
passed to set are frozen.

- `has(path)` - returns true if there is a value at path that is not null or
undefined

- `delete(path)` - deletes the value at path

- `merge(data)` - replaces the value at path with a new object created by deeply
merging the current value and the provided argument

- `bind(path[, pre])` - returns a setter function for the provided path.  If the
optional `pre` argument is included, it will be composed with the setter to
preproccess values.


**Array only methods**:

(these throw errors if the value at their path is not an array)

- `splice(path, start, deleteCount, ...elements)` - similar to Array.splice,
this inserts or deletes from the array at path.

- `push(path, value)` - adds a value to the end of the array at path.

- `pop(path)` - removes the value from the end of the array at path, and returns
it.

- `unshift(path, value)` - adds a value to the beginning of the array at path.

- `shift(path)` - removes and returns the value from the beginning of the array
at path.



Path arguments are flexible - they can be omitted to reference the value the
cursor references directly, they can be be a single string to reference a
property of an object the cursor references, or an array of strings to reach
deep inside nested objects.



an example
----------

```javascript
// creating an immutable data structure

initialData = {
  user: {
    id: 1,
    name: 'Jane Smith',
    playcount: 5
  },
  playlist: {
    name: 'Jamz',
    songs: [
      {
        name: 'You Dropped A Bomb On Me',
        artist: 'The Gap Band'
      }, {
        name: 'We Dont Have To Take Our Clothes Off',
        artist: 'Jermaine Stewart'
      }
    ]
  }
}

Cursor.create(initialData, function(root) {
  React.render(<Playlist data={root.cursor('playlist')}/>, document.body)
})
```


```javascript
// reading data

root.get()
// returns the root javacsript object

root.get('user')
// returns {id: 1, name: 'Jane Smith'}

root.get(['playlist', 'songs', 0, 'artist'])
// returns 'The Gap Band'

var playlistCursor = root.cursor('playlist')
// creates a new cursor referencing the playlist object

playlistCursor.get('name')
// returns 'Jamz'

songCursor = playlistCursor.cursor(0)
// returns a new cursor referencing the song object from the playlist at index 0
```


```javascript
// updating data

root.get('user').playcount = 6
// THIS DOES NOT WORK - playcount can't be modified because object has been
// frozen.  In strict mode this will throw an error.

root.set(['user', 'playcount'], 6)
// sets user playcount to six

root.merge(user: playcount: 7)
// sets user playcount to seven

var callback = root.bind(['user', 'name'], function(v) {return v.toUpperCase()})
callback('Kenny G')
// sets user name to 'KENNY G'

root.push(['playlist', 'songs'], {
  name: 'Buffalo Stance',
  artist: 'Neneh Cherry'
})
// adds a song to the end of the songs array
```
