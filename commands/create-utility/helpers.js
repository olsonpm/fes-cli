//------//
// Main //
//------//

const inFesDirectoryRe = /\/fes-[^/]+(\/lib)?$/

const requiredArgs = new Set(['--name', '--type'])

const validArgs = new Set(['--kebab-filename', '--name', '--slim', '--type'])

const validNameRe = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/

const validUtilityTypes = new Set([
  'just-data',
  'supported-data',
  'no-data',
  'array-of-data',
])

//
//---------//
// Exports //
//---------//

module.exports = {
  inFesDirectoryRe,
  requiredArgs,
  validArgs,
  validNameRe,
  validUtilityTypes,
}
