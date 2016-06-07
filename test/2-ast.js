/* eslint-env node, mocha */
require('babel-register')

var assert = require('assert')

var tokenizer = require('../lib/tokenizer')
var toAST = require('../lib/ast')

function getBaseAST (code) {
  var tokens = tokenizer(code)
  var ast = toAST(tokens)
  assert.equal(ast.type, 'Program')
  return ast.body
}

function testAST (code, m) {
  var ast = getBaseAST(code)
  assert.deepEqual(ast, m)
}

describe('AST', function () {
  describe('Array', function () {
    it('should generate blank array', function () {
      testAST('[]', [ {
        type: 'Array',
        elements: []
      } ])
    })
    it('should generate array of NumberLiterals', function () {
      testAST('[ 1 2 3 4 ]', [ {
        type: 'Array',
        elements: [ {
          type: 'NumberLiteral',
          value: '1'
        }, {
          type: 'NumberLiteral',
          value: '2'
        }, {
          type: 'NumberLiteral',
          value: '3'
        }, {
          type: 'NumberLiteral',
          value: '4'
        } ]
      } ])
    })
    it('should generate an array of StringLiterals', function () {
      testAST("[ 'hello' 'world' ]", [ {
        type: 'Array',
        elements: [ {
          type: 'StringLiteral',
          value: 'hello'
        }, {
          type: 'StringLiteral',
          value: 'world'
        } ]
      } ])
    })
    it('should be able to generate nested arrays', function () {
      testAST('[ [ 1 ] 2 ]', [ {
        type: 'Array',
        elements: [ {
          type: 'Array',
          elements: [ {
            type: 'NumberLiteral',
            value: '1'
          } ]
        }, {
          type: 'NumberLiteral',
          value: '2'
        } ]
      } ])
    })
  })
})
