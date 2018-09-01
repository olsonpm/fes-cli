#! /usr/bin/env node

/* eslint-disable no-console */

//---------//
// Imports //
//---------//

const camelcase = require('camelcase'),
  tedent = require('tedent')

const cliCommands = require('./commands'),
  usage = require('./usage')

const { version } = require('./package.json'),
  { contains, dashelize, join, truncateToNChars } = require('./helpers')

//
//------//
// Init //
//------//

const consoleLog = console.log.bind(console),
  consoleError = console.error.bind(console),
  allArgs = process.argv.slice(2),
  [commandOrRootArg, ...commandArgs] = allArgs,
  validRootArgs = new Set(['--help', '--version']),
  validCommands = new Set(Object.keys(cliCommands).map(dashelize))

//
//------//
// Main //
//------//

if (!allArgs.length) printUsageAndExit(0)

let commandEntered, rootArg

if (isArgument(commandOrRootArg)) {
  rootArg = commandOrRootArg
  validateRootArg(rootArg)

  // woo woo no errors

  if (rootArg === '--help') printUsageAndExit(0)
  else {
    console.log(version)
    process.exit(0)
  }
} else {
  commandEntered = commandOrRootArg
  if (!validCommands.has(commandEntered)) {
    console.error(`\nYou passed an invalid command '${commandEntered}'\n`)
    printUsageAndExit(1)
  }

  const command = cliCommands[camelcase(commandEntered)]()

  if (commandArgs.length === 1 && commandArgs[0] === '--help') {
    console.log(`\n${command.usage}\n`)
    process.exit(0)
  } else if (contains('--help')(commandArgs)) {
    const errorMessage = '--help must be the only argument when passed'
    console.error(`\n${errorMessage}\n\n\n${command.usage}\n`)
    process.exit(1)
  }

  const { argumentsObject, errorMessage } = command.approveArguments(
    commandArgs
  )
  if (errorMessage) {
    console.error(`\n${errorMessage}\n\n\n${command.usage}\n`)
    process.exit(1)
  }

  // yeeeeehaaawww no errors

  command(argumentsObject)
    .then(exitCode => {
      process.exit(exitCode || 0)
    })
    .catch(unhandledRejection => {
      console.error(
        tedent(`
          The following error was unhandled

          ${unhandledRejection}
        `)
      )
      process.exit(1)
    })
}

//
//------------------//
// Helper Functions //
//------------------//

function validateRootArg(rootArg) {
  if (!validRootArgs.has(rootArg)) {
    console.error()
    console.error(
      tedent(`
        The argument ${rootArg} was unexpected

        allowed arguments: ${join(', ')(validRootArgs)}
      `)
    )
    console.error()
    printUsageAndExit(1)
  } else if (allArgs.length > 1) {
    const unexpectedArgs = allArgs.slice(1).join(', ')
    console.error()
    console.error(
      tedent(`
        Only one root argument allowed

        additional arguments provided: ${truncateToNChars(30)(unexpectedArgs)}
      `)
    )
    console.error()
    printUsageAndExit(1)
  }
}

function isArgument(someString) {
  return someString[0] === '-' && someString[1] === '-'
}

function printUsageAndExit(exitCode) {
  const log = exitCode ? consoleError : consoleLog

  log(`\n${usage}\n`)

  process.exit(exitCode)
}
