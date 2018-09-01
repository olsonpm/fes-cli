//---------//
// Imports //
//---------//

const path = require('path'),
  { exec: pExec } = require('child-process-promise')

//
//------//
// Init //
//------//

const pathToFesCli = path.resolve(__dirname, '../')

//
//------//
// Main //
//------//

const runFesCommand = (args, opts) =>
  pExec(`node ${pathToFesCli} ${args}`, opts).catch(result => {
    return result.error ? Promise.reject(result.error) : result
  })

//
//---------//
// Exports //
//---------//

module.exports = runFesCommand
