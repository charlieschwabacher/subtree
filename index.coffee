deepMerge = require './deep_merge'
isArray = Array.isArray

module.exports = 

  create: (inputData, onChange, historySize = 100) ->
    data = inputData
    batched = false
    undos = []
    redos = []

    class Cursor

      constructor: (@path = []) ->

      cursor: (path = []) ->
        new Cursor @path.concat path

      get: (path = []) ->
        target = data
        for key in @path.concat path
          target = target[key]
          return undefined unless target?
        target

      set: (path, value, silent = false) ->
        fullPath = @path.concat path
        newData = target = {}
        target[k] = v for k, v of data

        for key in fullPath.slice 0, -1
          updated = if isArray target[key] then [] else {}
          updated[k] = v for k, v of target[key]
          target = target[key] = updated

        target[fullPath.slice -1] = value

        update newData, silent

      merge: (data, silent) ->
        @set [], deepMerge(@get(), data), silent

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
