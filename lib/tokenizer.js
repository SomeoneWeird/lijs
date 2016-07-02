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

  function lookaheadString (str) {
    let _tokens = str.split('')
    for (let i = 0; i < _tokens.length; i++) {
      if (input[currentPosition + i] !== _tokens[i]) {
        return false
      }
    }
    return true
  }

  function singleAdd (match, type, value) {
    let currentToken = input[currentPosition]
    if (currentToken !== match) {
      return false
    }
    let tmp = {
      type
    }
    if (value) {
      tmp.value = value
    }
    out.push(tmp)
    currentPosition++
    return true
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
    if (singleAdd('\n', 'LineBreak')) continue

    // Assignments
    if (singleAdd('$', 'AssignmentOperator')) continue

    // Flow control
    if (singleAdd('@', 'Iterator')) continue
    if (singleAdd('?', 'IfStatement')) continue

    if (lookaheadString('else')) {
      out.push({
        type: 'ElseExpression'
      })
      currentPosition += 4
      continue
    }

    if (lookaheadString('is')) {
      out.push({
        type: 'EqualityCheck'
      })
      currentPosition += 2
      continue
    }

    if (lookaheadString('contains')) {
      out.push({
        type: 'ContainsCheck'
      })
      currentPosition += 8
      continue
    }

    if (lookaheadString('use')) {
      out.push({
        type: 'ImportStatement'
      })
      currentPosition += 3
      continue
    }

    if (lookaheadString('as')) {
      out.push({
        type: 'ImportAsStatement'
      })
      currentPosition += 2
      continue
    }

    if (lookaheadString('export')) {
      out.push({
        type: 'ExportStatement'
      })
      currentPosition += 6
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
      if (/\.$/.test(value)) {
        throw new Error('invalid character .')
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

    if (singleAdd('[', 'ArrayStart')) continue
    if (singleAdd(']', 'ArrayEnd')) continue

    if (singleAdd('{', 'DefinitionPoint', currentToken)) continue
    if (singleAdd('}', 'DefinitionPoint', currentToken)) continue

    if (singleAdd('(', 'Parenthesis', currentToken)) continue
    if (singleAdd(')', 'Parenthesis', currentToken)) continue

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
