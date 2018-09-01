/* eslint-disable no-console */

//---------//
// Imports //
//---------//

const pify = require('pify')

const path = require('path'),
  tedent = require('tedent'),
  { exec: pExec } = require('child-process-promise')

const usage = require('./usage')

const {
  assignOver,
  discardWhen_object: discardWhen,
  getArrayOfKeys,
  getArrayOfValues,
  getValueAtPath,
  isEmpty,
  isLaden,
  isTruthy,
  keepWhen_object: keepWhen,
  makeApproveHasNoArguments,
  map_array,
  mAppendAll,
  passThrough,
  pFs,
  pickAll,
  readFile,
  reduce_array: reduce,
  resolveAll,
  startsWith,
  then,
} = require('../../helpers')

//
//------//
// Init //
//------//

const nameRe = /^[a-z][a-z-]+$/,
  npmPackageTypes = new Set(['tag', 'version', 'range'])

//
//------//
// Main //
//------//

const hasNone = makeApproveHasNoArguments('initPreset')

Object.assign(initModule, {
  approveArguments: hasNone,
  usage,
})

async function initModule() {
  let pathToModule

  try {
    const result = await promptUser()
    if (result.errorOccurred) return 1

    const promptUserResult = result,
      { moduleName } = promptUserResult

    const errorOccurred = await tryToMakeDirectory(moduleName)
    if (errorOccurred) return 1

    pathToModule = path.resolve(process.cwd(), moduleName)

    const tmp = require('tmp-promise')

    await tmp.withDir(async ({ path: tmpDirPath }) => {
      process.chdir(tmpDirPath)

      await createModule(promptUserResult)
      await moveTmpContentsToModule(pathToModule)
    })

    console.log(`${moduleName} created successfully`)
  } catch (error) {
    return await handleUnexpectedError(error, pathToModule)
  }
}

//
//------------------//
// Helper Functions //
//------------------//

function moveTmpContentsToModule(pathToModule) {
  const globby = require('globby')

  return globby(['*', '.*'], {
    onlyFiles: false,
    expandDirectories: false,
  }).then(files =>
    passThrough(files, [map_array(moveTo(pathToModule)), resolveAll])
  )
}

function moveTo(pathToModule) {
  const del = require('del'),
    pNcp = pify(require('ncp'))

  return async fileName => {
    const src = path.resolve(fileName),
      dest = path.resolve(pathToModule, fileName)

    await pNcp(src, dest)
    return del(src)
  }
}

async function createModule(promptUserResult) {
  const {
    isPreset,
    moduleName,
    npmInstallStrings,
    nonNpmInstallStrings,
    withPackageLock,
  } = promptUserResult

  const dependsOnFesPackages =
    isLaden(npmInstallStrings) || isLaden(nonNpmInstallStrings)

  const maybeWriteNoPackageLock = withPackageLock
    ? undefined
    : pFs.writeFileSync('.npmrc', 'package-lock=false\n')

  await Promise.all([pExec('npm init -f'), maybeWriteNoPackageLock])

  const pathToPackageJson = path.resolve(process.cwd(), 'package.json'),
    npmPackageNames = npmInstallStrings.map(toPackageName)

  await initPresetPackageJson({
    dependsOnFesPackages,
    isPreset,
    moduleName,
    npmPackageNames,
    pathToPackageJson,
  })

  const allPackages = npmInstallStrings.concat(nonNpmInstallStrings),
    command = `npm install olsonpm/fes#0.1.0 ${allPackages.join(' ')}`

  try {
    await pExec(command)
  } catch (error) {
    return handleInstallPackagesError(error, command)
  }

  if (dependsOnFesPackages) {
    const nonNpmPackageNames = isLaden(nonNpmInstallStrings)
      ? getNonNpmPackageNames(nonNpmInstallStrings)
      : []

    await addNonNpmPackagesToFesConfig(nonNpmPackageNames, pathToPackageJson)

    const allPackageNames = npmPackageNames.concat(nonNpmPackageNames)

    console.log('allPackageNames: ' + allPackageNames)

    //
    // TODO write-entries when fes packages are present
    // await require('../write-entries/preset')({
    //   packageNames: allPackageNames,
    // })
    //
  }
}

