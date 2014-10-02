module.exports = deepFreeze = (o) ->

  Object.freeze o

  for prop in Object.getOwnPropertyNames o
    if o.hasOwnProperty(prop) and 
       o[prop]? and
       o instanceof Object and
       not Object.isFrozen o[prop]
      
      deepFreeze o[prop]
  
  o
