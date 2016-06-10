import util from 'util'

export default function tokenizer (input) {
  let out = []
  let currentPosition = 0

  function lookahead (match, matchNext) {
    let bucket = []
    while (true) {
      let nextIndex = currentPosition + bucket.length
      let nextToken = input[nextIndex]
      if (!nextToken) {
        break
      }
      let m = match
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
    let currentToken = input[currentPosition]

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

    let literalRegex = /[a-zA-Z]/
    let literalRegexNext = /[a-zA-Z0-9]/

    if (literalRegex.test(currentToken)) {
      let literalBucket = lookahead(literalRegex, literalRegexNext)
      currentPosition += literalBucket.length
      out.push({
        type: 'Literal',
        value: literalBucket.join('')
      })
      continue
    }

    let numberLiteralRegex = /[0-9\.]/

    if (numberLiteralRegex.test(currentToken)) {
      let numberBucket = lookahead(numberLiteralRegex)
      currentPosition += numberBucket.length
      let type = 'NumberLiteral'
      let value = numberBucket.join('')
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
      let bucket = lookahead(/[^']/)
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

    if (currentToken === '(' || currentToken === ')') {
      out.push({
        type: 'Parenthesis',
        value: currentToken
      })
      currentPosition++
      continue
    }

    throw new TypeError(`Unknown token: ${util.inspect(currentToken)}`)
  }

  return out
}
