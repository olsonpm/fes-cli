//---------//
// Imports //
//---------//

const pify = require('pify')

const path = require('path'),
  pFs = pify(require('fs'))

const expected = require('./expected'),
  allSetup = require('./setup'),
  runFesCommand = require('../../run-fes-command')

//
//------//
// Main //
//------//

suite('invalid config', () => {
  const tmpDir = path.resolve(__dirname, '../tmp'),
    tmpFesModuleDir = path.resolve(tmpDir, 'fes-module-simple'),
    setup = allSetup.invalidConfig

  const { errorMessage } = expected

  test('missing and unexpected keys - package.json', async () => {
    const pathToConfig = path.resolve(tmpFesModuleDir, 'package.json'),
      { packageJsonContents } = setup.missingAndUnexpectedKeys

    await pFs.writeFile(pathToConfig, packageJsonContents)

    return runFesCommand('write-entries').should.eventually.have.property(
      'stderr',
      errorMessage.getMissingAndUnexpectedKeys('package.json')
    )
  })

  test('missing and unexpected keys - fes.config.js', async () => {
    const pathToConfig = path.resolve(tmpFesModuleDir, 'fes.config.js'),
      { cjsContents, esmContents } = setup.missingAndUnexpectedKeys

    await pFs.writeFile(pathToConfig, cjsContents)
    await runFesCommand('write-entries').should.eventually.have.property(
      'stderr',
      errorMessage.getMissingAndUnexpectedKeys('fes.config.js')
    )

    await pFs.writeFile(pathToConfig, esmContents)
    await runFesCommand('write-entries').should.eventually.have.property(
      'stderr',
      errorMessage.getMissingAndUnexpectedKeys('fes.config.js')
    )
  })

  test('invalid packages', async () => {
    const pathToConfig = path.resolve(tmpFesModuleDir, 'package.json'),
      { mustAllBeStrings, mustBeArray, mustBeLaden } = setup

    await pFs.writeFile(pathToConfig, mustBeArray)
    await runFesCommand('write-entries').should.eventually.have.property(
      'stderr',
      errorMessage.invalidPackages.mustBeArray
    )

    await pFs.writeFile(pathToConfig, mustBeLaden)
    await runFesCommand('write-entries').should.eventually.have.property(
      'stderr',
      errorMessage.invalidPackages.mustBeLaden
    )

    await pFs.writeFile(pathToConfig, mustAllBeStrings)
    await runFesCommand('write-entries').should.eventually.have.property(
      'stderr',
      errorMessage.invalidPackages.mustAllBeStrings
    )
  })
})
