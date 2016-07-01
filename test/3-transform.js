/* eslint-env node, mocha */
require('babel-register')

var assert = require('assert')

var tokenizer = require('../lib/tokenizer')
var toAST = require('../lib/ast')
var transform = require('../lib/transform')

function testTransform (code, m, v) {
  var tokens = tokenizer(code)
  var ast = toAST(tokens)
  var ast2 = transform(ast)
  if (m) {
    assert.deepEqual(ast2.body, m)
  }
  if (v) {
    assert.deepEqual(ast2._variables, v, 'Variable check mismatch')
  }
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
        type: 'MemberExpression',
        computed: false,
        object: {
          type: 'MemberExpression',
          computed: false,
          object: {
            type: 'MemberExpression',
            computed: false,
            object: {
              type: 'Identifier',
              name: 'a'
            },
            property: {
              type: 'Identifier',
              name: 'b'
            }
          },
          property: {
            type: 'Identifier',
            name: 'c'
          }
        },
        property: {
          type: 'Identifier',
          name: 'd'
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
      } ], [ 'a' ])
    })
    it('should track variable declarations', function () {
      let v = [ 'a', 'abcd', 'fepjp', 'wfiwepowpiqj', 'qdoiqwndowinhefoih' ]
      for (var i = 0; i < v.length; i++) {
        testTransform('$ ' + v[i] + ' 5', null, [ v[i] ])
      }
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
                computed: false,
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
      }], [ 'hello2' ])
    })
  })
  describe('ExportStatement', function () {
    it('should generate Assignment from ExportStatement', function () {
      testTransform('export lol', [ {
        type: 'ExpressionStatement',
        expression: {
          type: 'AssignmentExpression',
          operator: '=',
          left: {
            type: 'MemberExpression',
            computed: false,
            object: {
              type: 'Identifier',
              name: 'module'
            },
            property: {
              type: 'Identifier',
              name: 'exports'
            }
          },
          right: {
            type: 'Identifier',
            name: 'lol'
          }
        }
      }])
    })
  })
  describe('Iterator', function () {
    it('should generate AST for Iterator for variable', function () {
      testTransform('@arr { (console.log item) }', [ {
        type: 'ForStatement',
        init: {
          type: 'VariableDeclaration',
          declarations: [ {
            type: 'VariableDeclarator',
            id: {
              type: 'Identifier',
              name: 'i'
            },
            init: {
              type: 'Literal',
              value: 0,
              raw: '0'
            }
          } ],
          kind: 'var'
        },
        test: {
          type: 'BinaryExpression',
          operator: '<',
          left: {
            type: 'Identifier',
            name: 'i'
          },
          right: {
            type: 'MemberExpression',
            computed: false,
            object: {
              type: 'Identifier',
              name: 'arr'
            },
            property: {
              type: 'Identifier',
              name: 'length'
            }
          }
        },
        update: {
          type: 'UpdateExpression',
          operator: '++',
          argument: {
            type: 'Identifier',
            name: 'i'
          },
          prefix: false
        },
        body: {
          type: 'BlockStatement',
          body: [ {
            type: 'VariableDeclaration',
            declarations: [ {
              type: 'VariableDeclarator',
              id: {
                type: 'Identifier',
                name: 'item'
              },
              init: {
                type: 'MemberExpression',
                computed: true,
                object: {
                  type: 'Identifier',
                  name: 'arr'
                },
                property: {
                  type: 'Identifier',
                  name: 'i'
                }
              }
            } ],
            kind: 'var'
          }, {
            type: 'CallExpression',
            callee: {
              type: 'MemberExpression',
              computed: false,
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
              name: 'item'
            } ]
          } ]
        }
      } ])
    })
    it('should generate AST for Iterator for inline Array', function () {
      testTransform('@[ 1 2 ] { (console.log item) }', [ {
        type: 'ForStatement',
        init: {
          type: 'VariableDeclaration',
          declarations: [ {
            type: 'VariableDeclarator',
            id: {
              type: 'Identifier',
              name: 'i'
            },
            init: {
              type: 'Literal',
              value: 0,
              raw: '0'
            }
          } ],
          kind: 'var'
        },
        test: {
          type: 'BinaryExpression',
          operator: '<',
          left: {
            type: 'Identifier',
            name: 'i'
          },
          right: {
            type: 'MemberExpression',
            computed: false,
            object: {
              type: 'ArrayExpression',
              elements: [ {
                type: 'Literal',
                raw: '1',
                value: 1
              }, {
                type: 'Literal',
                raw: '2',
                value: 2
              } ]
            },
            property: {
              type: 'Identifier',
              name: 'length'
            }
          }
        },
        update: {
          type: 'UpdateExpression',
          operator: '++',
          argument: {
            type: 'Identifier',
            name: 'i'
          },
          prefix: false
        },
        body: {
          type: 'BlockStatement',
          body: [ {
            type: 'VariableDeclaration',
            declarations: [ {
              type: 'VariableDeclarator',
              id: {
                type: 'Identifier',
                name: 'item'
              },
              init: {
                type: 'MemberExpression',
                computed: true,
                object: {
                  type: 'ArrayExpression',
                  elements: [ {
                    type: 'Literal',
                    raw: '1',
                    value: 1
                  }, {
                    type: 'Literal',
                    raw: '2',
                    value: 2
                  } ]
                },
                property: {
                  type: 'Identifier',
                  name: 'i'
                }
              }
            } ],
            kind: 'var'
          }, {
            type: 'CallExpression',
            callee: {
              type: 'MemberExpression',
              computed: false,
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
              name: 'item'
            } ]
          } ]
        }
      } ])
    })
  })
})
