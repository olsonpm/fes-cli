const tedent = require('tedent')

module.exports = tedent(`
  Description: Writes index.js and index.pack.min.js
    - index.js is for people who want to consume the module directly via es
      modules. e.g. \`import { utility } from 'fes-module'\`
    - index.pack.min.js is a umd, browser friendly entry point for people who
      want to consume the module in a more traditional way e.g. \`<script src="...>\`

  Usage
    fes write-entries [--ignore-warnings]
    fes write-entries --help

  Optional Arguments
    --ignore-warnings    ignore webpack compilation warnings.  By default
                         warnings prevent the entry files from being written.

  Read more at olsonpm.github.io/fes
`)
