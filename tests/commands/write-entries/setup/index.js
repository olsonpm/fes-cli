//---------//
// Imports //
//---------//

const tedent = require('tedent')

//
//------//
// Main //
//------//

const setup = {
  invalidConfig: require('./invalid-config'),
  isFalseyWithIncorrectName: getIsFalseyWithIncorrectName(),
  isTruthyNoNameContents: getIsTruthyNoNameContents(),
  isTruthyInvalidNameContents: getIsTruthyInvalidNameContents(),
  isTruthyWithBigDependency: getIsTruthyWithBigDependency(),
  test1NoNameContents: getTest1NoNameContents(),
  test1InvalidNameContents: getTest1InvalidNameContents(),
}

//
//------------------//
// Helper Functions //
//------------------//

function getIsFalseyWithIncorrectName() {
  return tedent(`
    export default {
      name: 'isTruthy',
      typeToFunction: { any: something => !something },
    }
  `)
}

function getIsTruthyNoNameContents() {
  return tedent(`
    export default {
      typeToFunction: { any: something => !!something },
    }
  `)
}

function getIsTruthyInvalidNameContents() {
  return tedent(`
    export default {
      name: '1',
      typeToFunction: { any: something => !!something },
    }
  `)
}

function getTest1NoNameContents() {
  return tedent(`
    export default {
      typeToFunction: { any: () => 'test1' },
    }
  `)
}

function getTest1InvalidNameContents() {
  return tedent(`
    export default {
      name: '1',
      typeToFunction: { any: () => 'test1' },
    }
  `)
}

function getIsTruthyWithBigDependency() {
  return tedent(`
    const string250kLong = require('../big-dep')

    export default {
      name: 'isTruthy',
      typeToFunction: {
        any: something => {
          if (global.isTrue) {
            console.log(string250kLong)
          }

          return !!something
        }
      }
    }
  `)
}

//
//---------//
// Exports //
//---------//

module.exports = setup
