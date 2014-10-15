Cursor = require './index'
assert = require 'assert'

root = null
initialData = a: b: c: 1, d: 2
Cursor.create initialData, (cursor) -> root = cursor


# test reading data

# identity of data remain the same
assert root.get() is initialData

# multiple gets should return references to the same object
assert root.get('a') is root.get('a')

# gets should return the values we expect
assert root.get(['a', 'b', 'c']) is 1
assert root.get(['a', 'b', 'd']) is 2


# test setting data

# setting data should work
root.set ['a', 'e'], 3
assert root.get(['a', 'e']) is 3

# after making changes below them, objects should no longer be equal
assert root.get() isnt initialData
assert root.get('a') isnt initialData.a

# unchanged objects should remain referentially equal
assert root.get(['a', 'b']) is initialData.a.b


# test creating cursors

# references to cursors should be cached so that two cursors w/ identical path
# will be referentially equal as long as thir target object is unchanged
assert root.cursor('a') is root.cursor('a')
assert root.cursor(['a', 'b']) is root.cursor('a').cursor('b')

# changes to the target of a cursor should clear its cached reference so that
# any new cursor sharing its path will no longer be referentially equal
cursor = root.cursor('a')
root.set ['a', 'e'], 4
assert root.cursor('a') isnt cursor


# test setting through cursors

# setting data through cursors should work
cursor = root.cursor ['a', 'e']
cursor.set [], 4
assert root.get(['a', 'e']) is 4

# setting data through cursors should clear cached cursor references
assert root.cursor(['a', 'e']) isnt cursor


# test setting and reading through multiple cursors

# setting through cursors should work as expected even if changes have been made
# to the underlying data after their creation
cursor1 = root.cursor ['a', 'b', 'c']
cursor2 = root.cursor ['a', 'b', 'd']
assert cursor1.get() is 1
assert cursor2.get() is 2
cursor1.set [], 5
assert cursor1.get() is 5
assert cursor2.get() is 2
cursor2.set [], 6
assert cursor1.get() is 5
assert cursor2.get() is 6
assert root.get(['a', 'b', 'c']) is 5
assert root.get(['a', 'b', 'd']) is 6


# test merging

# merging should set data as expected
root.merge {a: b: c: 8, d: 9}
assert root.get(['a', 'b', 'c']) is 8
assert root.get(['a', 'b', 'd']) is 9

# merging should not clear existing data
assert root.get(['a', 'e']) is 4

# merging should clear cached cursor references along changed paths
cursor1 = root.cursor ['a', 'b']
cursor2 = root.cursor ['a', 'e']
root.merge a: b: c: 10
assert root.cursor(['a', 'b']) isnt cursor1
assert root.cursor(['a', 'e']) is cursor2


# test clearing by setting root to empty object
root.set 'f', 11
root.set [], {}
assert root.get('a') is undefined
assert root.get('f') is undefined


# indicate that all tests have passed

console.log 'all good'
