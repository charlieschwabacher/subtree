const assert = require('assert')
const Subtree = require('../src/subtree')



describe('Subtree', () => {

  const initialData = {
    a: {
      b: {
        c: 1,
        d: 2
      },
      e: [1, 2, 3]
    }
  }


  let root = null
  let handle = null


  beforeEach(() => {
    handle = Subtree.create(initialData, (_root) => { root = _root })
  })


  it('should inherit(from an exposed class', () => {
    assert(root instanceof Subtree.Cursor)
  })

  it('should trigger its callback immediately', () => {
    let count = 0
    Subtree.create({}, () => { count += 1 })
    assert.equal(count, 1)
  })

  it('should trigger a callback only once for multiple changes', (done) => {
    let root = null
    let count = 0

    Subtree.create({}, (_root) => {
      count += 1
      root = _root
    })

    assert.equal(count, 1)

    root.set('a', 1)
    root.set('b', 2)
    root.set('c', 3)

    setTimeout(() => {
      assert.equal(count, 2)
      done()
    })
  })

  it('should work with an array as root node', () => {
    let root = null
    let count = 0

    Subtree.create([], (_root) => {
      count += 1
      root = _root
    })

    assert.equal(count, 1)

    root.push(1)
    assert.deepEqual(root.get(), [1])

    setTimeout(() => {
      assert.equal(count, 2)
    })
  })

  describe('#get', () => {
    it('should preserve identity of data', () => {
      assert.equal(root.get(), initialData)
    })

    it('should return references to the same object', () => {
      assert.equal(root.get('a'), root.get('a'))
    })

    it('should return expected values', () => {
      assert.equal(root.get(['a', 'b', 'c']), 1)
      assert.equal(root.get(['a', 'b', 'd']), 2)
    })
  })

  describe('#set', () => {
    it('should set root value when called with one argument', () => {
      root.set(7)
      assert.equal(root.get(), 7)
      assert.equal(root.get(['a', 'b', 'c']), undefined)
    })

    it('should set at path when called with two arguments', () => {
      root.set(['a', 'e'], 3)
      assert.equal(root.get(['a', 'e']), 3)
    })

    it('should replace parent objects', () => {
      root.set(['a', 'e'], 3)
      assert.notEqual(root.get(), initialData)
      assert.notEqual(root.get('a'), initialData.a)
    })

    it('should not replace objects that are not in path of changes', () => {
      root.set(['a', 'e'], 3)
      assert.equal(root.get(['a', 'b']), initialData.a.b)
    })

    it('should clear keys below an object when set', () => {
      root.set('f', 11)
      root.set([], {})
      assert.equal(root.get('a'), undefined)
      assert.equal(root.get('f'), undefined)
    })
  })

  describe('#cursor', () => {
    // references to cursors should be cached so that two cursors w/ identical
    // path will be referentially equal if their target object is unchanged
    it('should cache refrences to cursors', () => {
      assert.equal(root.cursor('a'), root.cursor('a'))
      assert.equal(root.cursor(['a', 'b']), root.cursor('a').cursor('b'))
    })

    // changes to the target of a cursor should clear its cached reference so
    // that a new cursor sharing its path will no longer be referentially equal
    it('should clear cached cursors when a value is changed', () => {
      const cursor = root.cursor('a')
      root.set(['a', 'e'], 4)
      assert.notEqual(root.cursor('a'), cursor)
    })

    // cache keys for values at different paths should not collide
    it('works when two cursors point to equal values', () => {
      root.set(['a', 'b', 'c'], 2)
      const c1 = root.cursor(['a', 'b', 'd'])
      const c2 = root.cursor(['a', 'b', 'c'])
      assert.notEqual(c1, c2)
    })
  })

  describe('#push', () => {
    it('should append a value to the end of an array', () => {
      root.push(['a', 'e'], 4)
      assert.deepEqual(root.get(['a', 'e']), [1, 2, 3, 4])
    })

    it('should accept a single argument', () => {
      root.cursor(['a', 'e']).push(4)
      assert.deepEqual(root.get(['a', 'e']), [1, 2, 3, 4])
    })

    it('should throw an error if the target is not an array', () => {
      assert.throws(() => root.push(['a', 'b'], 4))
    })

    it('should clear cached cursors along changed paths', () => {
      const cursor = root.cursor('a')
      root.push(['a', 'e'], 4)
      assert.notEqual(root.cursor('a'), cursor)
    })
  })

  describe('#pop', () => {
    it('should remove a value from the end of an array', () => {
      const val = root.pop(['a', 'e'])
      assert.equal(val, 3)
      assert.deepEqual(root.get(['a', 'e']), [1, 2])
    })

    it('should work without arguments', () => {
      const val = root.cursor(['a', 'e']).pop()
      assert.equal(val, 3)
      assert.deepEqual(root.get(['a', 'e']), [1, 2])
    })

    it('should throw an error if the target is not an array', () => {
      assert.throws(() => root.pop(['a', 'b']))
    })

    it('should clear cached cursors along changed paths', () => {
      const cursor = root.cursor('a')
      root.pop(['a', 'e'])
      assert.notEqual(root.cursor('a'), cursor)
    })
  })

  describe('#unshift', () => {
    it('should prepend a value to the beginning of an array', () => {
      root.unshift(['a', 'e'], 0)
      assert.deepEqual(root.get(['a', 'e']), [0, 1, 2, 3])
    })

    it('should accept a single argument', () => {
      root.cursor(['a', 'e']).unshift(0)
      assert.deepEqual(root.get(['a', 'e']), [0, 1, 2, 3])
    })

    it('should throw an error if the target is not an array', () => {
      assert.throws(() => root.unshift(['a', 'b'], 0))
    })

    it('should clear cached cursors along changed paths', () => {
      const cursor1 = root.cursor('a')
      root.unshift(['a', 'e'], 0)
      assert.notEqual(root.cursor('a'), cursor1)

      // elements in the array have all moved back by one index
      const cursor2 = root.cursor(['a', 'e', 1])
      root.unshift(['a', 'e'], 0)
      assert.notEqual(root.cursor(['a', 'e', 1]), cursor2)
      assert.equal(root.cursor(['a', 'e', 2]), cursor2)
    })
  })

  describe('#shift', () => {
    it('should remove a value from the beginning of an array', () => {
      const val = root.shift(['a', 'e'])
      assert.equal(val, 1)
      assert.deepEqual(root.get(['a', 'e']), [2, 3])
    })

    it('should work without arguments', () => {
      const val = root.cursor(['a', 'e']).shift()
      assert.equal(val, 1)
      assert.deepEqual(root.get(['a', 'e']), [2, 3])
    })

    it('should throw an error if the target is not an array', () => {
      assert.throws(() => root.shift(['a', 'b']))
    })

    it('should clear cached cursors along changed paths', () => {
      const cursor1 = root.cursor('a')
      root.shift(['a', 'e'])
      assert.notEqual(root.cursor('a'), cursor1)

      // elements in the array have all moved forward by one index
      const cursor2 = root.cursor(['a', 'e', 1])
      root.shift(['a', 'e'])
      assert.notEqual(root.cursor(['a', 'e', 1]), cursor2)
      assert.equal(root.cursor(['a', 'e', 0]), cursor2)
    })
  })

  describe('#splice', () => {
    it('should insert values into an array', () => {
      root.splice(['a', 'e'], 1, 0, 1, 2)
      assert.deepEqual(root.get(['a', 'e']), [1, 1, 2, 2, 3])
    })

    it('should delete values from an array', () => {
      root.splice(['a', 'e'], 1, 2)
      assert.deepEqual(root.get(['a', 'e']), [1])
    })

    it('should replace values in an array', () => {
      root.splice(['a', 'e'], 1, 2, 4, 5)
      assert.deepEqual(root.get(['a', 'e']), [1, 4, 5])
    })

    it('should throw an error if the target is not an array', () => {
      assert.throws(() => root.splice(['a', 'b'], 1, [1, 2]))
    })

    it(`should not clear cursor for other elements when replacing an element
       in the array`, () => {
      const cursor1 = root.cursor(['a', 'e', 0])
      const cursor2 = root.cursor(['a', 'e', 1])
      const cursor3 = root.cursor(['a', 'e', 2])
      root.splice(['a', 'e'], 1, 1, 8)
      assert.equal(root.cursor(['a', 'e', 0]), cursor1)
      assert.notEqual(root.cursor(['a', 'e', 1]), cursor2)
      assert.equal(root.cursor(['a', 'e', 2]), cursor3)
    })

    it(`should clear cursors for following but not preceding elements when
       adding an element to the array`, () => {
      const cursor1 = root.cursor(['a', 'e', 0])
      const cursor2 = root.cursor(['a', 'e', 1])
      const cursor3 = root.cursor(['a', 'e', 2])
      root.splice(['a', 'e'], 1, 1, 5, 6)
      assert.equal(root.cursor(['a', 'e', 0]), cursor1)
      assert.notEqual(root.cursor(['a', 'e', 1]), cursor2)
      assert.notEqual(root.cursor(['a', 'e', 2]), cursor3)
    })

    it(`should clear cursors for following but not preceding elements when
       removing an element from the array`, () => {
      const cursor1 = root.cursor(['a', 'e', 0])
      const cursor2 = root.cursor(['a', 'e', 1])
      const cursor3 = root.cursor(['a', 'e', 2])
      root.splice(['a', 'e'], 1, 1)
      assert.equal(root.cursor(['a', 'e', 0]), cursor1)
      assert.notEqual(root.cursor(['a', 'e', 1]), cursor2)
      assert.notEqual(root.cursor(['a', 'e', 2]), cursor3)
    })
  })


  describe('#merge', () => {
    it('should set multiple keys at once', () => {
      root.merge({a: {b: {c: 8, d: 9}}})
      assert.equal(root.get(['a', 'b', 'c']), 8)
      assert.equal(root.get(['a', 'b', 'd']), 9)
    })

    it('should not clear existing data', () => {
      root.set(['a', 'e'], 4)
      assert.equal(root.get(['a', 'e']), 4)
      assert.equal(root.get(['a', 'b', 'c']), 1)
    })

    it('should clear cached cursors along changed paths', () => {
      assert.equal(handle.cache().size(), 0, 'cache should initially be empty')

      const cursor1 = root.cursor(['a', 'b'])
      const cursor2 = root.cursor(['a', 'e'])

      assert.equal(handle.cache().size(), 3, 'we have stored 3 nodes')

      root.merge({a: {b: {c: 10}}})

      // the cursor at ['a', 'e'] should still be cached, meaning 2 nodes
      assert.equal(handle.cache().size(), 2, '[a, e] should still be cached')

      assert.notEqual(root.cursor(['a', 'b']), cursor1, 'should be cleared')
      assert.equal(root.cursor(['a', 'e']), cursor2, 'should be cached')
    })
  })

  describe('setting data through subcursors', () => {
    it('should set data in the global object', () => {
      const cursor = root.cursor(['a', 'e'])
      cursor.set([], 4)
      assert.equal(root.get(['a', 'e']), 4)
    })

    it('should clear cached cursors when a value is changed', () => {
      const cursor = root.cursor(['a', 'e'])
      cursor.set([], 4)
      assert.notEqual(root.cursor(['a', 'e']), cursor)
    })
  })

  describe('multiple cursors', () => {
    // setting through cursors should work as expected even if changes have been
    // made to the underlying data after their creation
    it('should set data when root object has changed', () => {
      const cursor1 = root.cursor(['a', 'b', 'c'])
      const cursor2 = root.cursor(['a', 'b', 'd'])
      assert.equal(cursor1.get(), 1)
      assert.equal(cursor2.get(), 2)
      cursor1.set([], 5)
      assert.equal(cursor1.get(), 5)
      assert.equal(cursor2.get(), 2)
      cursor2.set([], 6)
      assert.equal(cursor1.get(), 5)
      assert.equal(cursor2.get(), 6)
      assert.equal(root.get(['a', 'b', 'c']), 5)
      assert.equal(root.get(['a', 'b', 'd']), 6)
    })

    it('should work with multiple instances', () => {
      let root1 = null
      let root2 = null

      Subtree.create({a: 1}, (_root) => { root1 = _root })
      Subtree.create({a: 2}, (_root) => { root2 = _root })

      assert.equal(root1.get('a'), 1)
      assert.equal(root2.get('a'), 2)

      root1.set('a', 3)

      assert.equal(root1.get('a'), 3)
      assert.equal(root2.get('a'), 2)
    })
  })

  describe('creating an empty cursor', () => {
    it('should create a cursor with null root node', () => {
      Subtree.create(null, (_root) => { root = _root })
      assert.equal(root.get(), null)
    })
  })

})
