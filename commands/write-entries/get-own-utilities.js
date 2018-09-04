/* eslint-disable no-console */

//---------//
// Imports //
//---------//

const tedent = require('tedent')

const { makeToUtilities } = require('./helpers')

const {
  getArrayOfValues,
  getValueAt,
  isLaden,
  join,
  keepWhen_object,
  lengthIsGreaterThan,
  map_array,
  map_object,
  passThrough,
  reduce_array,
} = require('../../helpers')

//
//------//
// Main //
//------//

const getOwnUtilities = (filesInLib, pathToLib) => {
  const toUtilities = makeToUtilities(pathToLib)

  return passThrough(filesInLib, [
    map_array(toUtilities),
    throwIfThereAreDuplicates,
  ])
}

//
//------------------//
// Helper Functions //
//------------------//

function throwIfThereAreDuplicates(utilities) {
  const keepWhen = keepWhen_object,
    reduce = reduce_array,
    map = map_object

  const nameToUtilities = reduce(createNameToUtilities, {})(utilities)

  const duplicates = keepWhen(lengthIsGreaterThan(1))(nameToUtilities)

  if (isLaden(duplicates)) {
    const duplicateMessage = passThrough(duplicates, [
      map(formatDuplicates),
      getArrayOfValues,
      join('\n\n'),
    ])

    const message = tedent(`
      You have duplicate utility names in your lib directory

      ${duplicateMessage}
    `)
    const error = new Error(message)
    error.justLogMessage = true
    throw error
  }

  return utilities
}

function createNameToUtilities(nameToUtilities, aUtility) {
  nameToUtilities[aUtility.name] = nameToUtilities[aUtility.name] || []
  nameToUtilities[aUtility.name].push(aUtility)
  return nameToUtilities
}

function formatDuplicates(duplicateUtilities) {
  const { name } = duplicateUtilities[0],
    formattedFiles = passThrough(duplicateUtilities, [
      map_array(getValueAt('fileName')),
      join('\n'),
    ])

  return tedent(`
    ${name} found at ./lib
      ${formattedFiles}
  `)
}

//
//---------//
// Exports //
//---------//

module.exports = getOwnUtilities
