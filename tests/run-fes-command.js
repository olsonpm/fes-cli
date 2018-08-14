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
  pExec(`node ${pathToFesCli} ${args}`, opts).catch(({ stderr }) => ({
    stderr,
  }))

//
//---------//
// Exports //
//---------//

module.exports = runFesCommand
