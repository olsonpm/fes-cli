/* eslint-disable no-console */

//---------//
// Imports //
//---------//

const kebabcase = require('kebabcase'),
  path = require('path'),
  tedent = require('tedent')

const approveArguments = require('./approve-arguments'),
  usage = require('./usage')

const { inFesDirectoryRe } = require('./helpers')
const {
  alwaysReturn: justReturn,
  endsWith,
  handleUnexpectedError,
  readFile,
} = require('../../helpers')

//
//------//
// Main //
//------//

Object.assign(createUtility, {
  approveArguments,
  usage,
})

function createUtility(argumentsObject) {
  try {
    const cwd = process.cwd(),
      maybeExitCode = validateCwd(cwd)
    if (maybeExitCode) return Promise.resolve(maybeExitCode)

    // valid input, move on

    const makeDir = require('make-dir'),
      pify = require('pify'),
      pFs = pify(require('fs'))

    const {
        kebabFilename,
        name: utilityName,
        type: utilityType,
      } = argumentsObject,
      isInLibDir = endsWith('/lib')(cwd)

    const maybeChangeToLibDir = isInLibDir
      ? Promise.resolve()
      : makeDir('lib').then(() => {
          process.chdir('lib')
        })

    return Promise.all([
      readFile(path.resolve(__dirname, `./templates/${utilityType}.hbs`)),
      maybeChangeToLibDir,
    ])
      .then(([template]) => {
        const handlebars = require('handlebars'),
          templateData = getTemplateData(argumentsObject)

        const result = handlebars.compile(template, { strict: true })(
          templateData
        )

        const filename = kebabFilename ? kebabcase(utilityName) : utilityName
        return pFs
          .writeFile(filename + '.js', result)
          .then(justReturn(filename))
      })
      .then(filename => {
        const maybeLib = isInLibDir ? '' : 'lib/'
        console.log(`${maybeLib}${filename}.js was created`)
      })
      .catch(handleUnexpectedError)
  } catch (error) {
    return handleUnexpectedError(error)
  }
}

//
//------------------//
// Helper Functions //
//------------------//

function getTemplateData(args) {
  return {
    name: args.name,
    slim: args.slim,
  }
}

function validateCwd(cwd) {
  if (!inFesDirectoryRe.test(cwd)) {
    const message = tedent(`
      You must use create-utility in either a fes module, preset, or their
        lib directories

      cwd: ${cwd}
      failed regex: ${inFesDirectoryRe}
    `)

    console.error(`\n${message}\n\n\n${usage}\n`)
    return 1
  }
}

//
//---------//
// Exports //
//---------//

module.exports = createUtility
