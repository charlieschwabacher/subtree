# create and return a new object by recursively merging two source objects

isPlainObject = require './is_plain_object'

module.exports = deepMerge = (src, data) ->
  dst = if Array.isArray src then [] else {}

  for key of src
    dst[key] = src[key]

  for key of data
    if isPlainObject(data[key]) and isPlainObject(src[key])
      dst[key] = deepMerge src[key], data[key]
    else
      dst[key] = data[key]

  dst
