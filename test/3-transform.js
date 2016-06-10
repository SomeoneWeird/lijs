/* eslint-env node, mocha */
require('babel-register')

var assert = require('assert')

var tokenizer = require('../lib/tokenizer')
var toAST = require('../lib/ast')
var transform = require('../lib/transform')

function testTransform (code, m) {
  var tokens = tokenizer(code)
  var ast = toAST(tokens)
  var ast2 = transform(ast)
  assert.deepEqual(ast2.body, m)
}

describe('Transform', function () {
  describe('Literals', function () {
    describe('StringLiteral', function () {
      it('should generate Literal from StringLiteral', function () {
        testTransform("'hello'", [ {
          type: 'Literal',
          value: 'hello',
          raw: "'hello'"
        } ])
      })
    })
    describe('NumberLiteral', function () {
      it('should generate Literal from NumberLiteral', function () {
        testTransform('1', [ {
          type: 'Literal',
          value: 1,
          raw: '1'
        } ])
      })
    })
    describe('FloatLiteral', function () {
      it('should generate Literal from FloatLiteral', function () {
        testTransform('1.2', [ {
          type: 'Literal',
          value: 1.2,
          raw: '1.2'
        } ])
      })
    })
  })
  describe('CallExpression', function () {
    it('should generate CallExpression from FunctionCall', function () {
      testTransform('(a 1 2)', [ {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: 'a'
          },
          arguments: [ {
            type: 'Literal',
            value: 1,
            raw: '1'
          }, {
            type: 'Literal',
            value: 2,
            raw: '2'
          } ]
        }
      } ])
    })
  })
  describe('VariableDeclaration', function () {
    it('should generate VariableDeclaration from Assignment', function () {
      testTransform('$ a 5', [ {
        type: 'VariableDeclaration',
        declarations: [ {
          type: 'VariableDeclarator',
          id: {
            type: 'Identifier',
            name: 'a'
          },
          init: {
            type: 'Literal',
            value: 5,
            raw: '5'
          }
        } ],
        kind: 'var'
      } ])
    })
  })
})
