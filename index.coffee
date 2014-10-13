deepFreeze = require './util/deep_freeze'
deepMerge = require './util/deep_merge'
Cache = require './cache'


module.exports =

  create: (inputData, onChange, historySize = 100) ->
    cache = new Cache
    data = deepFreeze inputData
    batched = false
    undos = []
    redos = []


    # declare cursor class w/ access to mutable reference to data in closure
    class Cursor

      constructor: (@path = []) ->

      cursor: (path = []) ->
        fullPath = @path.concat path

        return cached if (cached = cache.get fullPath)?

        cursor = new Cursor fullPath
        cache.store cursor
        cursor

      get: (path = []) ->
        target = data
        for key in @path.concat path
          target = target[key]
          return undefined unless target?
        target

      modifyAt: (path, modifier, silent) ->
        fullPath = @path.concat path

        newData = target = {}
        target[k] = v for k, v of data

        for key in fullPath.slice 0, -1
          updated = if Array.isArray target[key] then [] else {}
          updated[k] = v for k, v of target[key]
          target[key] = updated
          Object.freeze target
          target = target[key]

        modifier target, fullPath.slice -1
        Object.freeze target

        cache.clearPath fullPath
        update newData, silent

      set: (path, value, silent = false) ->
        @modifyAt path, (target, key) ->
          target[key] = value
        , silent

      delete: (path, silent = false) ->
        @modifyAt path, (target, key) ->
          delete target[key]
        , silent

      merge: (data, silent = false) ->
        cache.clearObject data
        update deepMerge(@get(), deepFreeze data), silent

      bind: (path, pre) ->
        (v, silent) => @set path, (if pre then pre(v) else v), silent

      batched: (cb, silent = false) ->
        batched = true
        cb()
        batched = false
        update data, silent



    undo = ->
      return unless undos.length > 0
      redos.push data
      redos.shift() if redos.length > historySize
      data = undos.pop()
      onChange new Cursor(), undo, redo

    redo = ->
      return unless redos.length > 0
      undos.push data
      undos.shift() if undos.length > historySize
      data = redos.pop()
      onChange new Cursor(), undo, redo



    update = (newData, silent = false) ->
      unless silent or batched
        undos.push data
        undos.shift() if undos.length > historySize

      data = newData
      onChange new Cursor(), undo, redo unless batched


    # perform callback one time to start
    onChange new Cursor(), undo, redo
