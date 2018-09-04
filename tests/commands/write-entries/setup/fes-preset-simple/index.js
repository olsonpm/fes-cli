//
// don't edit this file.  It is generated via `fes write-entries`
//
// check whether it's in sync with your lib directory via `fes checkup`
//

import { createUtility } from 'fes'

//
// imports from this package
//

import isTruthy_definition from './lib/is-truthy'
const isTruthy = createUtility(isTruthy_definition)

//
// imports for 'fes-test1'
//

import test1_definition from 'fes-test1/lib/test1'
const test1 = createUtility(test1_definition)

//
// imports for 'fes-test2'
//

import test2_definition from 'fes-test2/lib/test2'
const test2 = createUtility(test2_definition)

//
// exports
//

export {
  test1,
  test2,
  isTruthy,
}
