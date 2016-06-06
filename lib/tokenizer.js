var util = require('util')

module.exports = function tokenizer (input) {
  var lines = input.split('')
  var out = []
  var currentPosition = 0

  function lookahead (match) {
    var bucket = []
    while (true) {
      var nextToken = input[currentPosition + bucket.length]
      if (!nextToken) {
        break
      }
      if (!match.test(nextToken)) {
        break
      }
      bucket.push(nextToken)
    }

    return bucket
  }

  while (currentPosition < input.length) {
    var currentToken = input[currentPosition]

    if (currentToken === ' ') {
      // ignore
      currentPosition++
      continue
    }

    // Linebreaks
    if (currentToken === '\n') {
      out.push({
        type: 'LineBreak'
      })
      currentPosition++
      continue
    }

    // Assignments
    if (currentToken === '$') {
      out.push({
        type: 'AssignmentOperator'
      })
      currentPosition++
      continue
    }

    var literalRegex = /[a-zA-Z]/

    if(literalRegex.test(currentToken)) {
      var bucket = lookahead(literalRegex)
      currentPosition += bucket.length
      out.push({
        type: 'Literal',
        value: bucket.join('')
      })
      continue
    }

    var numberLiteralRegex = /[0-9]/

    if (numberLiteralRegex.test(currentToken)) {
      var bucket = lookahead(numberLiteralRegex)
      currentPosition += bucket.length
      out.push({
        type: 'NumberLiteral',
        value: bucket.join('')
      })
      continue
    }

    // Start of StringLiteral
    if (currentToken === "'") {
      currentPosition++ // skip first '
      var bucket = lookahead(/[^']/)
      currentPosition += bucket.length
      out.push({
        type: 'StringLiteral',
        value: bucket.join('')
      })
      currentPosition++ // skip last '
      continue
    }

    throw new TypeError('Unknown token: ' + util.inspect(currentToken))

  }

  return out
}
