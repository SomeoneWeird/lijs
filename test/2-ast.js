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
  describe('Literals', function () {
    describe('Literal', function () {
      it('should generate AST for Literal', function () {
        testAST('hello', [ {
          type: 'Literal',
          value: 'hello'
        } ])
      })
    })
    describe('NumberLiteral', function () {
      it('should generate AST for NumberLiteral', function () {
        testAST('5', [ {
          type: 'NumberLiteral',
          value: '5'
        } ])
      })
    })
    describe('FloatLiteral', function () {
      it('should generate AST for FloatLiteral', function () {
        testAST('5.3', [ {
          type: 'FloatLiteral',
          value: '5.3'
        } ])
      })
    })
    describe('StringLiteral', function () {
      it('should generate AST for StringLiteral', function () {
        testAST("'hello'", [ {
          type: 'StringLiteral',
          value: 'hello'
        } ])
      })
    })
  })
  describe('LineBreak', function () {
    it('should ignore LineBreak', function () {
      testAST('\n\n\n', [])
    })
  })
  describe('Assignment', function () {
    it('should error if variable name is invalid', function () {
      assert.throws(function () {
        testAST('$ 3 1')
      }, /Variable name must be a literal/)
    })
    it('should generate AST for Number Assignment', function () {
      testAST('$ a 1', [ {
        type: 'Assignment',
        name: 'a',
        value: {
          type: 'NumberLiteral',
          value: '1'
        }
      } ])
    })
    it('should generate AST for Array Assignment', function () {
      testAST('$ a [ b c d ]', [ {
        type: 'Assignment',
        name: 'a',
        value: {
          type: 'Array',
          elements: [ {
            type: 'Literal',
            value: 'b'
          }, {
            type: 'Literal',
            value: 'c'
          }, {
            type: 'Literal',
            value: 'd'
          } ]
        }
      } ])
    })
    it('should error if value is another Assignment', function () {
      assert.throws(function () {
        testAST('$ a $ b 1')
      }, /Variable value cannot be assignment/)
    })
  })
})
