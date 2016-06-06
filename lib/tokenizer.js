var util = require('util')

module.exports = function tokenizer (input) {
  var out = []
  var currentPosition = 0

  function lookahead (match, matchNext) {
    var bucket = []
    while (true) {
      var nextIndex = currentPosition + bucket.length
      var nextToken = input[nextIndex]
      if (!nextToken) {
        break
      }
      var m = match
      if (matchNext && bucket.length) {
        m = matchNext
      }
      if (!m.test(nextToken)) {
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
    var literalRegexNext = /[a-zA-Z0-9]/

    if (literalRegex.test(currentToken)) {
      var literalBucket = lookahead(literalRegex, literalRegexNext)
      currentPosition += literalBucket.length
      out.push({
        type: 'Literal',
        value: literalBucket.join('')
      })
      continue
    }

    var numberLiteralRegex = /[0-9\.]/

    if (numberLiteralRegex.test(currentToken)) {
      var numberBucket = lookahead(numberLiteralRegex)
      currentPosition += numberBucket.length
      var type = 'NumberLiteral'
      var value = numberBucket.join('')
      if (~value.indexOf('.')) {
        type = 'FloatLiteral'
      }
      out.push({
        type: type,
        value: value
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

    if (currentToken === '[') {
      out.push({
        type: 'ArrayStart'
      })
      currentPosition++
      continue
    }

    if (currentToken === ']') {
      out.push({
        type: 'ArrayEnd'
      })
      currentPosition++
      continue
    }

    throw new TypeError('Unknown token: ' + util.inspect(currentToken))
  }
  return out
}