async function getNonNpmPackageNames(nonNpmInstallStrings) {
  const globby = require('globby')

  const installStringToPackageName = await passThrough(
    './node_modules/*/package.json',
    [globby, then(createInstallStringToPackageName)]
  )

  return passThrough(installStringToPackageName, [
    pickAll(nonNpmInstallStrings),
    getArrayOfValues,
  ])
}

async function addNonNpmPackagesToFesConfig(
  nonNpmPackageNames,
  pathToPackageJson
) {
  const pjsonContents = await readFile(pathToPackageJson)

  const pjson = JSON.parse(pjsonContents)
  mAppendAll(nonNpmPackageNames)(pjson.fes.packages)

  await pFs.writeFile(pathToPackageJson, JSON.stringify(pjson, null, 2))

  return nonNpmPackageNames
}

async function tryToMakeDirectory(moduleName) {
  try {
    await pFs.mkdir(moduleName)
  } catch (e) {
    console.error(
      `\nI can't initialize '${moduleName}' because a file with that name already exists\n`
    )
    return true
  }
}

function toPackageName(npmInstallString) {
  return require('npmPackageArg')(npmInstallString).name
}

//
// This function is a little weird because I couldn't find any documentation on
//   the reserved properties used by npm in the package.json file.  Specifically
//
//   - _requested.raw
//   - _spec
//
//   which both seem to hold the install string.  Per npm's 'npm-package-arg',
//   '_requested.raw' seems to be what we want.  In case it's not though it's
//   easy enough just to include _spec as well in the hash.
//
//   If neither exist then things get awkward because I don't know how else to
//   find the package name from an install string, so in this case we just move
//   and make sure we have the nonNpmPackage names the user asked for.
//
function createInstallStringToPackageName(packageJsonFiles) {
  return passThrough(packageJsonFiles, [
    map_array(readFile),
    resolveAll,
    then(
      reduce((installStringToPackagePath, pjsonContents) => {
        const pjson = JSON.parse(pjsonContents),
          { name } = pjson,
          requestedRaw = getValueAtPath(['_requested', 'raw'])(pjson),
          { _spec } = pjson

        if (requestedRaw) installStringToPackagePath[requestedRaw] = name
        if (_spec && _spec !== requestedRaw)
          installStringToPackagePath[_spec] = name

        return installStringToPackagePath
      }, {})
    ),
  ])
}

function initPresetPackageJson(arg) {
  const {
    dependsOnFesPackages,
    isPreset,
    moduleName,
    npmPackageNames,
    pathToPackageJson,
  } = arg

  const pjson = assignOver(require(pathToPackageJson))({
    main: 'index.pack.min.js',
    module: 'index.js',
    name: moduleName,
    sideEffects: false,
    version: '0.1.0',
    keywords: [isPreset ? 'fes-preset' : 'fes-module'],
  })

  if (dependsOnFesPackages) {
    pjson.fes = { packages: npmPackageNames }
  }

  delete pjson.directories

  return pFs.writeFile(pathToPackageJson, JSON.stringify(pjson, null, 2))
}

function handleInstallPackagesError(error, command) {
  console.error(
    tedent(`
      An error occurred while installing your packages

      The install command ran:
        ${command}

      ${error.stack}
    `)
  )

  return 1
}

async function promptUser() {
  const inquirer = require('inquirer')

  try {
    const isPreset = await promptForPreset()

    const { moduleName } = await inquirer.prompt(getNameQuestion(isPreset))

    const { withPackageLock } = await inquirer.prompt(getPackageLockQuestion())

    const { shouldPromptForPackages } = await inquirer.prompt(
      getShouldPromptForPackagesQuestion(isPreset)
    )

    let npmInstallStrings = [],
      nonNpmInstallStrings = []

    if (shouldPromptForPackages) {
      ;({
        npmInstallStrings,
        nonNpmInstallStrings,
      } = await promptForFesPackages(isPreset))
    }

    return {
      isPreset,
      moduleName: isPreset ? `fes-preset-${moduleName}` : `fes-${moduleName}`,
      npmInstallStrings,
      nonNpmInstallStrings,
      withPackageLock,
    }
  } catch (error) {
    handlePromptError(error)
    return { errorOccurred: true }
  }
}

function promptForPreset() {
  const inquirer = require('inquirer'),
    presetQuestion = getPresetQuestion()

  const description = tedent(`
    ${presetQuestion[0].message}

    A 'preset' is a collection of fes modules and/or utilities that users will
    import directly.

    Read more at olsonpm.github.io/fes
  `)

  console.log(`\n${description}\n`)

  return inquirer.prompt(presetQuestion)
}

