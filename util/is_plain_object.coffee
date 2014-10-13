# return true if an object is a plain object {}, false otherwise

module.exports = (o) ->
  o? and toString.call(o) is '[object Object]'
