/* eslint-disable no-console */

//---------//
// Imports //
//---------//

const path = require('path'),
  tedent = require('tedent')

const approveArguments = require('./approve-arguments'),
  usage = require('./usage')

const { inFesDirectoryRe } = require('./helpers')

const {
  dashelize,
  endsWith,
  handleUnexpectedError,
  pFs,
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

async function createUtility(argumentsObject) {
  try {
    const cwd = process.cwd(),
      maybeExitCode = validateCwd(cwd)
    if (maybeExitCode) return Promise.resolve(maybeExitCode)

    // valid input, move on

    const makeDir = require('make-dir')

    const {
        kebabFilename,
        name: utilityName,
        type: utilityType,
      } = argumentsObject,
      isInLibDir = endsWith('/lib')(cwd),
      maybeLib = isInLibDir ? '' : 'lib/'

    const maybeChangeToLibDir = isInLibDir
      ? Promise.resolve()
      : makeDir('lib').then(() => {
          process.chdir('lib')
        })

    const [template] = await Promise.all([
      readFile(path.resolve(__dirname, `./templates/${utilityType}.hbs`)),
      maybeChangeToLibDir,
    ])

    const handlebars = require('handlebars'),
      templateData = getTemplateData(argumentsObject),
      result = handlebars.compile(template, { strict: true })(templateData),
      filename = kebabFilename ? dashelize(utilityName) : utilityName

    try {
      await pFs.writeFile(filename + '.js', result, { flag: 'wx' })
    } catch (error) {
      handleWriteFileError(error, maybeLib, filename)
      return 1
    }

    console.log(`${maybeLib}${filename}.js was created`)
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

function handleWriteFileError(error, maybeLib, filename) {
  const beginningMessage = "I can't create your utility"
  if (error.code === 'EEXIST') {
    console.error(
      `\n${beginningMessage} because '${maybeLib}${filename}' already exists\n`
    )
  } else {
    const message = tedent(`
      ${beginningMessage} at '${maybeLib}${filename}' due to an unexpected filesystem error

      code: ${error.code}
    `)
    console.error(`\n${message}\n`)
  }
}

//
//---------//
// Exports //
//---------//

module.exports = createUtility
