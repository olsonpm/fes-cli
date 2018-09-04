//---------//
// Imports //
//---------//

const path = require('path'),
  tedent = require('tedent')

const { makeToUtilities } = require('./helpers')

const {
  discardAll,
  isEmpty,
  isLaden,
  map_array,
  passThrough,
  pFs,
  reduce_array,
  resolveAllProperties,
} = require('../../helpers')

//
//------//
// Main //
//------//

const createPackageNameToUtilities = async packageNames => {
  if (isEmpty(packageNames)) return { packageNameToUtilities: {} }

  let files

  try {
    files = await pFs.readdir('node_modules')
  } catch (error) {
    throwReadNodeModulesDirError(error)
  }

  const missingPackages = discardAll(files)(packageNames)
  if (isLaden(missingPackages)) throwMissingPackagesError(missingPackages)

  try {
    return passThrough(packageNames, [
      reduce_array((packageNameToUtilities, name) => {
        packageNameToUtilities[name] = createUtilities(name)
        return packageNameToUtilities
      }, {}),
      resolveAllProperties,
    ]).then(packageNameToUtilities => ({ packageNameToUtilities }))
  } catch (error) {
    const message = tedent(`
      an unexpected error occurred while trying to read your packages
        inside node_modules

      ${error.message}
    `)

    error.message = `\n${message}\n`
    throw error
  }
}

//
//------------------//
// Helper Functions //
//------------------//

//
// Each file under 'lib' is a utility
//
async function createUtilities(packageName) {
  const pathToLib = path.resolve('node_modules', packageName, 'lib'),
    toUtilities = makeToUtilities(pathToLib)

  let filesInLib

  try {
    filesInLib = await pFs.readdir(pathToLib)
  } catch (error) {
    error.message = tedent(`
      Unable to read the 'lib' directory for package '${packageName}'

      pathToLib: ${pathToLib}

      original file system error: ${error.message}
    `)

    throw error
  }

  return map_array(toUtilities)(filesInLib)
}

function throwReadNodeModulesDirError(error) {
  let message

  if (error.code === 'ENOENT') {
    message = tedent(`
      The node_modules directory does not exist.

      Did you forget to run \`npm install\` ?
    `)
  } else {
    message = tedent(`
      I am unable to read the node_modules directory due to the following
        filesystem error

      ${error}
    `)
  }

  error.message = message
  error.justLogMessage = true
  throw error
}

function throwMissingPackagesError(packages) {
  const message = tedent(`
    the following packages don't seem to be installed

    ${packages.join(', ')}

    make sure they're listed in your package.json's dependencies and that
    you've ran \`npm install\`
  `)

  const error = new Error(message)
  error.justLogMessage = true
  throw error
}

//
//---------//
// Exports //
//---------//

module.exports = createPackageNameToUtilities
