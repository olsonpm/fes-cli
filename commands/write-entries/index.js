/* eslint-disable no-console */

//---------//
// Imports //
//---------//

const tedent = require('tedent')

const approveArguments = require('./approve-arguments'),
  usage = require('./usage')

const { inFesDirectoryRe, inFesPresetRe } = require('./helpers')

//
//------//
// Main //
//------//

Object.assign(writeEntries, {
  approveArguments,
  usage,
})

async function writeEntries(argumentsObject) {
  try {
    const cwd = process.cwd(),
      maybeExitCode = validateCwd(cwd)

    if (maybeExitCode) return maybeExitCode

    // if we're not in a fes preset directory then we're in a fes module
    const createPresetOrModuleEntries = inFesPresetRe.test(cwd)
      ? require('./preset')
      : require('./module')

    return await createPresetOrModuleEntries(argumentsObject)
  } catch (error) {
    return handleUnexpectedError(error)
  }
}

//
//------------------//
// Helper Functions //
//------------------//

function validateCwd(cwd) {
  if (!inFesDirectoryRe.test(cwd)) {
    const message = tedent(`
      You must use write-entries in either a fes module or preset

      cwd: ${cwd}
      failed regex: ${inFesDirectoryRe}
    `)

    console.error(`\n${message}\n\n\n${usage}\n`)
    return 1
  }
}

function handleUnexpectedError(error) {
  console.error(
    tedent(`
      An unexpected error occurred while creating the entries

      ${error.stack}
    `)
  )
  return 1
}

//
//---------//
// Exports //
//---------//

module.exports = writeEntries
