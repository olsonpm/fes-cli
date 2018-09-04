//---------//
// Imports //
//---------//

const pify = require('pify')

const path = require('path'),
  pFs = pify(require('fs')),
  repeatString = require('repeat-string')

const allSetup = require('./setup')

//
//------//
// Init //
//------//

const tmpDir = path.resolve(__dirname, '../tmp')

//
//------//
// Main //
//------//

const writeIsTruthyWithBigDep = async () => {
  const tmpFesModuleDir = path.resolve(tmpDir, 'fes-module-simple'),
    pathToIsTruthy = path.resolve(tmpFesModuleDir, 'lib/is-truthy.js'),
    pathToBigDependency = path.resolve(tmpFesModuleDir, 'big-dep.js')

  await pFs.writeFile(pathToIsTruthy, allSetup.isTruthyWithBigDependency)

  await pFs.writeFile(pathToBigDependency, 'module.exports = `\n', {
    flag: 'a',
  })
  for (let i = 0; i < 1001; i += 1) {
    await pFs.writeFile(pathToBigDependency, repeatString('a', 250) + '\n', {
      flag: 'a',
    })
  }
  await pFs.writeFile(pathToBigDependency, '\n`\n', {
    flag: 'a',
  })
}

//
//---------//
// Exports //
//---------//

module.exports = { writeIsTruthyWithBigDep }
