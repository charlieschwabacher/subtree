const assert = require('assert')
const CursorCache = require('../src/cursor_cache')


describe('CursorCache', () => {

  const initialData = {
    a: {
      b: {
        c: 1,
        d: 2
      },
      e: [1, 2, 3]
    }
  }

  let cache = null



  beforeEach(() => {
    cache = new CursorCache(() => initialData)
  })


  describe('constructor', () => {
    it('should create an empty root node', () => {
      assert.equal(cache.root.size, 0)
    })
  })

  describe('#store and #get', () => {
    it('should store and retrieve a cached cursor', () => {
      const c1 = {path: ['a', 'b', 'c']}
      const c2 = {path: ['a', 'd', 'e']}
      const c3 = {path: ['a']}

      cache.store(c1)
      assert.equal(cache.get(['a', 'b', 'c']), c1)

      cache.store(c2)
      assert.equal(cache.get(['a', 'b', 'c']), c1)
      assert.equal(cache.get(['a', 'd', 'e']), c2)

      cache.store(c3)
      assert.equal(cache.get(['a', 'b', 'c']), c1)
      assert.equal(cache.get(['a', 'd', 'e']), c2)
      assert.equal(cache.get(['a']), c3)
    })
  })

  describe('#clearPath', () => {
    it('should clear all cursors along a path', () => {
      const c1 = {path: ['a']}
      const c2 = {path: ['a', 'b']}
      const c3 = {path: ['a', 'b', 'c']}
      const c4 = {path: ['a', 'e']}

      const cursors = [c1, c2, c3, c4]

      for (let cursor of cursors) cache.store(cursor)
      for (let cursor of cursors) assert.equal(cache.get(cursor.path), cursor)

      cache.clearPath(['a', 'b'])
      const cleared = [c1, c2]
      const uncleared = [c3, c4]

      for (let cursor of cleared) assert.equal(cache.get(cursor.path), undefined)
      for (let cursor of uncleared) assert.equal(cache.get(cursor.path), cursor)
    })

    it('should prune unnecessary nodes', () => {
      const c1 = {path: ['a', 'b', 'c']}
      cache.store(c1)

      assert.equal(cache.root.size, 1)
      assert.equal(cache.root.get('a').size, 1)
      assert.equal(cache.root.get('a').get('b').size, 1)
      assert.equal(cache.root.get('a').get('b').get('c').size, 1)
      assert.equal(cache.size(), 3)

      cache.clearPath(['a', 'b', 'c'])

      assert.equal(cache.root.size, 0)
      assert.equal(cache.size(), 0)
    })
  })

  describe('#clearObject', () => {
    it('should clear the path to and all paths within an object', () => {
      const c1 = {path: ['a']}
      const c2 = {path: ['a', 'b']}
      const c3 = {path: ['a', 'b', 'c']}
      const c4 = {path: ['a', 'b', 'd']}
      const c5 = {path: ['a', 'e']}

      const cursors = [c1, c2, c3, c4, c5]

      for (let cursor of cursors) cache.store(cursor)
      for (let cursor of cursors) assert.equal(cache.get(cursor.path), cursor)

      cache.clearObject(['a'], {b: {c: 1, d: 2, e: 3}})

      const cleared = [c1, c2, c3, c4]
      const uncleared = [c5]

      for (let cursor of cleared) assert.equal(cache.get(cursor.path), undefined)
      for (let cursor of uncleared) assert.equal(cache.get(cursor.path), cursor)
    })
  })


  describe('#spliceArray', () => {
    it('should clear a path to array and elements removed, shifting others', () => {
      const c1 = {path: ['a']}
      const c2 = {path: ['a', 'b']}
      const c3 = {path: ['a', 'e']}
      const c4 = {path: ['a', 'e', 0]}
      const c5 = {path: ['a', 'e', 1]}
      const c6 = {path: ['a', 'e', 2]}

      const cursors = [c1, c2, c3, c4, c5, c6]

      for (let cursor of cursors) cache.store(cursor)
      for (let cursor of cursors) assert.equal(cache.get(cursor.path), cursor)

      cache.spliceArray(['a', 'e'], 0, 1, 2)

      const cleared = [c1, c3, c4]

      for (let cursor of cleared) assert.equal(cache.get(cursor.path), undefined)
      assert.equal(cache.get(['a', 'b']), c2)
      assert.equal(cache.get(['a', 'e', 2]), c5)
      assert.equal(cache.get(['a', 'e', 3]), c6)
    })
  })


  describe('#size', () => {
    it('should count nodes in cache tree', () => {
      cache.store({path: ['a', 'b', 'c']})
      assert.equal(cache.size(), 3)

      cache.store({path: ['a', 'b', 'd']})
      assert.equal(cache.size(), 4)

      cache.store({path: ['a', 'e', 1]})
      assert.equal(cache.size(), 6)

      cache.store({path: ['a', 'e', 2]})
      assert.equal(cache.size(), 7)
    })
  })

})