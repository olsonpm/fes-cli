//---------//
// Imports //
//---------//

const camelcase = require('camelcase'),
  tedent = require('tedent')

const { requiredArgs, validArgs } = require('./helpers')

const {
  assignOver: applyDefaults,
  discardAll,
  mapKeys,
  passThrough,
  toArgumentsObject,
} = require('../../helpers')

//
//------//
// Main //
//------//

const approveArguments = commandArgs => {
  // eslint-disable-next-line prefer-const
  let { argumentsObject, errorMessage } = toArgumentsObject(
    commandArgs,
    validArgs
  )
  if (errorMessage) return { errorMessage }

  const argsGiven = Object.keys(argumentsObject),
    missingArguments = discardAll(argsGiven)(requiredArgs)

  if (missingArguments.length) {
    return {
      errorMessage: tedent(`
        required arguments are missing

        missing: ${missingArguments.join(', ')}
      `),
    }
  }

  argumentsObject = passThrough(argumentsObject, [
    mapKeys(camelcase),
    applyDefaults({
      ignoreWarnings: false,
    }),
  ])

  const { ignoreWarnings } = argumentsObject

  if (typeof ignoreWarnings !== 'boolean') {
    return {
      errorMessage: tedent(`
        '--ignore-warnings' is a boolean flag and thus should not be passed a value

        provided value: ${ignoreWarnings}
      `),
    }
  }

  return { argumentsObject }
}

//
//---------//
// Exports //
//---------//

module.exports = approveArguments
