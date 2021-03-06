//---------//
// Imports //
//---------//

const chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  tedent = require('tedent')

const runFesCommand = require('./run-fes-command'),
  usage = require('../usage')

const { version } = require('../package.json'),
  { wrapMessage } = require('../helpers'),
  { map_object } = require('../../helpers')

//
//------//
// Init //
//------//

const usagePlusPadding = `\n${usage}\n\n`,
  versionPlusNewline = `${version}\n`,
  message = getMessages()

chai.use(chaiAsPromised)
chai.should()

//
//------//
// Main //
//------//

suite('root usage (no correct commands)', () => {
  test('no arguments should print usage', () => {
    return runFesCommand('').should.eventually.have.property(
      'stdout',
      usagePlusPadding
    )
  })

  test("'--help' should print usage", () => {
    return runFesCommand('--help').should.eventually.have.property(
      'stdout',
      usagePlusPadding
    )
  })

  test("'--version' should just print the version", () => {
    return runFesCommand('--version').should.eventually.have.property(
      'stdout',
      versionPlusNewline
    )
  })

  test("'--invalid' should fail", () => {
    return runFesCommand('--invalid').should.eventually.have.property(
      'stderr',
      message.invalidArg + usage + '\n\n'
    )
  })

  test("'--help --version --invalid' should fail", () => {
    return runFesCommand(
      '--help --version --invalid'
    ).should.eventually.have.property(
      'stderr',
      message.onlyOneArg + usage + '\n\n'
    )
  })

  test("'invalid' should fail", () => {
    return runFesCommand('invalid').should.eventually.have.property(
      'stderr',
      `\nYou passed an invalid command 'invalid'\n\n\n${usage}\n\n`
    )
  })
})

//
//------------------//
// Helper Functions //
//------------------//

function getMessages() {
  return map_object(wrapMessage)({
    invalidArg: getInvalidArgMessage(),
    onlyOneArg: getOnlyOneArgMessage(),
  })
}

function getInvalidArgMessage() {
  return tedent(`
    The argument --invalid was unexpected

    allowed arguments: --help, --version
  `)
}

function getOnlyOneArgMessage() {
  return tedent(`
    Only one root argument allowed

    additional arguments provided: --version, --invalid
  `)
}
