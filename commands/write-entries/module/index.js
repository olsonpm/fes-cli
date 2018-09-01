/* eslint-disable no-console */

//---------//
// Imports //
//---------//

const pify = require('pify')

const camelcase = require('camelcase'),
  path = require('path'),
  tedent = require('tedent'),
  pWebpack = pify(require('webpack'))

const indexJsHeader = require('../index-js-header'),
  getWebpackConfig = require('../get-webpack-config')

const {
  contains,
  discardLast,
  discardWhen_array: discardWhen,
  endsWith,
  isEmpty,
  isLaden,
  map_array,
  mMap,
  passThrough,
  pFs,
  readFile,
} = require('../../../helpers')

//
//------//
// Main //
//------//

const createModuleEntries = async ({ ignoreWarnings }) => {
  const cwd = process.cwd()

  let utils

  try {
    utils = await pFs.readdir(path.join(cwd, 'lib'))
  } catch (error) {
    return handleUtilsError(cwd, error)
  }

  const maybeErrorCode = validateUtils(utils)
  if (maybeErrorCode) return maybeErrorCode

  const templateData = createTemplateData(utils)

  const template = await readFile(path.resolve(__dirname, './index.js.hbs'))

  const handlebars = require('handlebars')

  handlebars.registerHelper('json', context => JSON.stringify(context))

  const result = handlebars.compile(template)(templateData)

  await pFs.writeFile('index.js', result)

  const config = getWebpackConfig(cwd)

  let stats
  try {
    stats = await pWebpack(config)
  } catch (error) {
    return handleWebpackError(error)
  }

  const info = stats.toJson()
  if (stats.hasErrors()) return handleWebpackCompilationErrors(info)
  if (!ignoreWarnings && stats.hasWarnings())
    return handleWebpackCompilationWarnings(info)

  console.log('Entry files were created successfully')
}

//
//------------------//
// Helper Functions //
//------------------//

function handleWebpackCompilationErrors(info) {
  console.error(
    tedent(`
      Webpack encountered some errors during compilation

      ${info.errors}
    `)
  )

  return 1
}

function handleWebpackCompilationWarnings(info) {
  console.error(
    tedent(`
      Webpack encountered some warnings during compilation
      * If you don't care about these then run 'fes write-entries --ignore-warnings'

      ${info.warnings}
    `)
  )

  return 1
}

function handleWebpackError(error) {
  const maybeDetails = error.details
    ? tedent(`
        Details:
          ${error.details}
      `)
    : ''

  console.error(
    tedent(`
      An unexpected webpack error occurred

      ${error.stack || error}

      ${maybeDetails}
    `)
  )

  return 1
}

function validateUtils(utils) {
  if (isEmpty(utils)) return handleEmptyUtils()

  const notJsFiles = discardWhen(endsWith('.js'))(utils)
  if (isLaden(notJsFiles)) {
    const message = tedent(`
      all files in your lib directory must have a '.js' extension

      invalid files:
        ${notJsFiles.join('\n')}
    `)
    console.error(`\n${message}\n`)
    return 1
  }
}

function createTemplateData(utils) {
  utils = passThrough(utils, [
    map_array(discardLast('.js'.length)),
    mMap(toVarAndFilenames),
  ])

  return {
    indexJsHeader,
    utils,
  }
}

function toVarAndFilenames(utilName) {
  return {
    fileName: utilName,
    varName: maybeCamelcase(utilName),
  }
}

function maybeCamelcase(utilName) {
  return contains('-')(utilName) ? camelcase(utilName) : utilName
}

function handleEmptyUtils() {
  console.error(
    "\nyour utils directory is empty so I can't create your entry files.\n"
  )
  return 1
}

function handleUtilsError(error) {
  let message

  if (error.code === 'ENOENT') {
    message = tedent(`
      there doesn't seem to be a 'lib' directory.  In order to create your
        module entry files, a lib directory must be at your project root
        containing all your utilities.
    `)
  } else {
    message = tedent(`
      an unexpected filesystem error occurred when trying to read the
        lib directory

      error code: ${error.code}
    `)
  }

  console.error(`\n${message}\n`)
  return 1
}

//
//---------//
// Exports //
//---------//

module.exports = createModuleEntries
