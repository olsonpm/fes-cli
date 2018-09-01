/* eslint-disable no-console */

//---------//
// Imports //
//---------//

const camelcase = require('camelcase'),
  path = require('path'),
  tedent = require('tedent')

const indexJsHeader = require('../index-js-header')

const {
  contains,
  discardAll,
  discardLast,
  discardWhen_array: discardWhen,
  isLaden,
  isString,
  join,
  jstring,
  keepFirst,
  map_array,
  map_object,
  mSet,
  passThrough,
  pFs,
  readFile,
  reduce_array,
  reduce_object,
  resolveAllProperties,
  truncateToNChars,
  truncateToNLines,
} = require('../../../helpers')

//
//------//
// Init //
//------//

const allowedConfigKeys = ['packages'],
  requiredConfigKeys = allowedConfigKeys,
  configBasename = './fes.config.js'

//
//------//
// Main //
//------//

const createPresetEntries = async ({ packageNames }) => {
  const wasCalledFromSiblingTool = !!packageNames

  if (!wasCalledFromSiblingTool) {
    // eslint-disable-next-line prefer-const
    const presetConfig = tryToGetPresetConfig()

    const errorOccurred = validateConfig(presetConfig)
    if (errorOccurred) return 1

    packageNames = presetConfig.packages || []
  }

  // we've got a good config wooooo

  const [indexJsTemplate, result, ownUtilities] = await Promise.all([
    readFile(path.resolve(__dirname, './index.js.hbs')),
    createPackageNameToLibFiles(packageNames),
    getOwnUtilities(),
  ])

  if (result.errorOccurred) return 1

  const { packageNameToLibFiles } = result,
    templateData = createTemplateData(packageNameToLibFiles, ownUtilities),
    handlebars = require('handlebars'),
    indexJsContents = handlebars.compile(indexJsTemplate)(templateData)

  await pFs.writeFile('index.js', indexJsContents)

  if (!wasCalledFromSiblingTool)
    console.log('your entry files were created successfully')
}

//
//------------------//
// Helper Functions //
//------------------//

function maybeCamelcase(utilName) {
  return contains('-')(utilName) ? camelcase(utilName) : utilName
}

//
// The template data is not simply a list of all the packages and utilities
//   because fes is built to allow packages and presets to override each other
//   per order of declaration.
//
function createTemplateData(packageNameToLibFiles, ownUtilities) {
  //
  // Because a preset shouldn't be exporting duplicate utilities, we create a
  //   'utility to module' hash which ensures we only keep the utilities
  //   that aren't overridden.
  //
  const utilityToPackage = reduce_object(createUtilityToPackage, {})(
    packageNameToLibFiles
  )

  const fesPackages = getFesPackages(utilityToPackage),
    allUtilities = Object.keys(utilityToPackage)

  return {
    allUtilities,
    fesPackages,
    indexJsHeader,
    ownUtilities,
  }
}

async function getOwnUtilities() {
  let files
  try {
    files = await pFs.readdir(path.resolve(process.cwd(), 'lib'))
  } catch (error) {
    return []
  }

  return removeExtensions(files)
}

function getFesPackages(utilityToPackage) {
  return reduce_object((fesPackages, packageName, utility) => {
    fesPackages[packageName] = fesPackages[packageName] || { utilities: [] }
    fesPackages[packageName].utilities.push(utility)
    return fesPackages
  }, {})(utilityToPackage)
}

function createUtilityToPackage(utilityToPackage, libFiles, packageName) {
  return libFiles.reduce(
    (result, utility) => mSet(utility, packageName)(result),
    utilityToPackage
  )
}

async function createPackageNameToLibFiles(packageNames) {
  let files

  try {
    files = await pFs.readdir('node_modules')
  } catch (error) {
    return handleReadNodeModulesDirError(error)
  }

  const missingPackages = discardAll(files)(packageNames)
  if (isLaden(missingPackages)) return handleMissingPackages(missingPackages)

  return passThrough(packageNames, [
    reduce_array((packageNameToLibFiles, name) => {
      packageNameToLibFiles[name] = readPackageLib(name)
      return packageNameToLibFiles
    }, {}),
    resolveAllProperties,
  ])
    .then(packageNameToLibFiles => ({
      packageNameToLibFiles: map_object(removeExtensions)(
        packageNameToLibFiles
      ),
    }))
    .catch(error => {
      const message = tedent(`
      an unexpected error occurred while trying to read your packages
        inside node_modules

      ${error.stack}
    `)

      console.error(`\n${message}\n`)

      return { errorOccurred: true }
    })
}

function removeExtensions(libFiles) {
  return map_array(fileName =>
    discardLast(path.extname(fileName).length)(fileName)
  )(libFiles)
}

//
// Each file under 'lib' is a utility
//
function readPackageLib(name) {
  return pFs.readdir(path.resolve('node_modules', name, 'lib'))
}

function tryToGetPresetConfig() {
  const cwd = process.cwd()

  let presetConfig

  try {
    presetConfig = require(path.resolve(cwd, configBasename))
  } catch (_unused_error) {} // eslint-disable-line no-empty

  if (!presetConfig) {
    try {
      presetConfig = require(path.resolve(cwd, 'package.json'))['fes']
    } catch (_unused_error) {} // eslint-disable-line no-empty

    presetConfig = presetConfig || {}
  }

  return presetConfig
}

function validateConfig(config) {
  const issues = [],
    givenKeys = Object.keys(config)

  const missingKeys = discardAll(givenKeys)(requiredConfigKeys)
  if (missingKeys.length) {
    issues.push(`missing keys: ${missingKeys.join(', ')}`)
  }

  const unexpectedKeys = discardAll(allowedConfigKeys)(givenKeys)
  if (unexpectedKeys.length) {
    const unexpectedKeysString = passThrough(unexpectedKeys, [
      truncateToNChars(30),
      join(', '),
    ])
    issues.push(`unexpected keys: ${unexpectedKeysString}`)
  }

  if (isLaden(issues)) return errorOutWithMessage(issues.join('\n'))

  const { packages } = config
  if (!Array.isArray(packages))
    return errorOutWithMessage("'packages' must pass Array.isArray")

  if (!packages.length)
    return errorOutWithMessage("'packages' must list at least one module")

  const invalidPackages = discardWhen(isString)(packages)
  if (invalidPackages.length) {
    const invalidPackagesString = passThrough(invalidPackages, [
      keepFirst(3),
      map_array(jstring),
      join('\n'),
      truncateToNLines(6),
    ])
    return errorOutWithMessage(
      tedent(`
        'packages' must contain only strings

        invalidPackages:
        ${invalidPackagesString}
      `)
    )
  }
}

function errorOutWithMessage(msg) {
  console.error(
    tedent(`
      '${configBasename}' is invalid

      ${msg}
    `)
  )
  return 1
}

function handleReadNodeModulesDirError(error) {
  let message

  if (error.code === 'ENOENT') {
    message = tedent(`
      The node_modules directory does not exist.

      Did you forget to run \`npm install\` ?
    `)
  } else {
    message = tedent(`
      I am unable to read the node_modules directory due to the following
        filesystem error code

      code: ${error.code}
    `)
  }

  console.error(`\n${message}\n`)

  return { errorOccurred: true }
}

function handleMissingPackages(packages) {
  const message = tedent(`
    the following packages don't seem to be installed

    ${packages.join(', ')}

    check to make sure they're listed in your package.json's dependencies and
      that you've ran \`npm install\`
  `)

  console.error(`\n${message}\n`)

  return { errorOccurred: true }
}

//
//---------//
// Exports //
//---------//

module.exports = createPresetEntries
