//---------//
// Imports //
//---------//

const tedent = require('tedent')

//
//------//
// Main //
//------//

const noDataSlim = getExpectedNoDataSlim()

const successSimple = {
  'array-of-data': getExpectedArrayOfData(),
  'just-data': getExpectedJustData(),
  'no-data': getExpectedNoData(),
  'supported-data': getExpectedSupportedData(),
}

//
//------------------//
// Helper Functions //
//------------------//

function getExpectedArrayOfData() {
  return tedent(`
    export default {
      name: 'aB',
      isArrayOfData: true,
      typeToFunction: {
        object: objectFunction,
      },
    }

    function objectFunction(anArrayOfObjects) {
      // do something with your array of objects here
    }

    /*
     *  for information on all available properties you can use above, see
     *    olsonpm.github.io/fes
     *
     *  examples can be found at
     *    github.com/olsonpm/fes/tree/dev/examples/array-of-data
    */
  `)
}

function getExpectedJustData() {
  return tedent(`
    export default {
      name: 'aB',
      typeToFunction: {
        array: arrayFunction
      }
    }

    function arrayFunction(anArray) {
      // do something with your array here
    }

    /*
     *  for information on all available properties you can use above, see
     *    olsonpm.github.io/fes
     *
     *  examples can be found at
     *    github.com/olsonpm/fes/tree/dev/examples/just-data
    */
  `)
}

function getExpectedNoData() {
  return tedent(`
    export default {
      name: 'aB',
      hasNoDataArgument: {
        expectedArgumentTypes: ['array'],
        theFunction,
      },
    }

    function theFunction(anArray) {
      // do something with your array here
    }

    /*
     *  for information on all available properties you can use above, see
     *    olsonpm.github.io/fes
     *
     *  examples can be found at
     *    github.com/olsonpm/fes/tree/dev/examples/no-data
    */
  `)
}

function getExpectedNoDataSlim() {
  return tedent(`
    export default {
      name: 'aB',
      hasNoDataArgument: {
        expectedArgumentTypes: ['array'],
        theFunction,
      },
    }

    function theFunction(anArray) {
      // do something with your array here
    }
  `)
}

function getExpectedSupportedData() {
  return tedent(`
    export default {
      name: 'aB',
      expectedSupportArgumentTypes: ['number'],
      typeToFunction: {
        array: arrayFunction
      }
    }

    function arrayFunction(aNumber) {
      return anArray => {
        // do something with your number and array here
      }
    }

    /*
     *  for information on all available properties you can use above, see
     *    olsonpm.github.io/fes
     *
     *  examples can be found at
     *    github.com/olsonpm/fes/tree/dev/examples/supported-data
    */
  `)
}

//
//---------//
// Exports //
//---------//

module.exports = {
  noDataSlim,
  successSimple,
}
