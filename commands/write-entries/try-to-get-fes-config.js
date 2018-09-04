//---------//
// Imports //
//---------//

const path = require('path')

const {
  getDefaultIfEsModule,
  passThrough,
  requireEsm,
} = require('../../helpers')

//
//------//
// Init //
//------//

const configBasenameJs = 'fes.config.js'

//
//------//
// Main //
//------//

const tryToGetFesConfig = () => {
  const cwd = process.cwd()

  let config,
    configBasename,
    wasFound = false

  try {
    config = passThrough(path.resolve(cwd, configBasenameJs), [
      requireEsm,
      getDefaultIfEsModule,
    ])
    wasFound = true
    configBasename = configBasenameJs
  } catch (_unused_error) {} // eslint-disable-line no-empty

  if (!config) {
    try {
      config = require(path.resolve(cwd, 'package.json'))['fes']
      wasFound = true
      configBasename = 'package.json'
    } catch (_unused_error) {} // eslint-disable-line no-empty

    config = config || {}
  }

  return { config, configBasename, wasFound }
}

//
//---------//
// Exports //
//---------//

module.exports = tryToGetFesConfig
