/* eslint-disable no-console */

//---------//
// Imports //
//---------//

const path = require('path'),
  tedent = require('tedent')

const {
  alwaysReturn,
  discardAll,
  discardWhen,
  isString,
  join,
  jstring,
  keepFirst,
  makeApproveHasNoArguments,
  map,
  mSet,
  passThrough,
  reduce_object,
  resolveAllProperties,
  truncateToNChars,
  truncateToNLines,
} = require('../helpers')

//
//------//
// Init //
//------//

const allowedConfigKeys = ['modules'],
  requiredConfigKeys = allowedConfigKeys,
  configBasename = './fes-preset-config.js',
  thisShouldntHappen = getThisShouldntHappen()

//
//------//
// Main //
//------//

const approveHasNoArguments = makeApproveHasNoArguments('createPresetEntry')

createPresetEntry.approveArguments = approveHasNoArguments

function createPresetEntry(modules) {
  try {
    const wasCalledFromSiblingTool = !!modules

    if (!modules) {
      // eslint-disable-next-line prefer-const
      let { exitCode, presetConfig } = tryToGetPresetConfig()
      if (exitCode) return Promise.resolve(exitCode)

      exitCode = validateConfig(presetConfig)
      if (exitCode) return Promise.resolve(exitCode)

      modules = presetConfig.modules
    }

    // we've got a good config wooooo

    const pify = require('pify'),
      pFs = pify(require('fs'))

    return Promise.all([
      pFs.readFile('./preset-entry.hbs'),
      readModuleDirectories(pFs, modules),
    ])
      .then(([template, moduleToLibFiles]) => {
        const templateData = createTemplateData(moduleToLibFiles),
          handlebars = require('handlebars')

        const result = handlebars.compile(template, { strict: true })(
          templateData
        )

        return pFs.writeFile('index.js', result)
      })
      .then(() => {
        if (!wasCalledFromSiblingTool) {
          console.log('done!')
        }
      })
      .catch(alwaysReturn(1))
  } catch (error) {
    return handleUnexpectedError(error)
  }
}

//
//------------------//
// Helper Functions //
//------------------//

//
// The template data is not simply a list of all the modules and utilities
//   because fes is built to allow modules and presets to override each other
//   per the order of declaration.
//
function createTemplateData(moduleToLibFiles) {
  //
  // Because a preset shouldn't be exporting duplicate utilities, we create a
  //   'utility to module' hash which we can then use to remove the unused
  //   utilities in modules which get overridden.
  //
  const utilityToModule = reduce_object(createUtilityToModule, {})(
    moduleToLibFiles
  )

  const fesModules = getFesModules(utilityToModule)

  const allUtilities = Object.keys(utilityToModule)

  return {
    allUtilities,
    fesModules,
  }
}

function getFesModules(utilityToModule) {
  return reduce_object((fesModules, moduleName, utility) => {
    fesModules[moduleName] = fesModules[moduleName] || { utilities: [] }
    fesModules[moduleName].utilities.push(utility)
    return fesModules
  }, {})(utilityToModule)
}

function createUtilityToModule(utilityToModule, libFiles, moduleName) {
  return libFiles.reduce(
    (result, utility) => mSet(utility, moduleName)(result),
    utilityToModule
  )
}

function readModuleDirectories(pFs, modules) {
  //
  // Each file under 'lib' is a utility
  //
  const readModuleLib = name =>
    pFs.readdir(path.resolve('node_modules', name, 'lib'))

  return pFs
    .readdir('node_modules')
    .catch(error => {
      console.error(
        tedent(`
          The node_modules directory does not exist

          ${thisShouldntHappen}
        `)
      )
      return Promise.reject(error)
    })
    .then(() =>
      resolveAllProperties(modules.reduce(createModuleNameToLibFiles, {}))
    )
    .catch(error => {
      console.error(
        tedent(`
          One or more of the modules listed in your fes-preset config does not
            exist in the node_modules directory.

          ${thisShouldntHappen}
        `)
      )
      return Promise.reject(error)
    })

  // helper functions scoped to 'readModuleDirectories'

  function createModuleNameToLibFiles(moduleNameToLibFiles, name) {
    return mSet(name, readModuleLib(name))(moduleNameToLibFiles)
  }
}

function handleUnexpectedError(error) {
  console.error(
    tedent(`
      An unexpected error occurred while creating the preset

      ${error}
    `)
  )
  return Promise.resolve(1)
}

function tryToGetPresetConfig() {
  const cwd = process.cwd()

  let exitCode, presetConfig

  try {
    presetConfig = require(path.resolve(cwd, configBasename))
  } catch (_unused_error) {} // eslint-disable-line no-empty

  if (!presetConfig) {
    try {
      presetConfig = require(path.resolve(cwd, 'package.json'))['fes-preset']
    } catch (_unused_error) {} // eslint-disable-line no-empty

    if (!presetConfig) {
      console.error(
        tedent(`
          A preset config could not be found.  The following were tried:

          1. ${configBasename}
          2. 'fesPreset' property under ./package.json
        `)
      )
      exitCode = 1
    }
  }

  return { exitCode, presetConfig }
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

  if (issues) return errorOutWithMessage(issues.join('\n'))

  const { modules } = config
  if (!Array.isArray(modules))
    return errorOutWithMessage("'modules' must pass Array.isArray")

  if (!modules.length)
    return errorOutWithMessage("'modules' must list at least one module")

  const invalidModules = discardWhen(isString)(modules)
  if (invalidModules.length) {
    const invalidModulesString = passThrough(invalidModules, [
      keepFirst(3),
      map(jstring),
      join('\n'),
      truncateToNLines(6),
    ])
    return errorOutWithMessage(
      tedent(`
        'modules' must contain only strings

        invalidModules:
        ${invalidModulesString}
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

function getThisShouldntHappen() {
  return tedent(`
    This shouldn't happen if you're using this tool as intended so please
      raise an issue on github and explain how you got here so I can fix
      my documentation.  I want this tool to be simple to use :)
  `)
}

//
//---------//
// Exports //
//---------//

module.exports = createPresetEntry
