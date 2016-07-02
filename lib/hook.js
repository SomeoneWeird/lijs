require('babel-register')

var fs = require('fs')

var compile = require('./compiler')

require.extensions['.lijs'] = function (module, filename) {
  var content = fs.readFileSync(filename).toString()
  return module._compile(compile(content), filename)
}
