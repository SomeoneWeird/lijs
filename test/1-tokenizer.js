/* eslint-env node, mocha */
require('babel-register')

var assert = require('assert')

var tokenizer = require('../lib/tokenizer')

describe('tokenizer', function () {
  describe('Whitespace', function () {
    it('should skip whitespace', function () {
      assert.equal(tokenizer('    ').length, 0)
    })
  })

  describe('LineBreak', function () {
    it('should parse properly', function () {
      assert.deepEqual(tokenizer('\n\n'), [ {
        type: 'LineBreak'
      }, {
        type: 'LineBreak'
      } ])
    })
  })

  describe('Literals', function () {
    describe('Literal', function () {
      it('should parse literal', function () {
        var code = 'a b c'
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'Literal',
          value: 'a'
        }, {
          type: 'Literal',
          value: 'b'
        }, {
          type: 'Literal',
          value: 'c'
        } ])
      })

      it('should support number in literal (not first char)', function () {
        var code = 'a1'
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'Literal',
          value: 'a1'
        } ])
      })

      it('should allow dots in literal', function () {
        var code = 'a.b'
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'Literal',
          value: 'a.b'
        } ])
      })

      it('should error if dot is first character of literal', function () {
        var code = '.b'

        assert.throws(function () {
          tokenizer(code)
        }, /Unknown token: '.'/)
      })

      it('should not parse as ImportStatement', function () {
        var code = 'use123'
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'Literal',
          value: 'use123'
        } ])
      })

      it('should not parse as ImportAsStatement', function () {
        var code = 'as123'
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'Literal',
          value: 'as123'
        } ])
      })

      it('should not parse as ExportStatement', function () {
        var code = 'export123'
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'Literal',
          value: 'export123'
        } ])
      })

      it('should not parse as EqualityCheck', function () {
        var code = 'is123'
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'Literal',
          value: 'is123'
        } ])
      })

      it('should not parse as KindaCheck', function () {
        var code = 'kinda123'
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'Literal',
          value: 'kinda123'
        } ])
      })

      it('should not parse as ContainsCheck', function () {
        var code = 'contains123'
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'Literal',
          value: 'contains123'
        } ])
      })

      it('should not parse as Definition', function () {
        var code = 'def123'
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'Literal',
          value: 'def123'
        } ])
      })
    })

    describe('NumberLiteral', function () {
      it('should parse NumberLiteral', function () {
        var code = '1 2 3 4'
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
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
        } ])
      })
    })

    describe('StringLiteral', function () {
      it('should parse StringLiteral', function () {
        var code = "'hello'"
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'StringLiteral',
          value: 'hello'
        } ])
      })

      it('should parse multiple StringLiteral', function () {
        var code = "'hello   ' 'world''howareyou'"
        var tokens = tokenizer(code)
        assert.deepEqual(tokens, [ {
          type: 'StringLiteral',
          value: 'hello   '
        }, {
          type: 'StringLiteral',
          value: 'world'
        }, {
          type: 'StringLiteral',
          value: 'howareyou'
        } ])
      })
    })

    it('should support numbers in strings', function () {
      var code = "'hello world 1337' 'hi 42'"
      var tokens = tokenizer(code)
      assert.deepEqual(tokens, [ {
        type: 'StringLiteral',
        value: 'hello world 1337'
      }, {
        type: 'StringLiteral',
        value: 'hi 42'
      } ])
    })

    describe('FloatLiteral', function () {
      it('should parse FloatLiteral', function () {
        var code = '4.2'
        var tokens = tokenizer(code)
        assert.deepEqual(tokens, [ {
          type: 'FloatLiteral',
          value: '4.2'
        } ])
      })
      it('should throw if . is last thing', function () {
        var code = '42.'

        assert.throws(function () {
          tokenizer(code)
        }, /invalid character ./)
      })
    })

    describe('should be able to mix literal types', function () {
      it('Literal + NumberLiteral', function () {
        var code = 'hello 137 world 42'
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'Literal',
          value: 'hello'
        }, {
          type: 'NumberLiteral',
          value: '137'
        }, {
          type: 'Literal',
          value: 'world'
        }, {
          type: 'NumberLiteral',
          value: '42'
        } ])
      })

      it('Literal + StringLiteral', function () {
        var code = "hello 'hello' world 'world'"
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'Literal',
          value: 'hello'
        }, {
          type: 'StringLiteral',
          value: 'hello'
        }, {
          type: 'Literal',
          value: 'world'
        }, {
          type: 'StringLiteral',
          value: 'world'
        } ])
      })

      it('StringLiteral + NumberLiteral', function () {
        var code = "'hello' 42 'world' 137"
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'StringLiteral',
          value: 'hello'
        }, {
          type: 'NumberLiteral',
          value: '42'
        }, {
          type: 'StringLiteral',
          value: 'world'
        }, {
          type: 'NumberLiteral',
          value: '137'
        } ])
      })

      it('Literal + NumberLiteral + StringLiteral', function () {
        var code = "'one' two 3"
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'StringLiteral',
          value: 'one'
        }, {
          type: 'Literal',
          value: 'two'
        }, {
          type: 'NumberLiteral',
          value: '3'
        } ])
      })

      it('Literal + FloatLiteral', function () {
        var code = 'one 4.2'
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'Literal',
          value: 'one'
        }, {
          type: 'FloatLiteral',
          value: '4.2'
        } ])
      })

      it('NumberLiteral + FloatLiteral', function () {
        var code = '42 4.2'
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'NumberLiteral',
          value: '42'
        }, {
          type: 'FloatLiteral',
          value: '4.2'
        } ])
      })

      it('StringLiteral + FloatLiteral', function () {
        var code = "'hello' 4.20"
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'StringLiteral',
          value: 'hello'
        }, {
          type: 'FloatLiteral',
          value: '4.20'
        } ])
      })
    })
  })

  describe('Assignment', function () {
    it('should parse properly', function () {
      var code = '$'
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'AssignmentOperator'
      } ])
    })
  })

  describe('Array', function () {
    describe('ArrayStart', function () {
      it('should parse properly', function () {
        var code = '['
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'ArrayStart'
        } ])
      })
    })
    describe('ArrayEnd', function () {
      it('should parse properly', function () {
        var code = ']'
        var tokens = tokenizer(code)

        assert.deepEqual(tokens, [ {
          type: 'ArrayEnd'
        } ])
      })
    })
  })

  describe('Parenthesis', function () {
    it('should parse properly', function () {
      var code = '()'
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'Parenthesis',
        value: '('
      }, {
        type: 'Parenthesis',
        value: ')'
      } ])
    })
  })

  describe('Definition', function () {
    it('should parse properly', function () {
      var code = 'def '
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'Definition'
      } ])
    })
  })

  describe('DefinitionPoint', function () {
    it('should parse opening DefinitionPoint properly', function () {
      var code = '{'
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'DefinitionPoint',
        value: '{'
      } ])
    })
    it('should parse opening DefinitionPoint properly', function () {
      var code = '}'
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'DefinitionPoint',
        value: '}'
      } ])
    })
  })

  describe('Comment', function () {
    it('should parse single line comment', function () {
      var code = '//hello'
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'SingleLineComment',
        value: 'hello'
      } ])
    })
    it('should parse multiline comment', function () {
      var code = '/*hello\nworld*/'
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'MultiLineComment',
        values: [ 'hello', 'world' ]
      } ])
    })
    it('should pass multiline comment with blank lines', function () {
      var code = '/*\n\n\n\n*/'
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'MultiLineComment',
        values: [ '', '', '', '', '' ]
      } ])
    })
    it('should parse single-line multiline-style comment', function () {
      var code = '/* hello */'
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'MultiLineComment',
        values: [ ' hello ' ]
      } ])
    })
    it('should parse multiline-comment inside single-line comment', function () {
      var code = '// /* test */'
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'SingleLineComment',
        value: ' /* test */'
      } ])
    })
    it('should parse single-line inside multiline comment', function () {
      var code = '/*\n//one\n//two\n//three*/'
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'MultiLineComment',
        values: [ '', '//one', '//two', '//three' ]
      } ])
    })
  })

  describe('ImportStatement', function () {
    it('should parse properly', function () {
      var code = "use 'hello'"
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'ImportStatement'
      }, {
        type: 'StringLiteral',
        value: 'hello'
      } ])
    })
  })

  describe('ImportAsStatement', function () {
    it('should parse properly', function () {
      var code = "use 'hello' as hello"
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'ImportStatement'
      }, {
        type: 'StringLiteral',
        value: 'hello'
      }, {
        type: 'ImportAsStatement'
      }, {
        type: 'Literal',
        value: 'hello'
      } ])
    })
  })

  describe('ExportStatement', function () {
    it('should parse properly', function () {
      var code = 'export lol'
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'ExportStatement'
      }, {
        type: 'Literal',
        value: 'lol'
      } ])
    })
  })

  describe('Iterator', function () {
    it('should parse properly', function () {
      var code = '@arr'
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'Iterator'
      }, {
        type: 'Literal',
        value: 'arr'
      } ])
    })
  })

  describe('IfStatement', function () {
    it('should parse properly', function () {
      var code = '?'
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'IfStatement'
      } ])
    })
  })

  describe('ElseExpression', function () {
    it('should parse properly', function () {
      var code = 'else '
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'ElseExpression'
      } ])
    })
  })

  describe('EqualityCheck', function () {
    it('should parse properly', function () {
      var code = 'is '
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'EqualityCheck'
      } ])
    })
  })

  describe('KindaCheck', function () {
    it('should parse properly', function () {
      var code = 'kinda '
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'KindaCheck'
      } ])
    })
  })

  describe('ContainsCheck', function () {
    it('should parse properly', function () {
      var code = 'contains '
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'ContainsCheck'
      } ])
    })
  })

  describe('ReturnStatement', function () {
    it('should parse properly', function () {
      var code = '!'
      var tokens = tokenizer(code)

      assert.deepEqual(tokens, [ {
        type: 'ReturnStatement'
      } ])
    })
  })
})
