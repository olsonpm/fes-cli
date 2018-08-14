//---------//
// Imports //
//---------//

const pify = require('pify'),
  tedent = require('tedent')

const { EOL } = require('os')

//
//------//
// Init //
//------//

const pFs = pify(require('fs'))

//
//------//
// Main //
//------//

const alwaysReturn = something => () => something

const assignOver = objectToAssignOver => primaryObject =>
  Object.assign({}, objectToAssignOver, primaryObject)

const discardAll = arrayOrSet => fullArray => {
  const setToDiscard = new Set(arrayOrSet),
    result = []

  for (const element of fullArray) {
    if (!setToDiscard.has(element)) result.push(element)
  }

  return result
}

const discardFirst = n => stringOrArray => stringOrArray.slice(n)

const discardPreceding = maybeStartsWithThis => {
  const shouldDiscardFrom = startsWith(maybeStartsWithThis),
    discardPrecedingFrom = discardFirst(maybeStartsWithThis.length)

  return fullString => {
    return shouldDiscardFrom(fullString)
      ? discardPrecedingFrom(fullString)
      : fullString
  }
}

const discardWhen = predicate => fromArray => {
  const result = []

  for (let i = 0; i < fromArray.length; i += 1) {
    const element = fromArray[i]
    if (!predicate(element, i, fromArray)) result.push(element)
  }

  return result
}

const endsWith = mightEndWith => fullString =>
  fullString.slice(-mightEndWith.length) === mightEndWith

const fromPairs = anArray =>
  anArray.reduce((res, [key, val]) => mSet(key, val)(res), {})

const handleUnexpectedError = error => {
  // eslint-disable-next-line no-console
  console.error(
    tedent(`
      An unexpected error occurred while creating the preset

      ${error}
    `)
  )
  return Promise.resolve(1)
}

const isFalsey = something => !something

const isString = something => typeof something === 'string'

const join = separator => aSetOrArray => {
  const anArray = aSetOrArray instanceof Set ? [...aSetOrArray] : aSetOrArray

  return anArray.join(separator)
}

const jstring = something => {
  const replacer = makeReplacer()

  return '' + JSON.stringify(something, replacer, 2)
}

const keepFirst = n => anArray => anArray.slice(0, n)

const keepWhen_array = predicate => anArray => anArray.filter(predicate)

const keepWhen_object = predicate => anObject => {
  const result = {}

  for (const key of Object.keys(anObject)) {
    const value = anObject[key]
    if (predicate(value, key, anObject)) result[key] = value
  }

  return result
}

const makeApproveHasNoArguments = command => {
  return function approveHasNoArguments(commandArgs) {
    if (!commandArgs.length) return

    return (
      tedent(`
        The command '${command}' has no arguments

        arguments provided: ${truncateToNChars(30)(commandArgs)}
      `) + '\n'
    )
  }
}

const map = mapperFn => anArray => anArray.map(mapperFn)

const mapKeys = mapperFunction => anObject =>
  reduce_object((result, value, key) => {
    const newKey = mapperFunction(key, value, anObject)
    result[newKey] = value
    return result
  }, {})(anObject)

const map_object = mapperFunction => anObject =>
  reduce_object(
    (result, value, key) => mSet(key, mapperFunction(value))(result),
    {}
  )(anObject)

const mMap = mapperFn => anArray => {
  for (let i = 0; i < anArray.length; i += 1) {
    anArray[i] = mapperFn(anArray[i], i, anArray)
  }

  return anArray
}

const mSet = (key, value) => anObject => {
  anObject[key] = value
  return anObject
}

const passThrough = (arg, arrayOfFunctions) =>
  arrayOfFunctions.reduce((result, aFunction) => aFunction(result), arg)

const readFile = filepath => pFs.readFile(filepath, 'utf8')

const reduce_object = (reducerFunction, start) => anObject => {
  return Array.prototype.reduce.call(
    Object.keys(anObject),
    (result, key) => reducerFunction(result, anObject[key], key, anObject),
    start
  )
}

const resolveAll = arrayOfPromises => Promise.all(arrayOfPromises)

const resolveAllProperties = anObject =>
  passThrough(anObject, [
    toPairs,
    mMap(resolveAll),
    resolveAll,
    then(fromPairs),
  ])

const returnFirstArgument = something => something

const split = separator => aString => aString.split(separator)

const startsWith = mightStartWith => fullString =>
  fullString.slice(0, mightStartWith.length) === mightStartWith

const then = callThis => aPromise => aPromise.then.call(aPromise, callThis)

