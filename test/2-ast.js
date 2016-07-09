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
  describe('FunctionCall', function () {
    it('should error if function name is invalid', function () {
      assert.throws(function () {
        testAST('(4 4)')
      }, /Function call name must be literal/)
    })
    it('should generate AST for FunctionCall', function () {
      testAST('(echo hello)', [ {
        type: 'FunctionCall',
        name: 'echo',
        args: [ {
          type: 'Literal',
          value: 'hello'
        } ]
      } ])
    })
    it('should generate AST for FunctionCall as FunctionCall parameter', function () {
      testAST('(something 5 (something 10 11))', [ {
        type: 'FunctionCall',
        name: 'something',
        args: [ {
          type: 'NumberLiteral',
          value: '5'
        }, {
          type: 'FunctionCall',
          name: 'something',
          args: [ {
            type: 'NumberLiteral',
            value: '10'
          }, {
            type: 'NumberLiteral',
            value: '11'
          } ]
        }]
      } ])
    })
  })
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
    it('should generate array with nested arrays', function () {
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
    it('should generate array with FunctionCall', function () {
      testAST('[ (a 1 2) 5 ]', [ {
        type: 'Array',
        elements: [ {
          type: 'FunctionCall',
          name: 'a',
          args: [ {
            type: 'NumberLiteral',
            value: '1'
          }, {
            type: 'NumberLiteral',
            value: '2'
          } ]
        }, {
          type: 'NumberLiteral',
          value: '5'
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
  describe('SingleLineComment', function () {
    it('should ignore SingleLineComment', function () {
      testAST('//hello', [])
    })
  })
  describe('MultiLineComment', function () {
    it('should ignore MultiLineComment', function () {
      testAST('/*\nhello\n*/', [])
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
    it('should generate AST for assignment where value is FunctionCall', function () {
      testAST('$ four (something 1 3)', [ {
        type: 'Assignment',
        name: 'four',
        value: {
          type: 'FunctionCall',
          name: 'something',
          args: [ {
            type: 'NumberLiteral',
            value: '1'
          }, {
            type: 'NumberLiteral',
            value: '3'
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
  describe('MakeStatement', function () {
    it('should generate AST for MakeStatement', function () {
      testAST('make obj', [ {
        type: 'ObjectCreation',
        name: 'obj'
      } ])
    })
    it('should throw if name is not literal', function () {
      assert.throws(function () {
        testAST('make 5')
      }, /Object name must be a literal/)
    })
  })
  describe('GetStatement', function () {
    it('should generate AST for GetStatement', function () {
      testAST('get obj key', [ {
        type: 'ObjectGet',
        name: 'obj',
        key: {
          type: 'Literal',
          value: 'key'
        }
      } ])
    })
    it('should generate AST for GetStatement where key is string', function () {
      testAST("get obj 'key'", [ {
        type: 'ObjectGet',
        name: 'obj',
        key: {
          type: 'StringLiteral',
          value: 'key'
        }
      } ])
    })
    it('should throw if name is not Literal', function () {
      assert.throws(function () {
        testAST('get 5 5')
      }, /Object name must be literal/)
    })
    it('should throw if key is not Literal or String', function () {
      assert.throws(function () {
        testAST('get obj 5')
      }, /Object key must be literal or string/)
    })
  })
  describe('SetStatement', function () {
    it('should generate AST for SetStatement', function () {
      testAST('set obj a b', [ {
        type: 'ObjectSet',
        name: 'obj',
        key: {
          type: 'Literal',
          value: 'a'
        },
        value: {
          type: 'Literal',
          value: 'b'
        }
      } ])
    })
    it('should generate AST for SetStatement where value is array', function () {
      testAST('set obj arr [ 1 2 3 4 ]', [ {
        type: 'ObjectSet',
        name: 'obj',
        key: {
          type: 'Literal',
          value: 'arr'
        },
        value: {
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
        }
      } ])
    })
    it('should throw if name is not Literal', function () {
      assert.throws(function () {
        testAST('set 1 2 3')
      }, /Object name must be literal/)
    })
    it('should throw if key is not Literal or String', function () {
      assert.throws(function () {
        testAST('set obj 1 2')
      }, /Object key must be literal or string/)
    })
  })
  describe('FunctionDefinition', function () {
    it('should error if name is not literal', function () {
      assert.throws(function () {
        testAST('def 2')
      }, /Function name must be literal/)
    })
    it('should generate AST for FunctionDefinition', function () {
      testAST('def addtwo [ number ] (something number 2)', [ {
        type: 'FunctionDefinition',
        name: 'addtwo',
        args: [ {
          type: 'Literal',
          value: 'number'
        } ],
        body: [ {
          type: 'FunctionCall',
          name: 'something',
          args: [ {
            type: 'Literal',
            value: 'number'
          }, {
            type: 'NumberLiteral',
            value: '2'
          } ]
        } ]
      } ])
    })
    it('should generate AST for multiline FunctionDefinition', function () {
      testAST('def multi [ one two ] {\n  $ res (something one two)\n  (console.log res)\n}', [ {
        type: 'FunctionDefinition',
        name: 'multi',
        args: [ {
          type: 'Literal',
          value: 'one'
        }, {
          type: 'Literal',
          value: 'two'
        } ],
        body: [ {
          type: 'Assignment',
          name: 'res',
          value: {
            type: 'FunctionCall',
            name: 'something',
            args: [ {
              type: 'Literal',
              value: 'one'
            }, {
              type: 'Literal',
              value: 'two'
            } ]
          }
        }, {
          type: 'FunctionCall',
          name: 'console.log',
          args: [ {
            type: 'Literal',
            value: 'res'
          } ]
        } ]
      } ])
    })
  })
  describe('ImportStatement', function () {
    it('should generate AST for ImportStatement', function () {
      testAST("use 'hello'", [ {
        type: 'ImportStatement',
        value: 'hello'
      } ])
    })
    it('should generate AST for ImportAsStatement', function () {
      testAST("use 'hello' as hello", [ {
        type: 'ImportStatement',
        name: 'hello',
        value: 'hello'
      } ])
    })
    it('should throw if value is not StringLiteral', function () {
      assert.throws(function () {
        testAST('use 5')
      }, /use statement must use string/)
    })
  })

  describe('ExportStatement', function () {
    it('should generate AST for ExportStatement', function () {
      testAST('export lol', [ {
        type: 'ExportStatement',
        value: 'lol'
      } ])
    })
    it('should throw if value is not Literal', function () {
      assert.throws(function () {
        testAST('export 5')
      }, /must export literal/)
    })
  })

  describe('Iterator', function () {
    it('should generate AST for Iterator with variable', function () {
      testAST('$ arr [ 1 2 3 4 ]\n@arr { (console.log item) }', [ {
        type: 'Assignment',
        name: 'arr',
        value: {
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
        }
      }, {
        type: 'Iterator',
        value: {
          type: 'Literal',
          value: 'arr'
        },
        body: [ {
          type: 'FunctionCall',
          name: 'console.log',
          args: [ {
            type: 'Literal',
            value: 'item'
          } ]
        } ]
      } ])
    })
  })

  describe('IfStatement', function () {
    it('should generate AST for IfStatement', function () {
      testAST("? hello is 5 { (console.log 'is true') }", [ {
        type: 'IfStatement',
        check: {
          type: 'EqualityCheck',
          left: {
            type: 'Literal',
            value: 'hello'
          },
          right: {
            type: 'NumberLiteral',
            value: '5'
          }
        },
        pass: [ {
          type: 'FunctionCall',
          name: 'console.log',
          args: [ {
            type: 'StringLiteral',
            value: 'is true'
          } ]
        } ]
      } ])
    })

    it('should generate AST for IfStatement with Else', function () {
      testAST("? hello is 5 { (console.log 'ok') } else { (console.log 'fail') }", [ {
        type: 'IfStatement',
        check: {
          type: 'EqualityCheck',
          left: {
            type: 'Literal',
            value: 'hello'
          },
          right: {
            type: 'NumberLiteral',
            value: '5'
          }
        },
        pass: [ {
          type: 'FunctionCall',
          name: 'console.log',
          args: [ {
            type: 'StringLiteral',
            value: 'ok'
          } ]
        } ],
        fail: [ {
          type: 'FunctionCall',
          name: 'console.log',
          args: [ {
            type: 'StringLiteral',
            value: 'fail'
          } ]
        } ]
      } ])
    })

    it('should generate AST for IfStatement where check is contains', function () {
      testAST("? [ 1 2 ] contains 2 { (console.log 'woo') }", [ {
        type: 'IfStatement',
        check: {
          type: 'ContainsCheck',
          left: {
            type: 'Array',
            elements: [ {
              type: 'NumberLiteral',
              value: '1'
            }, {
              type: 'NumberLiteral',
              value: '2'
            } ]
          },
          right: {
            type: 'NumberLiteral',
            value: '2'
          }
        },
        pass: [ {
          type: 'FunctionCall',
          name: 'console.log',
          args: [ {
            type: 'StringLiteral',
            value: 'woo'
          } ]
        } ]
      } ])
    })

    it('should generate AST for IfStatement where check is kinda', function () {
      testAST('? err kinda true {}', [ {
        type: 'IfStatement',
        check: {
          type: 'KindaCheck',
          left: {
            type: 'Literal',
            value: 'err'
          },
          right: {
            type: 'Literal',
            value: 'true'
          }
        },
        pass: []
      } ])
    })

    it('should generate AST for IfStatement where check is exists', function () {
      testAST('? err exists {}', [ {
        type: 'IfStatement',
        check: {
          type: 'ExistsCheck',
          left: {
            type: 'Literal',
            value: 'err'
          }
        },
        pass: []
      } ])
    })
  })

  describe('ReturnStatement', function () {
    it('should generate AST for ReturnStatement', function () {
      testAST('!', [ {
        type: 'ReturnStatement',
        value: null
      } ])
    })
    it('should generate AST for ReturnStatement with value', function () {
      testAST('! 5', [ {
        type: 'ReturnStatement',
        value: {
          type: 'NumberLiteral',
          value: '5'
        }
      } ])
    })
  })

  describe('Addition', function () {
    it('should generate AST for Addition', function () {
      testAST('(add 5 1)', [ {
        type: 'Addition',
        left: {
          type: 'NumberLiteral',
          value: '5'
        },
        right: {
          type: 'NumberLiteral',
          value: '1'
        }
      } ])
    })
  })

  describe('Subtraction', function () {
    it('should generate AST for Subtraction', function () {
      testAST('(sub 10 5)', [ {
        type: 'Subtraction',
        left: {
          type: 'NumberLiteral',
          value: '10'
        },
        right: {
          type: 'NumberLiteral',
          value: '5'
        }
      } ])
    })
  })

  describe('Multiplication', function () {
    it('should generate AST for Multiplication', function () {
      testAST('(mul 15 3)', [ {
        type: 'Multiplication',
        left: {
          type: 'NumberLiteral',
          value: '15'
        },
        right: {
          type: 'NumberLiteral',
          value: '3'
        }
      } ])
    })
  })

  describe('Division', function () {
    it('should generate AST for Division', function () {
      testAST('(div 10 2)', [ {
        type: 'Division',
        left: {
          type: 'NumberLiteral',
          value: '10'
        },
        right: {
          type: 'NumberLiteral',
          value: '2'
        }
      } ])
    })
  })
})
