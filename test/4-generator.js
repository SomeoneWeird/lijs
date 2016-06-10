/* eslint-env node, mocha */
require('babel-register')

var assert = require('assert')

var tokenizer = require('../lib/tokenizer')
var toAST = require('../lib/ast')
var transform = require('../lib/transform')
var generate = require('../lib/generate')

function getJS (code) {
  var tokens = tokenizer(code)
  var ast = toAST(tokens)
  var ast2 = transform(ast)
  return generate(ast2)
}

describe('Generator', function () {
  it('should generate JS Array', function () {
    let js = getJS("[ 'hello' 42 4.3 ]")
    assert.equal(js, "[\n    'hello',\n    42,\n    4.3\n];")
  })
  it('should generate Function call', function () {
    let js = getJS('(add 5 3 1)')
    assert.equal(js, 'add(5, 3, 1);')
  })
  it('should generate Assignment', function () {
    let js = getJS('$ a 5')
    assert.equal(js, 'var a = 5;')
  })
  it('should generate Assignment where value is function call', function () {
    let js = getJS('$ result (add 5 1)')
    assert.equal(js, 'var result = add(5, 1);')
  })
})
