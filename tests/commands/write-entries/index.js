//---------//
// Imports //
//---------//

const pify = require('pify')

const chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  del = require('del'),
  makeDir = require('make-dir'),
  path = require('path'),
  pFs = pify(require('fs')),
  pNcp = pify(require('ncp'))

const expected = require('./expected'),
  runFesCommand = require('../../run-fes-command'),
  testSuccessCases = require('./success'),
  allSetup = require('./setup')

const { writeIsTruthyWithBigDep } = require('./helpers'),
  { noop } = require('../../../helpers')

// usage = require('../../../commands/write-entries/usage')

//
//------//
// Init //
//------//

chai.use(chaiAsPromised)
chai.should()

// const fes = require('esm')(module)('fes')

const tmpDir = path.resolve(__dirname, '../tmp')

//
//------//
// Main //
//------//

suite('write-entries', function writeEntries() {
  suite('success', testSuccessCases)

  suite('errors', () => {
    const { errorMessage } = expected

    test('invalid cwd', () => {
      const opts = { cwd: '/' }

      return runFesCommand(
        'write-entries',
        opts
      ).should.eventually.have.property('stderr', errorMessage.invalidCwd)
    })

    suite('simple module', () => {
      const tmpFesModuleDir = path.resolve(tmpDir, 'fes-module-simple'),
        fesModuleDir = path.resolve(__dirname, 'setup/fes-module-simple')

      setup(async () => {
        await del(tmpDir, { force: true }).catch(noop)
        await makeDir(tmpDir)
        await pNcp(fesModuleDir, tmpFesModuleDir)
        process.chdir(tmpFesModuleDir)
      })
      teardown(async () => {
        await del(tmpDir, { force: true }).catch(noop)
        //
        // this is only here because when the current working directory is
        //   non-existent then ncp throws up
        //
        process.chdir(__dirname)
      })

      require('./invalid-config')

      test('no utilities', async () => {
        await del(path.resolve(tmpFesModuleDir, 'lib'))

        return runFesCommand('write-entries').should.eventually.have.property(
          'stderr',
          errorMessage.noUtilities
        )
      })

      test('is-truthy has no name', async () => {
        const pathToIsTruthy = path.resolve(tmpFesModuleDir, 'lib/is-truthy.js')

        await pFs.writeFile(pathToIsTruthy, allSetup.isTruthyNoNameContents)

        return runFesCommand('write-entries').should.eventually.have.property(
          'stderr',
          errorMessage.getUtilityHasNoName(pathToIsTruthy)
        )
      })

      test('is-truthy has invalid name', async () => {
        const pathToIsTruthy = path.resolve(tmpFesModuleDir, 'lib/is-truthy.js')

        await pFs.writeFile(
          pathToIsTruthy,
          allSetup.isTruthyInvalidNameContents
        )

        return runFesCommand('write-entries').should.eventually.have.property(
          'stderr',
          errorMessage.getUtilityHasInvalidName(pathToIsTruthy)
        )
      })

      test('duplicate isTruthy utilities', async () => {
        const pathToIsFalsey = path.resolve(tmpFesModuleDir, 'lib/is-falsey.js')

        await pFs.writeFile(pathToIsFalsey, allSetup.isFalseyWithIncorrectName)

        return runFesCommand('write-entries').should.eventually.have.property(
          'stderr',
          errorMessage.duplicateLibUtilityNames
        )
      })

      test('webpack entry size exceeded', async function entrySizeExceeded() {
        this.timeout(10000)

        await writeIsTruthyWithBigDep()

        return runFesCommand('write-entries').should.eventually.have.property(
          'stderr',
          errorMessage.entrySizeWarning
        )
      })
    })

    suite('simple preset', () => {
      const tmpFesPresetDir = path.resolve(tmpDir, 'fes-preset-simple'),
        fesPresetDir = path.resolve(__dirname, 'setup/fes-preset-simple')

      setup(async () => {
        await del(tmpDir, { force: true }).catch(noop)
        await makeDir(tmpDir)
        await pNcp(fesPresetDir, tmpFesPresetDir)
        process.chdir(tmpFesPresetDir)
      })
      teardown(async () => {
        await del(tmpDir, { force: true }).catch(noop)
        //
        // this is only here because when the current working directory is
        //   non-existent then ncp throws up
        //
        process.chdir(__dirname)
      })

      test('no node_modules', async () => {
        await del(path.resolve(tmpFesPresetDir, 'node_modules'))

        return runFesCommand('write-entries').should.eventually.have.property(
          'stderr',
          errorMessage.noNodeModules
        )
      })

      test('missing packages', async () => {
        await del(path.resolve(tmpFesPresetDir, 'node_modules', '*'))

        return runFesCommand('write-entries').should.eventually.have.property(
          'stderr',
          errorMessage.missingPackages
        )
      })

      test('test1 has no name', async () => {
        const pathToTest1 = path.resolve(
          tmpFesPresetDir,
          'node_modules/fes-test1/lib/test1.js'
        )

        await pFs.writeFile(pathToTest1, allSetup.test1NoNameContents)

        return runFesCommand('write-entries').should.eventually.have.property(
          'stderr',
          errorMessage.getUtilityHasNoName(pathToTest1)
        )
      })

      test('test1 has invalid name', async () => {
        const pathToTest1 = path.resolve(
          tmpFesPresetDir,
          'node_modules/fes-test1/lib/test1.js'
        )

        await pFs.writeFile(pathToTest1, allSetup.test1InvalidNameContents)

        return runFesCommand('write-entries').should.eventually.have.property(
          'stderr',
          errorMessage.getUtilityHasInvalidName(pathToTest1)
        )
      })
    })

    // suite('invalid arguments', () => {
    //   test('missing required arguments', () => {
    //     return runFesCommand('create-utility').should.eventually.have.property(
    //       'stderr',
    //       message.missingArg + usage + '\n\n'
    //     )
    //   })
    // })
  })
})
