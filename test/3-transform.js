/* eslint-env node, mocha */
require('babel-register')

var assert = require('assert')

var tokenizer = require('../lib/tokenizer')
var toAST = require('../lib/ast')
var transformAST = require('../lib/transform')

function transform (code) {
  var tokens = tokenizer(code)
  var ast = toAST(tokens)
  return transformAST(ast)
}

function testTransform (code, m, v) {
  var ast = transform(code)
  if (m) {
    assert.deepEqual(ast.body, m)
  }
  if (v) {
    assert.deepEqual(ast._variables, v, 'Variable check mismatch')
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
      testTransform('def addone [ number ] (something number 1)', [ {
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
                name: 'something'
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
      testTransform('def log [ one two ] {\n  $ res (something one two)\n  (console.log res)\n}', [ {
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
                  name: 'something'
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
    it('should not set implicit return on invalid type (if etc)', function () {
      testTransform('def a [] { ? 5 is 5 {} }', [ {
        type: 'FunctionDeclaration',
        id: {
          type: 'Identifier',
          name: 'a'
        },
        params: [],
        defaults: [],
        body: {
          type: 'BlockStatement',
          body: [ {
            type: 'ExpressionStatement',
            expression: {
              type: 'IfStatement',
              test: {
                type: 'BinaryExpression',
                operator: '===',
                left: {
                  type: 'Literal',
                  value: 5,
                  raw: '5'
                },
                right: {
                  type: 'Literal',
                  value: 5,
                  raw: '5'
                }
              },
              consequent: {
                type: 'BlockStatement',
                body: []
              },
              alternate: null
            }
          } ]
        }
      } ])
    })

    it('should not crash when function body is empty', function () {
      assert.doesNotThrow(function () {
        testTransform('def add [ one two ] {}')
      })
    })

    it('should not add implicit return if explicit return exists', function () {
      testTransform('def fn [ a b ] { !5 }', [ {
        type: 'FunctionDeclaration',
        id: {
          type: 'Identifier',
          name: 'fn'
        },
        params: [ {
          type: 'Identifier',
          name: 'a'
        }, {
          type: 'Identifier',
          name: 'b'
        } ],
        defaults: [],
        body: {
          type: 'BlockStatement',
          body: [ {
            type: 'ReturnStatement',
            argument: {
              type: 'Literal',
              value: 5,
              raw: '5'
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
            type: 'ExpressionStatement',
            expression: {
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
            }
          } ]
        }
      } ])
    })
    it('should generate AST for Iterator for inline Array', function () {
      var ast = transform('@[ 1 2 ] { (console.log item) }')

      assert.equal(ast._variables.length, 1)

      assert.deepEqual(ast.body, [ {
        type: 'BlockStatement',
        body: [ {
          type: 'VariableDeclaration',
          declarations: [ {
            type: 'VariableDeclarator',
            id: {
              type: 'Identifier',
              name: ast._variables[0]
            },
            init: {
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
            }
          } ],
          kind: 'var'
        }, {
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
                name: ast._variables[0]
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
                    name: ast._variables[0]
                  },
                  property: {
                    type: 'Identifier',
                    name: 'i'
                  }
                }
              } ],
              kind: 'var'
            }, {
              type: 'ExpressionStatement',
              expression: {
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
              }
            } ]
          }
        } ]
      } ])
    })
  })

  describe('IfStatement', function () {
    it('should generate IfStatement', function () {
      testTransform('? a is 5 {}', [ {
        type: 'ExpressionStatement',
        expression: {
          type: 'IfStatement',
          test: {
            type: 'BinaryExpression',
            operator: '===',
            left: {
              type: 'Identifier',
              name: 'a'
            },
            right: {
              type: 'Literal',
              value: 5,
              raw: '5'
            }
          },
          consequent: {
            type: 'BlockStatement',
            body: []
          },
          alternate: null
        }
      } ])
    })

    it('should generate IfStatement with else block', function () {
      testTransform("? a is 5 { (console.log 'ok') } else { (console.log 'fail') }", [ {
        type: 'ExpressionStatement',
        expression: {
          type: 'IfStatement',
          test: {
            type: 'BinaryExpression',
            operator: '===',
            left: {
              type: 'Identifier',
              name: 'a'
            },
            right: {
              type: 'Literal',
              value: 5,
              raw: '5'
            }
          },
          consequent: {
            type: 'BlockStatement',
            body: [ {
              type: 'ExpressionStatement',
              expression: {
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
                  type: 'Literal',
                  value: 'ok',
                  raw: "'ok'"
                } ]
              }
            } ]
          },
          alternate: {
            type: 'BlockStatement',
            body: [ {
              type: 'ExpressionStatement',
              expression: {
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
                  type: 'Literal',
                  value: 'fail',
                  raw: "'fail'"
                } ]
              }
            } ]
          }
        }
      } ])
    })

    it('should generate IfStatement with contains test', function () {
      testTransform('? [ 1 2 ] contains 1 { (console.log 1111) }', [ {
        type: 'ExpressionStatement',
        expression: {
          type: 'IfStatement',
          test: {
            type: 'UnaryExpression',
            operator: '~',
            argument: {
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                computed: false,
                object: {
                  type: 'ArrayExpression',
                  elements: [ {
                    type: 'Literal',
                    value: 1,
                    raw: '1'
                  }, {
                    type: 'Literal',
                    value: 2,
                    raw: '2'
                  } ]
                },
                property: {
                  type: 'Identifier',
                  name: 'indexOf'
                }
              },
              arguments: [ {
                type: 'Literal',
                value: 1,
                raw: '1'
              } ]
            }
          },
          consequent: {
            type: 'BlockStatement',
            body: [ {
              type: 'ExpressionStatement',
              expression: {
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
                  type: 'Literal',
                  value: 1111,
                  raw: '1111'
                } ]
              }
            } ]
          },
          alternate: null
        }
      }])
    })

    it('should generate IfStatement with kinda test', function () {
      testTransform('? err kinda true {}', [ {
        type: 'ExpressionStatement',
        expression: {
          type: 'IfStatement',
          test: {
            type: 'BinaryExpression',
            operator: '==',
            left: {
              type: 'Identifier',
              name: 'err'
            },
            right: {
              type: 'Identifier',
              name: 'true'
            }
          },
          consequent: {
            type: 'BlockStatement',
            body: []
          },
          alternate: null
        }
      } ])
    })

    it('should generate IfStatement with exists check', function () {
      testTransform('? err exists {}', [ {
        type: 'ExpressionStatement',
        expression: {
          type: 'IfStatement',
          test: {
            type: 'Identifier',
            name: 'err'
          },
          consequent: {
            type: 'BlockStatement',
            body: []
          },
          alternate: null
        }
      } ])
    })
  })

  describe('ReturnStatement', function () {
    it('should generate ReturnStatement', function () {
      testTransform('!', [ {
        type: 'ReturnStatement',
        argument: null
      } ])
    })
    it('should generate ReturnStatement with value,', function () {
      testTransform('! 12', [ {
        type: 'ReturnStatement',
        argument: {
          type: 'Literal',
          value: 12,
          raw: '12'
        }
      } ])
    })
  })

  describe('ObjectCreation', function () {
    it('should generate VariableDeclaration', function () {
      testTransform('make obj', [ {
        type: 'VariableDeclaration',
        declarations: [ {
          type: 'VariableDeclarator',
          id: {
            type: 'Identifier',
            name: 'obj'
          },
          init: {
            type: 'ObjectExpression',
            properties: []
          }
        } ],
        kind: 'var'
      } ])
    })
  })

  describe('ObjectGet', function () {
    it('should generate MemberExpression', function () {
      testTransform('get obj key', [ {
        type: 'MemberExpression',
        computed: true,
        object: {
          type: 'Identifier',
          name: 'obj'
        },
        property: {
          type: 'Identifier',
          name: 'key'
        }
      } ])
    })
    it('should generate MemberExpression where value is string', function () {
      testTransform("get obj 'key'", [ {
        type: 'MemberExpression',
        computed: true,
        object: {
          type: 'Identifier',
          name: 'obj'
        },
        property: {
          type: 'Literal',
          value: 'key',
          raw: "'key'"
        }
      } ])
    })
  })

  describe('ObjectSet', function () {
    it('should generate AssignmentExpression where value is literal', function () {
      testTransform('set obj key value', [ {
        type: 'AssignmentExpression',
        operator: '=',
        left: {
          type: 'MemberExpression',
          computed: true,
          object: {
            type: 'Identifier',
            name: 'obj'
          },
          property: {
            type: 'Identifier',
            name: 'key'
          }
        },
        right: {
          type: 'Identifier',
          name: 'value'
        }
      } ])
    })
    it('should generate AssignmentExpression where value is string', function () {
      testTransform("set obj key 'value'", [ {
        type: 'AssignmentExpression',
        operator: '=',
        left: {
          type: 'MemberExpression',
          computed: true,
          object: {
            type: 'Identifier',
            name: 'obj'
          },
          property: {
            type: 'Identifier',
            name: 'key'
          }
        },
        right: {
          type: 'Literal',
          value: 'value',
          raw: "'value'"
        }
      } ])
    })
    it('should generate AssignmentExpression where value is arrau', function () {
      testTransform('set obj key [ 1 2 3 4 ]', [ {
        type: 'AssignmentExpression',
        operator: '=',
        left: {
          type: 'MemberExpression',
          computed: true,
          object: {
            type: 'Identifier',
            name: 'obj'
          },
          property: {
            type: 'Identifier',
            name: 'key'
          }
        },
        right: {
          type: 'ArrayExpression',
          elements: [ {
            type: 'Literal',
            value: '1',
            raw: 1
          }, {
            type: 'Literal',
            value: '2',
            raw: 2
          }, {
            type: 'Literal',
            value: '3',
            raw: 3
          }, {
            type: 'Literal',
            value: '4',
            raw: 4
          } ]
        }
      } ])
    })
  })

  describe('Addition', function () {
    it('should generate BinaryExpression', function () {
      testTransform('(add 1 1)', [ {
        type: 'ExpressionStatement',
        expression: {
          type: 'BinaryExpression',
          operator: '+',
          left: {
            type: 'Literal',
            value: '1',
            raw: 1
          },
          right: {
            type: 'Literal',
            value: '1',
            raw: 1
          }
        }
      } ])
    })
  })

  describe('Subtraction', function () {
    it('should generate BinaryExpression', function () {
      testTransform('(sub 1 1)', [ {
        type: 'ExpressionStatement',
        expression: {
          type: 'BinaryExpression',
          operator: '-',
          left: {
            type: 'Literal',
            value: '1',
            raw: 1
          },
          right: {
            type: 'Literal',
            value: '1',
            raw: 1
          }
        }
      } ])
    })
  })

  describe('Multiplication', function () {
    it('should generate BinaryExpression', function () {
      testTransform('(mul 1 1)', [ {
        type: 'ExpressionStatement',
        expression: {
          type: 'BinaryExpression',
          operator: '*',
          left: {
            type: 'Literal',
            value: '1',
            raw: 1
          },
          right: {
            type: 'Literal',
            value: '1',
            raw: 1
          }
        }
      } ])
    })
  })

  describe('Division', function () {
    it('should generate BinaryExpression', function () {
      testTransform('(div 1 1)', [ {
        type: 'ExpressionStatement',
        expression: {
          type: 'BinaryExpression',
          operator: '/',
          left: {
            type: 'Literal',
            value: '1',
            raw: 1
          },
          right: {
            type: 'Literal',
            value: '1',
            raw: 1
          }
        }
      } ])
    })
  })
})
