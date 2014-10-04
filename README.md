cursor
======

cursor provides a way to read and update data using deep references and an immutable data structure


creating a cursor
-----------------

create a cursor by passing some initial data and an onChange callback

```coffeescript
Cursor.create initialData, (rootCursor) ->
```

The initialData object passed in to the cursor will be frozen.  The `onChange` callback will be called one time initially and on each change to the data, passing a root cursor object.  This callback is a great place to do something like render a React component.


using cursors
-------------

Cursor objects store a path through the root data object, and expose methods to read or update data at
their path or below it.

- `cursor(path)` - creates and returns a new subcursor appending the passed path to the current path

- `get(path)` - returns the value at path

- `set(path, value)` - replaces the value at path with a new value.  Objects passed to set are frozen.

- `merge(data)` - replaces the value at path with a new object created by deeply merging the current value and the provided argument

- `bind(path[, pre])` - returns a setter function for the provided path.  If the optional `pre` argument is included, it will be composed with the setter to preproccess values.

- `batched(cb[, silent])` - immediately runs a passed callback function.  Updates made inside the function will be batched and cause the onChange callback to run only once.

Path arguments are flexible - they can be omitted to reference the value the cursor references directly,
they can be be a single string to reference a property of an object the cursor references, or an array of
strings to reach deep inside nested objects.


an example
----------


```coffeescript
# creating an immutable data structure

initialData =
  user:
    id: 1
    name: 'Jane Smith'
    playcount: 5
  playlist:
    name: 'Jamz'
    songs: [
      {
        name: 'You Dropped A Bomb On Me'
        artist: 'The Gap Band'
      }, {
        name: 'We Dont Have To Take Our Clothes Off'
        artist: 'Jermaine Stewart'
      }
    ]
  
Cursor.create initialData, (root) ->
  React.renderComponent <Playlist data={root.cursor 'playlist'}/>, document.body
```  


```coffeescript
# reading data

root.get()
# returns the root javacsript object

root.get 'user'
# returns {id: 1, name: 'Jane Smith'}

root.get ['playlist', 'songs', 0, 'artist']
# returns 'The Gap Band'

playlistCursor = root.cursor 'playlist'
# creates a new cursor referencing the playlist object

playlistCursor.get 'name'
# returns 'Jamz'

songCursor = playlistCursor.cursor 0
# returns a new cursor referencing the song object from the playlist at index 0
```

  
```coffeescript
# updating data

root.get('user').playcount = 6
# THIS DOES NOTHING - playcount can't be modified because object has been frozen

root.set ['user', 'playcount'], 6
# sets user playcount to six

root.merge user: playcount: 7
# sets user playcount to seven

callback = root.bind ['user', 'name'], (v) -> v.toUpperCase()
callback 'Sam Smith'
# sets user name to 'SAM SMITH'

root.batched ->
  songs = root.get ['playlist', 'songs']
  newSong = name: 'Party All The Time', artist: 'Eddie Murphy'
  root.set ['playlist', 'songs'], songs.concat [newSong]
  root.set ['playlist', 'updatedAt'], new Date
# adds an updatedAt property and a new song to playlist in a single update
```
