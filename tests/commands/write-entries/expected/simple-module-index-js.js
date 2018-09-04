const tedent = require('tedent')

module.exports =
  tedent(`
    //
    // don't edit this file.  It is generated via \`fes write-entries\`
    //
    // check whether it's in sync with your lib directory via \`fes checkup\`
    //

    import { createUtility } from 'fes'

    //
    // imports from this package
    //

    import isTruthy_definition from './lib/is-truthy'
    const isTruthy = createUtility(isTruthy_definition)

    //
    // exports
    //

    export {
      isTruthy,
    }
  `) + '\n'
