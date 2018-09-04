//---------//
// Imports //
//---------//

const path = require('path'),
  tedent = require('tedent')

const {
  getDefaultIfEsModule,
  passThrough,
  requireEsm,
} = require('../../helpers')

//
//------//
// Main //
//------//

const inFesDirectoryRe = /\/fes-(preset-)?[^/]+$/

const inFesPresetRe = /\/fes-preset-[^/]+$/

const makeToUtilities = pathToLib => {
  const fes = requireEsm('fes')

  return fileName => {
    const pathToFile = path.resolve(pathToLib, fileName),
      definition = passThrough(pathToFile, [requireEsm, getDefaultIfEsModule])

    validateUtilityName(definition.name, pathToFile, fes)

    return {
      fileName,
      name: definition.name,
    }
  }
}

const requiredArgs = new Set()

const validArgs = new Set(['--ignore-warnings'])

//
//------------------//
// Helper Functions //
//------------------//

function validateUtilityName(name, pathToFile, fes) {
  const errorHeader = tedent(`
    The utility found at:
    ${pathToFile}
  `)

  if (!name) {
    const message = tedent(`
      ${errorHeader}

      does not declare a 'name'.  Please resolve all issues found via
      'fes checkup' before attempting to write entry files.
    `)

    const error = new Error(message)
    error.justLogMessage = true
    throw error
  }

  if (!fes._validUtilityNameRe.test(name)) {
    const message = tedent(`
      ${errorHeader}

      declares an invalid 'name'
        name: ${name}
        must pass the regex: ${fes._validUtilityNameRe}
    `)

    const error = new Error(message)
    error.justLogMessage = true
    throw error
  }
}

//
//---------//
// Exports //
//---------//

module.exports = {
  inFesDirectoryRe,
  inFesPresetRe,
  makeToUtilities,
  requiredArgs,
  validArgs,
}
