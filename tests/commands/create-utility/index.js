//---------//
// Imports //
//---------//

const chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  del = require('del'),
  makeDir = require('make-dir'),
  path = require('path'),
  tedent = require('tedent')

const expected = require('./expected'),
  runFesCommand = require('../../run-fes-command'),
  usage = require('../../../commands/create-utility/usage')

const { wrapMessage } = require('../../helpers'),
  { map_object, readFile } = require('../../../helpers')

const {
  inFesDirectoryRe,
  validArgs,
  validNameRe,
  validUtilityTypes,
} = require('../../../commands/create-utility/helpers')

//
//------//
// Init //
//------//

chai.use(chaiAsPromised)
chai.should()

const message = getMessages(),
  tmpFesSuccessDir = path.resolve(__dirname, '../tmp/fes-tmp')

//
//------//
// Main //
//------//

suite('create-utility', () => {
  suite('success', () => {
    suite('no optional arguments', () => {
      setup(() => del(tmpFesSuccessDir).then(() => makeDir(tmpFesSuccessDir)))

      for (const type of validUtilityTypes) {
        test(`type: ${type}`, () => testType(type))
      }
    })

    suite('with optional arguments', () => {
      test('--kebab-filename', () =>
        testType('no-data', { '--kebab-filename': true }))
      test('--slim', () => testType('no-data', { '--slim': true }))
    })
  })

  suite('errors', () => {
    test('invalid cwd', () => {
      const command = 'create-utility --name a --type no-data',
        opts = { cwd: '/' }

      return runFesCommand(command, opts).should.eventually.have.property(
        'stderr',
        message.invalidCwd + usage + '\n\n'
      )
    })

    suite('invalid arguments', () => {
      test('missing required arguments', () => {
        return runFesCommand('create-utility').should.eventually.have.property(
          'stderr',
          message.missingArg + usage + '\n\n'
        )
      })
      test("'--invalid' is unexpected", () => {
        const command = 'create-utility --invalid --type no-data'
        return runFesCommand(command).should.eventually.have.property(
          'stderr',
          message.unexpectedArg + usage + '\n\n'
        )
      })
      test("expected argument name and got 'invalid'", () => {
        const command = 'create-utility invalid'
        return runFesCommand(command).should.eventually.have.property(
          'stderr',
          message.expectedArgumentName + usage + '\n\n'
        )
      })
      test('--kebab-filename is a boolean', () => {
        const command =
          'create-utility --kebab-filename invalid --name a --type no-data'
        return runFesCommand(command).should.eventually.have.property(
          'stderr',
          message.kebabFilenameIsBoolean + usage + '\n\n'
        )
      })
      test('--slim is a boolean', () => {
        const command = 'create-utility --slim invalid --name a --type no-data'
        return runFesCommand(command).should.eventually.have.property(
          'stderr',
          message.slimIsBoolean + usage + '\n\n'
        )
      })
      test('--name is invalid', () => {
        const command = 'create-utility --name 1 --type no-data'
        return runFesCommand(command).should.eventually.have.property(
          'stderr',
          message.nameIsInvalid + usage + '\n\n'
        )
      })
      test('--type is invalid', () => {
        const command = 'create-utility --name a --type badtype'
        return runFesCommand(command).should.eventually.have.property(
          'stderr',
          message.typeIsInvalid + usage + '\n\n'
        )
      })
    })
  })
})

//
//------------------//
// Helper Functions //
//------------------//

function getMessages() {
  return map_object(wrapMessage)({
    expectedArgumentName: getExpectedArgumentNameMessage(),
    invalidCwd: getInvalidCwdMessage(),
    kebabFilenameIsBoolean: getKebabFilenameIsBooleanMessage(),
    nameIsInvalid: getNameIsInvalidMessage(),
    missingArg: getMissingArgMessage(),
    slimIsBoolean: getSlimIsBooleanMessage(),
    typeIsInvalid: getTypeIsInvalidMessage(),
    unexpectedArg: getUnexpectedArgMessage(),
  })
}

function getMissingArgMessage() {
  return tedent(`
    required arguments are missing

    missing: --name, --type
  `)
}

function getUnexpectedArgMessage() {
  return tedent(`
    unexpected argument name given '--invalid'

    allowed names: ${[...validArgs].join(', ')}
  `)
}

function getKebabFilenameIsBooleanMessage() {
  return tedent(`
    '--kebab-filename' is a boolean flag thus should not be passed a value

    provided value: invalid
  `)
}

function getSlimIsBooleanMessage() {
  return tedent(`
    '--slim' is a boolean flag thus should not be passed a value

    provided value: invalid
  `)
}

function getExpectedArgumentNameMessage() {
  return tedent(`
    expected an argument name and instead got 'invalid'

    allowed names: ${[...validArgs].join(', ')}
    arguments given: invalid
  `)
}

function getTypeIsInvalidMessage() {
  return tedent(`
    --type 'badtype' is invalid

    allowed types: ${[...validUtilityTypes].join(', ')}
  `)
}

function getInvalidCwdMessage() {
  return tedent(`
    You must use create-utility in either a fes module, preset, or their
      lib directories

    cwd: /
    failed regex: ${inFesDirectoryRe}
  `)
}

function getNameIsInvalidMessage() {
  return tedent(`
    --name '1' is invalid

    it must pass the regex: ${validNameRe}
  `)
}

function testType(type, optionalArgs = {}) {
  let command = `create-utility --name aB --type ${type}`
  if (optionalArgs['--kebab-filename']) command += ' --kebab-filename'
  if (optionalArgs['--slim']) command += ' --slim'

  const opts = { cwd: tmpFesSuccessDir },
    filename = optionalArgs['--kebab-filename'] ? 'a-b' : 'aB',
    createdFilepath = path.resolve(tmpFesSuccessDir, `lib/${filename}.js`)

  return runFesCommand(command, opts).then(({ stdout = '' }) => {
    const expectedStdout = `lib/${filename}.js was created\n`,
      success = stdout === expectedStdout

    stdout.should.equal(expectedStdout)

    return success && checkCreatedFile()
  })

  // helper functions scoped to 'testType'

  function checkCreatedFile() {
    return readFile(createdFilepath).then(createdFileContents => {
      const expectedContents = optionalArgs['--slim']
        ? expected.noDataSlim
        : expected.successSimple[type]

      createdFileContents.should.equal(expectedContents + '\n')
    })
  }
}
