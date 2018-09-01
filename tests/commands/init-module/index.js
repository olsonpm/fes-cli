//---------//
// Imports //
//---------//

const pify = require('pify')

const chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  chaiSubset = require('chai-subset'),
  del = require('del'),
  makeDir = require('make-dir'),
  path = require('path'),
  pFs = pify(require('fs')),
  tedent = require('tedent')

const runFesCommand = require('../../run-fes-command'),
  usage = require('../../../commands/init-module/usage')

const { mapStringLeaves, wrapMessage } = require('../../helpers'),
  { readFile } = require('../../../helpers')

//
//------//
// Init //
//------//

chai.use(chaiAsPromised).use(chaiSubset)
chai.should()

const message = getMessages(),
  tmpFesSuccessDir = path.resolve(__dirname, '../tmp/fes-tmp')

//
//------//
// Main //
//------//

suite('init-module', () => {
  suite('success', () => {
    setup(() => del(tmpFesSuccessDir).then(() => makeDir(tmpFesSuccessDir)))

    test('no optional arguments', () => {
      const command = 'init-module --name a',
        opts = { cwd: tmpFesSuccessDir },
        fesADir = path.join(tmpFesSuccessDir, 'fes-a')

      return runFesCommand(command, opts)
        .then(result => {
          result.should.have.property('stdout', 'fes-a was created\n')

          return Promise.all([
            pFs.readdir(fesADir),
            readFile(path.join(fesADir, 'package.json')),
            readFile(path.join(fesADir, '.npmrc')),
          ])
        })
        .then(validateDirectory)
    })
    test('with package lock', () => {
      const command = 'init-module --with-package-lock --name a',
        opts = { cwd: tmpFesSuccessDir },
        fesADir = path.join(tmpFesSuccessDir, 'fes-a')

      return runFesCommand(command, opts)
        .then(result => {
          result.should.have.property('stdout', 'fes-a was created\n')
          return Promise.all([
            pFs.readdir(fesADir),
            readFile(path.join(fesADir, 'package.json')),
          ])
        })
        .then(validateDirectory)
    })
  })

  suite('errors', () => {
    test('--with-package-lock is a boolean', () => {
      const command = 'init-module --with-package-lock invalid --name a '
      return runFesCommand(command).should.eventually.have.property(
        'stderr',
        message.withPackageLockIsBoolean + usage + '\n\n'
      )
    })
    test('invalid npm package name - one reason', () => {
      const command = 'init-module --name fes-T'

      return runFesCommand(command).should.eventually.have.property(
        'stderr',
        message.invalidNpmName.oneReason + usage + '\n\n'
      )
    })
    test('invalid npm package name - multiple reasons', () => {
      const command = "init-module --name 'fes-T '"

      return runFesCommand(command).should.eventually.have.property(
        'stderr',
        message.invalidNpmName.multipleReasons + usage + '\n\n'
      )
    })
    test('invalid npm package name - with note', () => {
      const command = 'init-module --name T'

      return runFesCommand(command).should.eventually.have.property(
        'stderr',
        message.invalidNpmName.withNote + usage + '\n\n'
      )
    })
    test("cannot start with 'fes-preset'", () => {
      const command = 'init-module --name fes-preset-a'

      return runFesCommand(command).should.eventually.have.property(
        'stderr',
        message.cantStartWithFesPreset + usage + '\n\n'
      )
    })
    test("cannot start with 'preset'", () => {
      const command = 'init-module --name preset-a'

      return runFesCommand(command).should.eventually.have.property(
        'stderr',
        message.cantStartWithPreset + usage + '\n\n'
      )
    })
    test('file exists', () => {
      const command = 'init-module --name a',
        opts = { cwd: tmpFesSuccessDir }

      return del(tmpFesSuccessDir)
        .then(() => makeDir(path.resolve(tmpFesSuccessDir, 'fes-a')))
        .then(() => runFesCommand(command, opts))
        .then(result => {
          result.should.have.property('stderr', message.fileExists)
        })
        .finally(() => del(tmpFesSuccessDir))
    })
  })
})

//
//------------------//
// Helper Functions //
//------------------//

function getMessages() {
  const messagesWithUsage = mapStringLeaves(wrapMessage)({
    cantStartWithFesPreset: getCantStartWithFesPresetMessage(),
    cantStartWithPreset: getCantStartWithPresetMessage(),
    invalidNpmName: {
      oneReason: getInvalidNpmNameMessage(),
      multipleReasons: getInvalidNpmNameMultipleReasonsMessage(),
      withNote: getInvalidNpmNameWithNoteMessage(),
    },
    withPackageLockIsBoolean: getWithPackageLockIsBooleanMessage(),
  })

  return Object.assign(messagesWithUsage, {
    fileExists: getFileExistsMessage(),
  })
}

function getInvalidNpmNameMessage() {
  return tedent(`
    the name 'fes-T' is not a valid npm package name

    reason: cannot contain capital letters
  `)
}

function getInvalidNpmNameMultipleReasonsMessage() {
  return tedent(`
    the name 'fes-T ' is not a valid npm package name

    reasons:
      can only contain URL-friendly characters
      cannot contain capital letters
  `)
}

function getInvalidNpmNameWithNoteMessage() {
  return tedent(`
    the name 'fes-T' is not a valid npm package name
    ** keep in mind I prefix your module with 'fes-'

    reason: cannot contain capital letters
  `)
}

function getCantStartWithFesPresetMessage() {
  return tedent(`
    the name 'fes-preset-a' cannot start with 'fes-preset' because this is a
      module not a preset.
  `)
}

function getCantStartWithPresetMessage() {
  return tedent(`
    the name 'preset-a' cannot start with 'preset'.  Keep in mind I prepend
      'fes-' to your name, and 'fes-preset*' is an invalid name for
      a module.
  `)
}

function getFileExistsMessage() {
  return "\nI can't initialize 'fes-a' because a file with that name already exists\n\n"
}

function getWithPackageLockIsBooleanMessage() {
  return tedent(`
    '--with-package-lock' is a boolean flag thus should not be passed a value

    provided value: invalid
  `)
}

function validateDirectory([files, pjsonContents, npmrcContents]) {
  if (npmrcContents !== undefined) {
    files.should.have.members(['.npmrc', 'lib', 'package.json'])
  } else {
    files.should.have.members(['lib', 'package.json'])
  }

  const pjson = JSON.parse(pjsonContents)
  pjson.should.containSubset({
    name: 'fes-a',
    version: '0.1.0',
    description: '',
    main: 'index.compat.pack.js',
    scripts: {
      test: 'echo "Error: no test specified" && exit 1',
    },
    keywords: ['fes-module'],
    author: '',
    license: 'ISC',
    module: 'index.js',
    sideEffects: false,
  })

  pjson.should.have.keys([
    'author',
    'description',
    'keywords',
    'license',
    'main',
    'module',
    'name',
    'scripts',
    'sideEffects',
    'version',
  ])

  if (npmrcContents !== undefined) {
    npmrcContents.should.equal('package-lock=false\n')
  }
}
