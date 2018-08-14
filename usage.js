const tedent = require('tedent')
const { version } = require('./package.json')

module.exports = tedent(`
  Description: Some utilities for use with the 'fes' library

  Usage
    fes <an argument>
    fes <command> [command arguments...]

  Arguments
    --help                 print this
    --version              print version

  Commands
    init-module            creates the skeleton for a module
    init-preset            creates the skeleton for a preset
    create-preset-entry    creates the entry for your preset
    create-utility         creates a utility for either your preset or module

  To get help for a command, type 'fes <command> --help'

  Version: ${version}
`)