function getPresetQuestion() {
  return [
    {
      type: 'confirm',
      name: 'isPreset',
      default: false,
      message: 'is this module a preset?',
    },
  ]
}

function getShouldPromptForPackagesQuestion(isPreset) {
  const moduleOrPreset = isPreset ? 'preset' : 'module'

  return [
    {
      type: 'confirm',
      name: 'shouldPromptForPackages',
      default: isPreset,
      message: `Will your ${moduleOrPreset} depend on other fes packages?`,
    },
  ]
}

function getPackageLockQuestion() {
  return [
    {
      type: 'confirm',
      name: 'withPackageLock',
      default: false,
      message: 'include package-lock.json?',
    },
  ]
}

function getNameQuestion(isPreset) {
  const show = isPreset ? 'fes-preset-(name)' : 'fes-(name)',
    prependWith = isPreset ? 'fes-preset-' : 'fes-'

  return [
    {
      name: 'moduleName',
      message: `Name? ${show}`,
      suffix: '',
      validate: name => {
        if (startsWith('fes-')(name)) {
          return tedent(`
            name cannot start with 'fes-'

            I prepend your module name with '${prependWith}' so '${prependWith}-fes-'
              would be confusing!
          `)
        }
        return nameRe.test(name) || `name must match ${nameRe}`
      },
    },
  ]
}

async function promptForFesPackages(isPreset) {
  const inquirer = require('inquirer'),
    npmExists = require('npm-exists'),
    npmPackageArg = require('npm-package-arg'),
    state = {
      packageNameToIsNpmPackage: {},
    },
    packageQuestion = getPackageQuestion(state, npmExists, npmPackageArg)

  const moduleOrPreset = isPreset ? 'preset' : 'module',
    description = tedent(`
      Enter the packages which will compose your ${moduleOrPreset}. These will be passed
      through \`npm install\` which means github urls, versions, etc. may be used.

      enter 'done' to move on
    `)

  console.log(`\n${description}\n`)

  let hasSubmittedAllModules = false
  while (!hasSubmittedAllModules) {
    const { aPackage } = await inquirer.prompt(packageQuestion)
    hasSubmittedAllModules = aPackage === 'done'
  }

  const npmInstallStrings = passThrough(state.packageNameToIsNpmPackage, [
      keepWhen(isTruthy),
      getArrayOfKeys,
    ]),
    nonNpmInstallStrings = passThrough(state.packageNameToIsNpmPackage, [
      discardWhen(isTruthy),
      getArrayOfKeys,
    ])

  return {
    npmInstallStrings,
    nonNpmInstallStrings,
  }
}

function getPackageQuestion(state, npmExists, npmPackageArg) {
  return [
    {
      name: 'aPackage',
      message: 'fes package:',
      suffix: '',
      async validate(packageName) {
        if (packageName === 'done') return true

        const done = this.async(),
          isNpmPackageSyntax = getIsNpmPackageSyntax(packageName)

        if (isNpmPackageSyntax) {
          const existsOnNpm = await npmExists(packageName)

          if (!existsOnNpm)
            return done(`I couldn't find the package '${packageName}' at npm`)
        }

        const isNpmPackage = isNpmPackageSyntax

        state.packageNameToIsNpmPackage[packageName] = isNpmPackage

        done(null, true)
      },
    },
  ]

  // helper functions scoped to 'getModuleQuestion'

  function getIsNpmPackageSyntax(moduleName) {
    return npmPackageTypes.has(npmPackageArg(moduleName).type)
  }
}

function handlePromptError(error) {
  console.error(
    tedent(`
      An error occurred during the prompt

      ${error.stack}
    `)
  )
}

async function handleUnexpectedError(error, pathToModule) {
  console.error(
    tedent(`
      An unexpected error occurred while creating the preset

      ${error.stack}
    `)
  )

  //
  // I think pathToModule will always exist at this point, but this is both
  //   safer and future proof
  //
  if (pathToModule) {
    try {
      await require('del')(pathToModule, { force: true })
    } catch (error) {
      const message = tedent(`
        ** An error also occurred when trying to remove your module at:
        ${pathToModule}

        This means you will need to delete it yourself

        ${error.stack}
      `)
      console.error(`\n${message}\n`)
    }
  }

  return 1
}

//
//---------//
// Exports //
//---------//

module.exports = initModule
