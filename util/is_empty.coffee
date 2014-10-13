# return true if an object has no properites, false otherwise

module.exports = (o) ->
  for k, v of o
    return false if o.hasOwnProperty k
  true
