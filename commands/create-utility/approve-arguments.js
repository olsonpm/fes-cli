//---------//
// Imports //
//---------//

const camelcase = require('camelcase'),
  tedent = require('tedent')

const {
  requiredArgs,
  validArgs,
  validNameRe,
  validUtilityTypes,
} = require('./helpers')

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
      slim: false,
      kebabFilename: false,
    }),
  ])

  const { kebabFilename, name, slim, type } = argumentsObject

  if (typeof kebabFilename !== 'boolean') {
    return {
      errorMessage: tedent(`
        '--kebab-filename' is a boolean flag thus should not be passed a value

        provided value: ${kebabFilename}
      `),
    }
  }

  if (typeof slim !== 'boolean') {
    return {
      errorMessage: tedent(`
        '--slim' is a boolean flag thus should not be passed a value

        provided value: ${slim}
      `),
    }
  }

  if (!validUtilityTypes.has(type)) {
    return {
      errorMessage: tedent(`
        --type '${type}' is invalid

        allowed types: ${[...validUtilityTypes].join(', ')}
      `),
    }
  }

  if (!validNameRe.test(name)) {
    return {
      errorMessage: tedent(`
        --name '${name}' is invalid

        it must pass the regex: ${validNameRe}
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
