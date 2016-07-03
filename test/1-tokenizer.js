/* eslint-env node, mocha */
require('babel-register')

var assert = require('assert')

var tokenizer = require('../lib/tokenizer')

function testTokenizer (code, m) {
  var tokens = tokenizer(code)
  assert.deepEqual(tokens, m)
}

describe('tokenizer', function () {
  describe('Whitespace', function () {
    it('should skip whitespace', function () {
      assert.equal(tokenizer('    ').length, 0)
    })
  })

  describe('LineBreak', function () {
    it('should parse properly', function () {
      testTokenizer('\n\n', [ {
        type: 'LineBreak'
      }, {
        type: 'LineBreak'
      } ])
    })
  })

  describe('Literals', function () {
    describe('Literal', function () {
      it('should parse literal', function () {
        testTokenizer('a b c', [ Literal('a'), Literal('b'), Literal('c') ])
      })

      it('should support number in literal (not first char)', function () {
        testTokenizer('a1', [ Literal('a1') ])
      })

      it('should allow dots in literal', function () {
        testTokenizer('a.b', [ Literal('a.b') ])
      })

      it('should error if dot is first character of literal', function () {
        assert.throws(function () {
          tokenizer('.b')
        }, /Unknown token: '.'/)
      })

      it('should not parse as ImportStatement', function () {
        testTokenizer('use123', [ Literal('use123') ])
      })

      it('should not parse as ImportAsStatement', function () {
        testTokenizer('as123', [ Literal('as123') ])
      })

      it('should not parse as ExportStatement', function () {
        testTokenizer('export123', [ Literal('export123') ])
      })

      it('should not parse as MakeStatement', function () {
        testTokenizer('make123', [ Literal('make123') ])
      })

      it('should not parse as SetStatement', function () {
        testTokenizer('set123', [ Literal('set123') ])
      })

      it('should not parse as GetStatement', function () {
        testTokenizer('get123', [ Literal('get123') ])
      })

      it('should not parse as EqualityCheck', function () {
        testTokenizer('is123', [ Literal('is123') ])
      })

      it('should not parse as KindaCheck', function () {
        testTokenizer('kinda123', [ Literal('kinda123') ])
      })

      it('should not parse as ContainsCheck', function () {
        testTokenizer('contains123', [ Literal('contains123') ])
      })

      it('should not parse as Definition', function () {
        testTokenizer('def123', [ Literal('def123') ])
      })
    })

    describe('NumberLiteral', function () {
      it('should parse NumberLiteral', function () {
        testTokenizer('1 2 3 4', [
          NumberLiteral(1),
          NumberLiteral(2),
          NumberLiteral(3),
          NumberLiteral(4)
        ])
      })
    })

    describe('StringLiteral', function () {
      it('should parse StringLiteral', function () {
        testTokenizer("'hello'", [ StringLiteral('hello') ])
      })

      it('should parse multiple StringLiteral', function () {
        testTokenizer("'hello   ' 'world''howareyou'", [ StringLiteral('hello   '), StringLiteral('world'), StringLiteral('howareyou') ])
      })
    })

    it('should support numbers in strings', function () {
      testTokenizer("'hello world 1337' 'hi 42'", [ StringLiteral('hello world 1337'), StringLiteral('hi 42') ])
    })

    describe('FloatLiteral', function () {
      it('should parse FloatLiteral', function () {
        testTokenizer('4.2', [ FloatLiteral('4.2') ])
      })
      it('should throw if . is last thing', function () {
        assert.throws(function () {
          tokenizer('42.')
        }, /invalid character ./)
      })
    })

    describe('should be able to mix literal types', function () {
      it('Literal + NumberLiteral', function () {
        testTokenizer('hello 137 world 42', [
          Literal('hello'),
          NumberLiteral('137'),
          Literal('world'),
          NumberLiteral('42')
        ])
      })

      it('Literal + StringLiteral', function () {
        testTokenizer("hello 'hello' world 'world'", [
          Literal('hello'),
          StringLiteral('hello'),
          Literal('world'),
          StringLiteral('world')
        ])
      })

      it('StringLiteral + NumberLiteral', function () {
        testTokenizer("'hello' 42 'world' 137", [
          StringLiteral('hello'),
          NumberLiteral('42'),
          StringLiteral('world'),
          NumberLiteral('137')
        ])
      })

      it('Literal + NumberLiteral + StringLiteral', function () {
        testTokenizer("'one' two 3", [
          StringLiteral('one'),
          Literal('two'),
          NumberLiteral('3')
        ])
      })

      it('Literal + FloatLiteral', function () {
        testTokenizer('one 4.2', [
          Literal('one'),
          FloatLiteral('4.2')
        ])
      })

      it('NumberLiteral + FloatLiteral', function () {
        testTokenizer('42 4.2', [
          NumberLiteral('42'),
          FloatLiteral('4.2')
        ])
      })

      it('StringLiteral + FloatLiteral', function () {
        testTokenizer("'hello' 4.20", [
          StringLiteral('hello'),
          FloatLiteral('4.20')
        ])
      })
    })
  })

  describe('Assignment', function () {
    it('should parse properly', function () {
      testTokenizer('$', [ _('AssignmentOperator') ])
    })
  })

  describe('Array', function () {
    describe('ArrayStart', function () {
      it('should parse properly', function () {
        testTokenizer('[', [
          _('ArrayStart')
        ])
      })
    })
    describe('ArrayEnd', function () {
      it('should parse properly', function () {
        testTokenizer(']', [
          _('ArrayEnd')
        ])
      })
    })
  })

  describe('Parenthesis', function () {
    it('should parse properly', function () {
      testTokenizer('()', [
        _('Parenthesis', '('),
        _('Parenthesis', ')')
      ])
    })
  })

  describe('Definition', function () {
    it('should parse properly', function () {
      testTokenizer('def ', [
        _('Definition')
      ])
    })
  })

  describe('DefinitionPoint', function () {
    it('should parse opening DefinitionPoint properly', function () {
      testTokenizer('{', [
        _('DefinitionPoint', '{')
      ])
    })
    it('should parse opening DefinitionPoint properly', function () {
      testTokenizer('}', [
        _('DefinitionPoint', '}')
      ])
    })
  })

  describe('Comment', function () {
    it('should parse single line comment', function () {
      testTokenizer('//hello', [
        _('SingleLineComment', 'hello')
      ])
    })
    it('should parse multiline comment', function () {
      testTokenizer('/*hello\nworld*/', [
        _('MultiLineComment', [ 'hello', 'world' ])
      ])
    })
    it('should pass multiline comment with blank lines', function () {
      testTokenizer('/*\n\n\n\n*/', [
        _('MultiLineComment', [ '', '', '', '', '' ])
      ])
    })
    it('should parse single-line multiline-style comment', function () {
      testTokenizer('/* hello */', [
        _('MultiLineComment', [ ' hello ' ])
      ])
    })
    it('should parse multiline-comment inside single-line comment', function () {
      testTokenizer('// /* test */', [
        _('SingleLineComment', ' /* test */')
      ])
    })
    it('should parse single-line inside multiline comment', function () {
      testTokenizer('/*\n//one\n//two\n//three*/', [
        _('MultiLineComment', [ '', '//one', '//two', '//three' ])
      ])
    })
  })

  describe('ImportStatement', function () {
    it('should parse properly', function () {
      testTokenizer("use 'hello'", [
        _('ImportStatement'),
        StringLiteral('hello')
      ])
    })
  })

  describe('ImportAsStatement', function () {
    it('should parse properly', function () {
      testTokenizer("use 'hello' as hello", [
        _('ImportStatement'),
        StringLiteral('hello'),
        _('ImportAsStatement'),
        Literal('hello')
      ])
    })
  })

  describe('ExportStatement', function () {
    it('should parse properly', function () {
      testTokenizer('export lol', [
        _('ExportStatement'),
        Literal('lol')
      ])
    })
  })

  describe('MakeStatement', function () {
    it('should parse properly', function () {
      testTokenizer('make obj', [
        _('MakeStatement'),
        Literal('obj')
      ])
    })
  })

  describe('SetStatement', function () {
    it('should parse properly', function () {
      testTokenizer('set obj key value', [
        _('SetStatement'),
        Literal('obj'),
        Literal('key'),
        Literal('value')
      ])
    })
  })

  describe('GetStatement', function () {
    it('should parse properly', function () {
      testTokenizer('get obj key', [
        _('GetStatement'),
        Literal('obj'),
        Literal('key')
      ])
    })
  })

  describe('Iterator', function () {
    it('should parse properly', function () {
      testTokenizer('@arr', [
        _('Iterator'),
        Literal('arr')
      ])
    })
  })

  describe('IfStatement', function () {
    it('should parse properly', function () {
      testTokenizer('?', [
        _('IfStatement')
      ])
    })
  })

  describe('ElseExpression', function () {
    it('should parse properly', function () {
      testTokenizer('else ', [
        _('ElseExpression')
      ])
    })
  })

  describe('EqualityCheck', function () {
    it('should parse properly', function () {
      testTokenizer('is ', [
        _('EqualityCheck')
      ])
    })
  })

  describe('KindaCheck', function () {
    it('should parse properly', function () {
      testTokenizer('kinda ', [
        _('KindaCheck')
      ])
    })
  })

  describe('ContainsCheck', function () {
    it('should parse properly', function () {
      testTokenizer('contains ', [
        _('ContainsCheck')
      ])
    })
  })

  describe('ReturnStatement', function () {
    it('should parse properly', function () {
      testTokenizer('!', [
        _('ReturnStatement')
      ])
    })
  })
})

function _ (n, v) {
  var o = { type: n }
  if (v) o[Array.isArray(v) ? 'values' : 'value'] = v
  return o
}
function Literal (v) {
  return _('Literal', v)
}

function StringLiteral (v) {
  return _('StringLiteral', v)
}

function NumberLiteral (v) {
  return _('NumberLiteral', v)
}

function FloatLiteral (v) {
  return _('FloatLiteral', v)
}
