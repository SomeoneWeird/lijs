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
    let nextToken = input[currentPosition + 1]

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

    if (currentToken === 'u' && nextToken === 's' && input[currentPosition + 2] === 'e') {
      out.push({
        type: 'ImportStatement'
      })
      currentPosition += 3
      continue
    }

    let literalRegex = /[a-zA-Z]/
    let literalRegexNext = /[a-zA-Z0-9\.]/

    if (literalRegex.test(currentToken)) {
      let literalBucket = lookahead(literalRegex, literalRegexNext)
      currentPosition += literalBucket.length
      let str = literalBucket.join('')
      if (str === 'def') {
        out.push({
          type: 'Definition'
        })
        continue
      }
      out.push({
        type: 'Literal',
        value: str
      })
      continue
    }

    let numberLiteralRegex = /[0-9]/
    let numberLiteralRegexNext = /[0-9\.]/

    if (numberLiteralRegex.test(currentToken)) {
      let numberBucket = lookahead(numberLiteralRegex, numberLiteralRegexNext)
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

    if (currentToken === '{' || currentToken === '}') {
      out.push({
        type: 'DefinitionPoint',
        value: currentToken
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

    if (currentToken === '/') {
      if (nextToken === '/') {
        currentPosition += 2 // skip both //
        let bucket = lookahead(/[^\n]/)
        currentPosition += bucket.length
        out.push({
          type: 'SingleLineComment',
          value: bucket.join('')
        })
        continue
      }
      if (nextToken === '*') {
        currentPosition += 2 // skip both /*
        let bucket = lookahead(/(?!\*\/)/)
        // that regex leaves us with */ still on the end, pop them off
        bucket.pop()
        bucket.pop()
        currentPosition += bucket.length
        out.push({
          type: 'MultiLineComment',
          values: bucket.join('').split('\n')
        })
        currentPosition += 2 // skip */
        continue
      }
    }

    throw new TypeError(`Unknown token: ${util.inspect(currentToken)}`)
  }

  return out
}
