//---------//
// Imports //
//---------//

const tedent = require('tedent')

const { requireEsm } = require('../../../../helpers')

const {
  inFesDirectoryRe,
} = require('../../../../commands/write-entries/helpers')

//
//------//
// Init //
//------//

const configHeader = getConfigHeader(),
  fes = requireEsm('fes')

//
//------//
// Main //
//------//

const errorMessage = {
  entrySizeWarning: getEntrySizeWarning(),
  duplicateLibUtilityNames: getDuplicateLibUtilityNames(),
  getMissingAndUnexpectedKeys,
  getUtilityHasNoName,
  getUtilityHasInvalidName,
  invalidCwd: getInvalidCwd(),
  invalidPackages: getInvalidPackages(),
  missingPackages: getMissingPackages(),
  noUtilities: getNoUtilities(),
  noNodeModules: getNoNodeModules(),
}

//
//------------------//
// Helper Functions //
//------------------//

function getInvalidCwd() {
  return (
    tedent(`
      You must use write-entries in a fes module

      cwd: /
      failed regex: ${inFesDirectoryRe}
    `) + '\n\n'
  )
}

function getInvalidPackages() {
  return {
    mustAllBeStrings:
      tedent(`
        ${configHeader}
        'packages' must contain only strings

        invalidPackages:
        null
      `) + '\n',
    mustBeArray: `${configHeader}\n'packages' must pass Array.isArray\n`,
    mustBeLaden: `${configHeader}\n'packages' must list at least one module\n`,
  }
}

function getMissingAndUnexpectedKeys(configBasename) {
  return (
    tedent(`
      The fes config found at '${configBasename}' is invalid

      missing keys: packages
      unexpected keys: invalid
    `) + '\n'
  )
}

function getMissingPackages() {
  return (
    tedent(`
      the following packages don't seem to be installed

      fes-test1, fes-test2

      make sure they're listed in your package.json's dependencies and that
      you've ran \`npm install\`
    `) + '\n'
  )
}

function getUtilityHasInvalidName(pathToUtility) {
  return (
    tedent(`
      The utility found at:
      ${pathToUtility}

      declares an invalid 'name'
        name: 1
        must pass the regex: ${fes._validUtilityNameRe}
    `) + '\n'
  )
}

function getUtilityHasNoName(pathToUtility) {
  return (
    tedent(`
      The utility found at:
      ${pathToUtility}

      does not declare a 'name'.  Please resolve all issues found via
      'fes checkup' before attempting to write entry files.
    `) + '\n'
  )
}

function getNoUtilities() {
  return (
    tedent(`
      Your fes module has no utilities to create an entry for!

      Utilies can be in your project's 'lib' directory or inherited from packages
      declared in your fes configuration.

      Read more at olsonpm.github.io/fes
    `) + '\n'
  )
}

function getNoNodeModules() {
  return (
    tedent(`
      The node_modules directory does not exist.

      Did you forget to run \`npm install\` ?
    `) + '\n'
  )
}

function getDuplicateLibUtilityNames() {
  return (
    tedent(`
      You have duplicate utility names in your lib directory

      isTruthy found at ./lib
        is-falsey.js
        is-truthy.js
    `) + '\n'
  )
}

function getEntrySizeWarning() {
  const colonSpace = ': '

  return (
    tedent(`
      Webpack encountered some warnings during compilation
      * If you don't care about these then run 'fes write-entries --ignore-warnings'

      asset size limit: The following asset(s) exceed the recommended size limit (244 KiB).
      This can impact web performance.
      Assets${colonSpace}
        index.pack.min.js (302 KiB),entrypoint size limit: The following entrypoint(s) combined asset size exceeds the recommended limit (244 KiB). This can impact web performance.
      Entrypoints:
        main (302 KiB)
        index.pack.min.js
        ,webpack performance recommendations${colonSpace}
        You can limit the size of your bundles by using import() or require.ensure to lazy load some parts of your application.
        For more info visit https://webpack.js.org/guides/code-splitting/
    `) + '\n'
  )
}

function getConfigHeader() {
  return "The fes config found at 'package.json' is invalid\n"
}

//
//---------//
// Exports //
//---------//

module.exports = errorMessage
