const tedent = require('tedent')
const { version } = require('./package.json')

module.exports = tedent(`
  Description: Utilities for use with the 'fes' library

  Usage
    fes <an argument>
    fes <command> [command arguments...]

  Arguments
    --help            print this
    --version         print version

  Commands
    init-module       walks you through a fes module initialization
    write-entries     writes the entry files for your fes package
    create-utility    creates a utility for your fes package

  To get help for a command, type 'fes <command> --help'

  Version: ${version}
`)
