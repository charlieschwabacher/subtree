# recursively call Object.freeze on an object and its properties

module.exports = deepFreeze = (o) ->
  for prop in Object.getOwnPropertyNames o
    if (
      o.hasOwnProperty(prop) and
      o[prop]? and
      (typeof o[prop] is 'object' or typeof o[prop] is 'function') and
      not Object.isFrozen o[prop]
    )
      deepFreeze o[prop]

  Object.freeze o
