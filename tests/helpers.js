//------//
// Main //
//------//

//
// This is mainly used to map nested message objects
//
const mapStringLeaves = mapperFunction => baseObject => {
  return recursivelyMapStringLeaves(baseObject)

  // scoped helper function

  function recursivelyMapStringLeaves(anObject) {
    const keys = Object.keys(anObject),
      result = {}

    for (const aKey of keys) {
      const value = anObject[aKey]
      result[aKey] =
        typeof value === 'string'
          ? mapperFunction(value, aKey, anObject)
          : recursivelyMapStringLeaves(value)
    }

    return result
  }
}

const wrapMessage = message => `\n${message}\n\n\n`

//
//---------//
// Exports //
//---------//

module.exports = { mapStringLeaves, wrapMessage }
