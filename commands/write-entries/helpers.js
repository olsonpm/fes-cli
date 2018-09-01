//------//
// Main //
//------//

const inFesDirectoryRe = /\/fes-(preset-)?[^/]+$/

const inFesPresetRe = /\/fes-preset-[^/]+$/

const requiredArgs = new Set()

const validArgs = new Set(['--ignore-warnings'])

//
//---------//
// Exports //
//---------//

module.exports = { inFesDirectoryRe, inFesPresetRe, requiredArgs, validArgs }
