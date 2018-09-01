const tedent = require('tedent')

module.exports = tedent(`
  Description: Creates the skeleton for a fes utility in your ./lib directory

  Usage
    fes create-utility --type <a utility type> [--slim]
    fes create-utility --help

  Required Arguments
    --name              the name of your utility.  Must be javascript
                        variable friendly
    --type              the type of utility to create.  One of four values:
                        just-data, supported-data, no-data, array-of-data

  Optional Arguments
    --kebab-filename    a flag which creates a kebab-cased filename instead of
                        one matching the utility name
    --slim              a flag which removes the documentation comments at
                        the end

  Read more at olsonpm.github.io/fes
`)