const toArgumentsObject = (arrayOfArguments, validArgumentNames) => {
  const argumentsObject = {},
    validArgumentNamesString = [...validArgumentNames].join(', ')

  for (let i = 0; i < arrayOfArguments.length; i += 1) {
    const maybeArgumentName = arrayOfArguments[i]
    if (!startsWith('--')(maybeArgumentName)) {
      return {
        errorMessage: tedent(`
          expected an argument name and instead got '${maybeArgumentName}'

          allowed names: ${validArgumentNamesString}
          arguments given: ${truncateToNChars(30)(arrayOfArguments.join(' '))}
        `),
      }
    }

    if (!validArgumentNames.has(maybeArgumentName)) {
      return {
        errorMessage: tedent(`
          unexpected argument name given '${maybeArgumentName}'

          allowed names: ${validArgumentNamesString}
        `),
      }
    }

    const name = maybeArgumentName,
      maybeArgumentValue = arrayOfArguments[i + 1],
      valueIsBoolean =
        maybeArgumentValue === undefined ||
        startsWith('--')(maybeArgumentValue),
      value = valueIsBoolean || maybeArgumentValue

    argumentsObject[name] = value

    if (!valueIsBoolean) i += 1
  }

  return { argumentsObject }
}

const toPairs = obj => mMap(aKey => [aKey, obj[aKey]])(Object.keys(obj))

const transformProperties = transforms => anObject => {
  return reduce_object((result, value, key) => {
    const aTransform = transforms[key]
    result[key] = aTransform ? aTransform(value, key, anObject) : value
    return result
  }, {})(anObject)
}

const truncateToNChars = n => aString => {
  const resultArray = []

  let i = 0

  while (i < aString.length && resultArray.length < n) {
    if (!isControlCharacter(aString[i])) resultArray.push(aString[i])
    i += 1
  }

  const result = resultArray.join('')

  return result.length === n ? result + '...' : result
}

const truncateToNLines = n => aString => {
  const { lines, moreLinesExist } = getFirstNLines(n)(aString)
  if (moreLinesExist) lines.push('...')

  return lines.join(EOL)
}

//
//------------------//
// Helper Functions //
//------------------//

function makeReplacer() {
  //
  // I'm choosing to use 'replacer' because I don't like 'utils.inspect'.
  //   To solve the problem of circular json structures, I'm just keeping track
  //   of all objects added.  I think I actually prefer this because it provides
  //   both a more concise and acurate structure of the data.
  //
  const duplicateObjects = new Map()

  return (key, value) => {
    if (value && typeof value === 'object') {
      if (duplicateObjects.has(value)) {
        return `<duplicate of '${duplicateObjects.get(value)}'>`
      } else {
        duplicateObjects.set(value, key)
        return value
      }
    }
    return typeof value === 'function' ? '<function>' : value
  }
}

function getFirstNLines(numberOfLinesToGet) {
  return aString => {
    const lines = ['']

    let i = 0,
      numLinesReached = false

    while (!numLinesReached && i < aString.length) {
      const currentCharacter = aString[i],
        nextCharacter = aString[i + 1]

      if (isNewline(currentCharacter, nextCharacter)) {
        if (currentCharacter === '\r') i += 1

        numLinesReached = lines.length === numberOfLinesToGet
        if (!numLinesReached) lines.push('')
      } else lines[lines.length - 1] += aString[i]

      i += 1
    }

    return {
      lines,
      moreLinesExist: numLinesReached,
    }
  }
}

function isNewline(currentCharacter, nextCharacter) {
  return (
    currentCharacter === '\n' ||
    (currentCharacter === '\r' && nextCharacter === '\n')
  )
}

//
// based off this msdn documentation
// https://msdn.microsoft.com/en-us/library/18zw7440(v=vs.110).aspx#Anchor_1
//
function isControlCharacter(aChar) {
  const charCode = aChar.charCodeAt(0)
  return (
    (charCode >= 0 && charCode <= 31) || (charCode >= 127 && charCode <= 159)
  )
}

//
//---------//
// Exports //
//---------//

module.exports = {
  alwaysReturn,
  assignOver,
  discardAll,
  discardFirst,
  discardPreceding,
  discardWhen,
  endsWith,
  fromPairs,
  handleUnexpectedError,
  isFalsey,
  isString,
  join,
  jstring,
  keepFirst,
  keepWhen_array,
  keepWhen_object,
  makeApproveHasNoArguments,
  map,
  mapKeys,
  map_object,
  mMap,
  mSet,
  passThrough,
  readFile,
  reduce_object,
  resolveAll,
  resolveAllProperties,
  returnFirstArgument,
  split,
  startsWith,
  then,
  toArgumentsObject,
  toPairs,
  transformProperties,
  truncateToNChars,
  truncateToNLines,
}
