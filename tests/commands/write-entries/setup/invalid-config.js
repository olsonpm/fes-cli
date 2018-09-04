//---------//
// Imports //
//---------//

const tedent = require('tedent')

//
//------//
// Main //
//------//

const invalidConfig = {
  missingAndUnexpectedKeys: getMissingAndUnexpectedKeys(),
  mustBeArray: getMustBeArray(),
  mustBeLaden: getMustBeLaden(),
  mustAllBeStrings: getMustAllBeStrings(),
}

//
//------------------//
// Helper Functions //
//------------------//

function getMustBeLaden() {
  return tedent(`
    {
      "fes": {
        "packages": []
      }
    }
  `)
}

function getMustAllBeStrings() {
  return tedent(`
    {
      "fes": {
        "packages": [null]
      }
    }
  `)
}

function getMustBeArray() {
  return tedent(`
    {
      "fes": {
        "packages": "invalid"
      }
    }
  `)
}

function getMissingAndUnexpectedKeys() {
  return {
    packageJsonContents: tedent(`
      {
        "fes": {
          "invalid": true
        }
      }
    `),
    cjsContents: tedent(`
      module.exports = {
        invalid: true,
      }
    `),
    esmContents: tedent(`
      export default {
        invalid: true,
      }
    `),
  }
}

//
//---------//
// Exports //
//---------//

module.exports = invalidConfig
