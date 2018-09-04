/* eslint-disable no-console */

//---------//
// Imports //
//---------//

const tedent = require('tedent')

const approveArguments = require('./approve-arguments'),
  writeIndexJsEntry = require('./write-index-js-entry'),
  writeWebpackEntry = require('./write-webpack-entry'),
  usage = require('./usage')

const { inFesDirectoryRe } = require('./helpers')

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
    validateCwd(process.cwd())

    const { ignoreWarnings, packageNames } = argumentsObject
    const wasCalledFromSiblingTool = !!packageNames

    await writeIndexJsEntry(packageNames)
    await writeWebpackEntry(ignoreWarnings)

    if (!wasCalledFromSiblingTool)
      console.log('Your entry files were created successfully')
  } catch (error) {
    return logError(error)
  }
}

//
//------------------//
// Helper Functions //
//------------------//

function validateCwd(cwd) {
  if (!inFesDirectoryRe.test(cwd)) {
    const message = tedent(`
      You must use write-entries in a fes module

      cwd: ${cwd}
      failed regex: ${inFesDirectoryRe}
    `)

    const error = new Error(message + '\n')
    error.justLogMessage = true
    throw error
  }
}

function logError(error) {
  if (error.justLogMessage) console.error(error.message)
  else {
    console.error(
      tedent(`
        An unexpected error occurred while creating the entries

        ${error.stack}
      `)
    )
  }
  return 1
}

//
//---------//
// Exports //
//---------//

module.exports = writeEntries
