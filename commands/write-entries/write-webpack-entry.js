//---------//
// Imports //
//---------//

const pify = require('pify')

const pWebpack = pify(require('webpack')),
  tedent = require('tedent')

const getWebpackConfig = require('./get-webpack-config')

//
//------//
// Main //
//------//

const writeWebpackEntry = async ignoreWarnings => {
  const config = getWebpackConfig(process.cwd())

  let stats
  try {
    stats = await pWebpack(config)
  } catch (error) {
    throwWebpackError(error)
  }

  const info = stats.toJson()
  if (stats.hasErrors()) throwWebpackCompilationErrors(info)
  if (!ignoreWarnings && stats.hasWarnings())
    throwWebpackCompilationWarnings(info)
}

//
//------------------//
// Helper Functions //
//------------------//

function throwWebpackCompilationWarnings(info) {
  const message = tedent(`
    Webpack encountered some warnings during compilation
    * If you don't care about these then run 'fes write-entries --ignore-warnings'

    ${info.warnings}
  `)

  const error = new Error(message)
  error.justLogMessage = true
  throw error
}

function throwWebpackCompilationErrors(info) {
  const message = tedent(`
    Webpack encountered some errors during compilation

    ${info.errors}
  `)

  const error = new Error(message)
  error.justLogMessage = true
  throw error
}

function throwWebpackError(error) {
  const maybeDetails = error.details
    ? tedent(`
        Details:
          ${error.details}
      `)
    : ''

  const message = tedent(`
    An unexpected webpack error occurred

    ${error.stack || error}

    ${maybeDetails}
  `)

  error.message = message
  error.justLogMessage = true
  throw error
}

//
//---------//
// Exports //
//---------//

module.exports = writeWebpackEntry
