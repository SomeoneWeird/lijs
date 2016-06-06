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
  })
})
