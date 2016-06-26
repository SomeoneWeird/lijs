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
    it('should be able to generate object children', function () {
      testTransform('a.b.c.d', [ {
        'type': 'MemberExpression',
        'object': {
          'type': 'MemberExpression',
          'object': {
            'type': 'MemberExpression',
            'object': {
              'type': 'Identifier',
              'name': 'a'
            },
            'property': {
              'type': 'Identifier',
              'name': 'b'
            }
          },
          'property': {
            'type': 'Identifier',
            'name': 'c'
          }
        },
        'property': {
          'type': 'Identifier',
          'name': 'd'
        }
      } ])
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
  describe('FunctionDeclaration', function () {
    it('should generate FunctionDeclaration from FunctionDefinition', function () {
      testTransform('def addone [ number ] (add number 1)', [ {
        type: 'FunctionDeclaration',
        id: {
          type: 'Identifier',
          name: 'addone'
        },
        params: [ {
          type: 'Identifier',
          name: 'number'
        } ],
        defaults: [],
        body: {
          type: 'BlockStatement',
          body: [ {
            type: 'ReturnStatement',
            argument: {
              type: 'CallExpression',
              callee: {
                type: 'Identifier',
                name: 'add'
              },
              arguments: [ {
                type: 'Identifier',
                name: 'number'
              }, {
                type: 'Literal',
                value: 1,
                raw: '1'
              } ]
            }
          } ]
        }
      } ])
    })
    it('should allow multiple body entries (and should set last to return)', function () {
      testTransform('def log [ one two ] {\n  $ res (add one two)\n  (console.log res)\n}', [ {
        type: 'FunctionDeclaration',
        id: {
          type: 'Identifier',
          name: 'log'
        },
        params: [ {
          type: 'Identifier',
          name: 'one'
        }, {
          type: 'Identifier',
          name: 'two'
        } ],
        defaults: [],
        body: {
          type: 'BlockStatement',
          body: [ {
            type: 'VariableDeclaration',
            declarations: [ {
              type: 'VariableDeclarator',
              id: {
                type: 'Identifier',
                name: 'res'
              },
              init: {
                type: 'CallExpression',
                callee: {
                  type: 'Identifier',
                  name: 'add'
                },
                arguments: [ {
                  type: 'Identifier',
                  name: 'one'
                }, {
                  type: 'Identifier',
                  name: 'two'
                } ]
              }
            } ],
            kind: 'var'
          }, {
            type: 'ReturnStatement',
            argument: {
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                object: {
                  type: 'Identifier',
                  name: 'console'
                },
                property: {
                  type: 'Identifier',
                  name: 'log'
                }
              },
              arguments: [ {
                type: 'Identifier',
                name: 'res'
              } ]
            }
          } ]
        }
      } ])
    })
  })
  describe('ImportStatement CallExpression', function () {
    it('should generate CallExpression from ImportStatement', function () {
      testTransform("use 'hello'", [ {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: 'require'
          },
          arguments: [
            {
              type: 'Literal',
              value: 'hello',
              raw: "'hello'"
            }
          ]
        }
      } ])
    })
    it('should generate Assignment + CallExpression from ImportStatement', function () {
      testTransform("use 'hello1' as hello2", [ {
        type: 'ExpressionStatement',
        expression: {
          type: 'VariableDeclaration',
          declarations: [ {
            type: 'VariableDeclarator',
            id: {
              type: 'Identifier',
              name: 'hello2'
            },
            init: {
              type: 'CallExpression',
              callee: {
                type: 'Identifier',
                name: 'require'
              },
              arguments: [ {
                type: 'Literal',
                value: 'hello1',
                raw: "'hello1'"
              } ]
            }
          } ],
          kind: 'var'
        }
      }])
    })
  })
})
