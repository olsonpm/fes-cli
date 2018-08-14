/* eslint-disable no-console */

//---------//
// Imports //
//---------//

const path = require('path'),
  tedent = require('tedent'),
  { exec: pExec } = require('child-process-promise')

const {
  alwaysReturn,
  assignOver,
  discardAll,
  isFalsey,
  keepWhen_array,
  keepWhen_object,
  makeApproveHasNoArguments,
  mSet,
  passThrough,
  resolveAllProperties,
  startsWith,
} = require('../helpers')

//
//------//
// Init //
//------//

const commaSeparatedListRe = /\s*,\s*/,
  nameRe = /&[a-z][a-z-]+$/,
  npmPackageTypes = new Set(['tag', 'version', 'range'])

//
//------//
// Main //
//------//

const approveHasNoArguments = makeApproveHasNoArguments('initPreset')

initPreset.approveArguments = approveHasNoArguments

function initPreset() {
  try {
    const inquirer = require('inquirer'),
      npmExists = require('npm-exists'),
      npmPackageArg = require('npm-package-arg'),
      pify = require('pify'),
      pFs = pify(require('fs')),
      state = {},
      questions = getQuestions(state, npmExists, npmPackageArg)

    inquirer
      .prompt(questions)
      .catch(handlePromptError)
      .then(answers => {
        //
        // we don't care about answers.composedModules because we already parsed
        //   the info we want inside the state object
        //

        const moduleName = `fes-preset-${answers.name}`

        return pFs
          .mkdir(moduleName)
          .then(() => {
            process.chdir(moduleName)
            return pExec(`npm init -f`)
          })
          .then(() => {
            const pathToPjson = path.resolve(process.cwd(), 'package.json'),
              pjson = assignOver(require(pathToPjson))({
                main: 'index.compat.pack.js',
                module: 'index.js',
                sideEffects: false,
                version: '0.1.0',
              })

            if (state.npmFesModules.length) {
              pjson.fesPreset = {
                modules: state.npmFesModules,
              }
            }
            return pFs.writeFile(pathToPjson, JSON.stringify(pjson, null, 2))
          })
          .then(() => {
            return state.npmFesModules.length
              ? pExec(`npm i ${state.npmFesModules.join(' ')}`)
              : undefined
          })
          .then(() => {
            if (state.npmFesModules.length && !state.notifyManualIntervention)
              return require('./create-preset-entry')(state.npmFesModules)
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

function getQuestions(state, npmExists, npmPackageArg) {
  return [
    {
      name: 'name',
      message: 'Name? fes-preset-(your name here)',
      validate: name => {
        if (startsWith('fes-')(name)) {
          return tedent(`
            name cannot start with 'fes-'

            I prepend your module name with 'fes-preset-' and 'fes-preset-fes-'
              would be confusing!
          `)
        }
        return nameRe.test(name) || `name must match ${nameRe}`
      },
    },
    {
      name: 'composedModules',
      message: 'Comma separated list of fes modules:',
      validate(csl) {
        const done = this.async(),
          fesModules = csl.split(commaSeparatedListRe),
          npmFesModules = keepWhen_array(isNpmPackage)(fesModules),
          notifyManualIntervention = fesModules.length !== npmFesModules.length

        resolveAllProperties(
          npmFesModules.reduce(createModuleNameToIsPackage, {})
        ).then(moduleNameToIsPackage => {
          const invalidModules = passThrough(moduleNameToIsPackage, [
            keepWhen_object(isFalsey),
            Object.keys,
          ])

          const result =
            !invalidModules.length ||
            tedent(`
              Some modules were not found on npm - is there a typo?
              not found: ${invalidModules.join(', ')}
            `)

          let nonNpmModules

          if (result && notifyManualIntervention) {
            nonNpmModules = discardAll(npmFesModules)(fesModules)
            console.log()
            console.log(
              tedent(`
                Some of your modules seem to be hosted outside of npm, and I
                  don't yet have the capability of looking up their package
                  names.  This means you'll need to manually add them to your
                  fes-preset 'modules' configuration and run the command
                  'create-preset-entry' afterward.

                Affected modules
                  ${nonNpmModules.join('\n')}
              `)
            )
            console.log()
          }

          if (result) {
            state.composedModules = {
              fesModules,
              notifyManualIntervention,
              npmFesModules,
              nonNpmModules,
            }
          }

          done(null, result)
        })
      },
    },
  ]

  // helper functions scoped to 'getQuestions'

  function createModuleNameToIsPackage(moduleToIsNpmPackage, moduleName) {
    return mSet(moduleName, npmExists(moduleName))(moduleToIsNpmPackage)
  }

  function isNpmPackage(moduleName) {
    return npmPackageTypes.has(npmPackageArg(moduleName).type)
  }
}

function handlePromptError(error) {
  console.error(
    tedent(`
      An error occurred during the init-preset-module prompt

      ${error}
    `)
  )
  return Promise.reject(error)
}

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

module.exports = initPreset
