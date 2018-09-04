//---------//
// Imports //
//---------//

const path = require('path')

const { discardLast, isLaden } = require('../../helpers')

//
//------//
// Main //
//------//

const initHandlebars = () => {
  const handlebars = require('handlebars')

  handlebars.registerHelper('ifIsLaden', function(something, options) {
    return isLaden(something) ? options.fn(this) : options.inverse(this)
  })

  handlebars.registerHelper('removeExtension', removeExtension)

  return handlebars
}

//
//------------------//
// Helper Functions //
//------------------//

function removeExtension(fileName) {
  return discardLast(path.extname(fileName).length)(fileName)
}

//
//---------//
// Exports //
//---------//

module.exports = initHandlebars
