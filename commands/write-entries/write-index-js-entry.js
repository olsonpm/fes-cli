//---------//
// Imports //
//---------//

const path = require('path'),
  tedent = require('tedent')

const createPackageNameToUtilities = require('./create-package-name-to-utilities'),
  createTemplateData = require('./create-template-data'),
  getOwnUtilities = require('./get-own-utilities'),
  initHandlebars = require('./init-handlebars'),
  tryToGetFesConfig = require('./try-to-get-fes-config'),
  validateFesConfig = require('./validate-fes-config')

const { isEmpty, pFs, readFile } = require('../../helpers')

//
//------//
// Main //
//------//

const writeIndexJsEntry = async packageNames => {
  const wasCalledFromSiblingTool = !!packageNames

  packageNames = packageNames || []

  if (!wasCalledFromSiblingTool) {
    // eslint-disable-next-line prefer-const
    const { config, configBasename, wasFound } = tryToGetFesConfig()

    if (wasFound) {
      validateFesConfig(config, configBasename)
      packageNames = config.packages || packageNames
    }
  }

  const pathToLib = path.resolve(process.cwd(), 'lib')
  let filesInLib

  try {
    filesInLib = await pFs.readdir(pathToLib)
  } catch (error) {
    filesInLib = []
  }

  if (isEmpty(packageNames) && isEmpty(filesInLib)) throwNoUtils()

  // we've got a good config wooooo
  const [indexJsTemplate, result, ownUtilities] = await Promise.all([
    readFile(path.resolve(__dirname, './index.js.hbs')),
    createPackageNameToUtilities(packageNames),
    getOwnUtilities(filesInLib, pathToLib),
  ])

  const { packageNameToUtilities } = result,
    templateData = createTemplateData(packageNameToUtilities, ownUtilities),
    handlebars = initHandlebars(),
    indexJsContents = handlebars.compile(indexJsTemplate)(templateData)

  await pFs.writeFile('index.js', indexJsContents)
}

//
//------------------//
// Helper Functions //
//------------------//

function throwNoUtils() {
  const message = tedent(`
    Your fes module has no utilities to create an entry for!

    Utilies can be in your project's 'lib' directory or inherited from packages
    declared in your fes configuration.

    Read more at olsonpm.github.io/fes
  `)

  const error = new Error(message)
  error.justLogMessage = true
  throw error
}

//
//---------//
// Exports //
//---------//

module.exports = writeIndexJsEntry
