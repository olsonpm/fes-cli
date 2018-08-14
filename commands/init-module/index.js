/* eslint-disable no-console */

//---------//
// Imports //
//---------//

const path = require('path'),
  tedent = require('tedent'),
  { exec: pExec } = require('child-process-promise')

const { alwaysReturn, assignOver, startsWith } = require('../helpers')

//
//------//
// Init //
//------//

const nameRe = /&[a-z][a-z-]+$/

//
//------//
// Main //
//------//

const approveHasNoArguments = makeApproveHasNoArguments('initModule')

initModule.approveArguments = approveHasNoArguments

function initModule() {
  try {
    const pify = require('pify'),
      pFs = pify(require('fs'))
        .then(answers => {
          const moduleName = `fes-${answers.name}`

          return pFs
            .mkdir(moduleName)
            .then(() => {
              process.chdir(moduleName)
              return Promise.all([pFs.mkdir('lib'), pExec(`npm init -f`)])
            })
            .then(() => {
              const pathToPjson = path.resolve(process.cwd(), 'package.json'),
                pjson = assignOver(require(pathToPjson), {
                  sideEffects: false,
                  version: '0.1.0',
                })

              return pFs.writeFile(pathToPjson, JSON.stringify(pjson, null, 2))
            })
            .then(() => {
              console.log('done!')
            })
        })
        .catch(alwaysReturn(1))
  } catch (error) {
    return handleUnexpectedError(error)
  }
}

//
//------------------//
// Helper Functions //
//------------------//

function handleUnexpectedError(error) {
  console.error(
    tedent(`
      An unexpected error occurred while creating the preset

      ${error}
    `)
  )
  return Promise.resolve(1)
}

//
//---------//
// Exports //
//---------//

module.exports = initModule
