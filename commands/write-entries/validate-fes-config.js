//---------//
// Imports //
//---------//

const tedent = require('tedent')

const { configBasename } = require('./helpers')

const {
  discardAll,
  discardWhen_array,
  isLaden,
  isString,
  join,
  jstring,
  keepFirst,
  map_array,
  passThrough,
  truncateToNChars,
  truncateToNLines,
} = require('../../helpers')

//
//------//
// Init //
//------//

const allowedConfigKeys = ['packages'],
  requiredConfigKeys = allowedConfigKeys

//
//------//
// Main //
//------//

const validateFesConfig = (config, configBasename) => {
  const throwErrorWithConfigMessage = makeThrowErrorWithConfigMessage(
    configBasename
  )

  const issues = [],
    givenKeys = Object.keys(config)

  const missingKeys = discardAll(givenKeys)(requiredConfigKeys)
  if (missingKeys.length) {
    issues.push(`missing keys: ${missingKeys.join(', ')}`)
  }

  const unexpectedKeys = discardAll(allowedConfigKeys)(givenKeys)
  if (unexpectedKeys.length) {
    const unexpectedKeysString = passThrough(unexpectedKeys, [
      map_array(truncateToNChars(30)),
      join(', '),
    ])
    issues.push(`unexpected keys: ${unexpectedKeysString}`)
  }

  if (isLaden(issues)) throwErrorWithConfigMessage(issues.join('\n'))

  const { packages } = config
  if (!Array.isArray(packages))
    throwErrorWithConfigMessage("'packages' must pass Array.isArray")

  if (!packages.length)
    throwErrorWithConfigMessage("'packages' must list at least one module")

  const invalidPackages = discardWhen_array(isString)(packages)
  if (invalidPackages.length) {
    const invalidPackagesString = passThrough(invalidPackages, [
      keepFirst(3),
      map_array(jstring),
      join('\n'),
      truncateToNLines(6),
    ])
    throwErrorWithConfigMessage(
      tedent(`
        'packages' must contain only strings

        invalidPackages:
        ${invalidPackagesString}
      `)
    )
  }
}

//
//------------------//
// Helper Functions //
//------------------//

function makeThrowErrorWithConfigMessage(configBasename) {
  return msg => {
    const errorMessage = tedent(`
      The fes config found at '${configBasename}' is invalid

      ${msg}
    `)
    const error = new Error(errorMessage)
    error.justLogMessage = true
    throw error
  }
}

//
//---------//
// Exports //
//---------//

module.exports = validateFesConfig
