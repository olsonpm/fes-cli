//---------//
// Imports //
//---------//

const indexJsHeader = require('./index-js-header')

const {
  discardWhen_array,
  discardWhen_object,
  flatten,
  getArrayOfValues,
  getValueAt,
  isEmpty,
  keepWhen_array,
  map_array,
  map_object,
  mAppendAll,
  passThrough,
  reduce_object,
} = require('../../helpers')

//
//------//
// Main //
//------//

//
// At this point 'packageNameToUtilities' is all package names listed in the fes
//   config.  We still need to remove the overridden utilities and remove any
//   resulting unused packages.
//
const createTemplateData = (packageNameToUtilities, ownUtilities) => {
  packageNameToUtilities = accountForOverrides(
    packageNameToUtilities,
    ownUtilities
  )

  const map = map_array

  const allUtilityNames = passThrough(packageNameToUtilities, [
    getArrayOfValues,
    flatten,
    mAppendAll(ownUtilities),
    map(getValueAt('name')),
  ])

  return {
    allUtilityNames,
    indexJsHeader,
    ownUtilities,
    packageNameToUtilities,
  }
}

//
// Here we first reduce all the packageNameToUtilities to utilityName to package
//   names.  With that info we can remove the overridden utilities and resulting
//   empty packages.
//
function accountForOverrides(packageNameToUtilities, ownUtilities) {
  const discardWhen = discardWhen_object,
    map = map_object,
    utilityNameToPackage = reduce_object(createUtilityNameToPackage, {})(
      packageNameToUtilities
    ),
    keepIntersectingUtilities = makeKeepIntersectingUtilities(
      utilityNameToPackage
    ),
    removeOwnUtilities = makeRemoveOwnUtilities(ownUtilities)

  return passThrough(packageNameToUtilities, [
    map(keepIntersectingUtilities),
    map(removeOwnUtilities),
    discardWhen(isEmpty),
  ])
}

function makeRemoveOwnUtilities(ownUtilities) {
  const map = map_array,
    discardWhen = discardWhen_array,
    setOfOwnUtilityNames = new Set(map(getValueAt('name'))(ownUtilities)),
    isOverridden = ({ name }) => setOfOwnUtilityNames.has(name)

  return utilities => discardWhen(isOverridden)(utilities)
}

function makeKeepIntersectingUtilities(utilityNameToPackage) {
  const keepWhen = keepWhen_array

  return (utilities, packageName) => {
    const doesIntersect = ({ name }) =>
      utilityNameToPackage[name] === packageName

    return keepWhen(doesIntersect)(utilities)
  }
}

function createUtilityNameToPackage(
  utilityNameToPackage,
  utilities,
  packageName
) {
  return utilities.reduce((result, utility) => {
    result[utility.name] = packageName
    return result
  }, utilityNameToPackage)
}

//
//---------//
// Exports //
//---------//

module.exports = createTemplateData
