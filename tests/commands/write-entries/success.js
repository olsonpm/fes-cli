//---------//
// Imports //
//---------//

const pify = require('pify')

const del = require('del'),
  makeDir = require('make-dir'),
  path = require('path'),
  pNcp = pify(require('ncp'))

const expected = require('./expected'),
  runFesCommand = require('../../run-fes-command')

const { SourceMapConsumer } = require('source-map'),
  { writeIsTruthyWithBigDep } = require('./helpers'),
  { noop, readFile } = require('../../../helpers')

//
//------//
// Init //
//------//

const tmpDir = path.resolve(__dirname, '../tmp')

//
//------//
// Main //
//------//

function testSuccessCases() {
  //
  // on my machine 'write-entries' takes ~2.5 seconds.  10 is conservative for
  //   less fortunate machines
  //
  this.timeout(10000)

  setup(async () => {
    await del(tmpDir, { force: true }).catch(noop)
    await makeDir(tmpDir)
  })
  teardown(async () => {
    await del(tmpDir, { force: true }).catch(noop)
    //
    // this is only here because when the current working directory is
    //   non-existent then ncp throws up
    //
    process.chdir(__dirname)
  })

  test('simple module', async () => {
    const tmpFesModuleDir = path.resolve(tmpDir, 'fes-module-simple'),
      fesModuleDir = path.resolve(__dirname, 'setup/fes-module-simple')

    await pNcp(fesModuleDir, tmpFesModuleDir)
    process.chdir(tmpFesModuleDir)

    await runFesCommand('write-entries').should.eventually.have.property(
      'stdout',
      'Your entry files were created successfully\n'
    )

    await readFile('index.js').should.eventually.equal(
      expected.simpleModuleIndexJs
    )

    const { isTruthy } = require(path.resolve(
      tmpFesModuleDir,
      'index.pack.min.js'
    ))
    isTruthy('a').should.be.true
    isTruthy('').should.be.false

    const sourceMapContents = await readFile('index.pack.min.js.map')

    const indexJsSourceContent = await SourceMapConsumer.with(
      sourceMapContents,
      null,
      consumer => consumer.sourceContentFor('webpack://fes/index.js')
    )

    indexJsSourceContent.should.equal(expected.simpleModuleIndexJs)
  })

  test('simple module - ignore entry size warning', async () => {
    this.timeout(10000)

    const tmpFesModuleDir = path.resolve(tmpDir, 'fes-module-simple'),
      fesModuleDir = path.resolve(__dirname, 'setup/fes-module-simple')

    await pNcp(fesModuleDir, tmpFesModuleDir)
    process.chdir(tmpFesModuleDir)

    await writeIsTruthyWithBigDep()

    await runFesCommand(
      'write-entries --ignore-warnings'
    ).should.eventually.have.property(
      'stdout',
      'Your entry files were created successfully\n'
    )

    await readFile('index.js').should.eventually.equal(
      expected.simpleModuleIndexJs
    )

    const { isTruthy } = require(path.resolve(
      tmpFesModuleDir,
      'index.pack.min.js'
    ))
    isTruthy('a').should.be.true
    isTruthy('').should.be.false

    const sourceMapContents = await readFile('index.pack.min.js.map')

    const indexJsSourceContent = await SourceMapConsumer.with(
      sourceMapContents,
      null,
      consumer => consumer.sourceContentFor('webpack://fes/index.js')
    )

    indexJsSourceContent.should.equal(expected.simpleModuleIndexJs)
  })

  test('simple preset', async () => {
    const tmpFesPresetDir = path.resolve(tmpDir, 'fes-preset-simple'),
      fesPresetDir = path.resolve(__dirname, 'setup/fes-preset-simple')

    await pNcp(fesPresetDir, tmpFesPresetDir)
    process.chdir(tmpFesPresetDir)

    await runFesCommand('write-entries').should.eventually.have.property(
      'stdout',
      'Your entry files were created successfully\n'
    )

    await readFile('index.js').should.eventually.equal(
      expected.simplePresetIndexJs
    )

    const { isTruthy, test1, test2 } = require(path.resolve(
      tmpFesPresetDir,
      'index.pack.min.js'
    ))
    isTruthy('a').should.be.true
    isTruthy('').should.be.false
    test1(null).should.equal('test1')
    test2(null).should.equal('test2')

    const sourceMapContents = await readFile('index.pack.min.js.map')

    const indexJsSourceContent = await SourceMapConsumer.with(
      sourceMapContents,
      null,
      consumer => consumer.sourceContentFor('webpack://fes/index.js')
    )

    indexJsSourceContent.should.equal(expected.simplePresetIndexJs)
  })
}

//
//---------//
// Exports //
//---------//

module.exports = testSuccessCases
