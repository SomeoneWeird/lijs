function toAST (tokens) {
  let currentIndex = 0

  function process () {
    let currentToken = tokens[currentIndex]

    if (
      currentToken.type === 'Literal' ||
      currentToken.type === 'NumberLiteral' ||
      currentToken.type === 'FloatLiteral' ||
      currentToken.type === 'StringLiteral') {
      currentIndex++
      return currentToken
    }

    if (currentToken.type === 'LineBreak') {
      // we don't care about this here
      currentIndex++
      return
    }

    if (currentToken.type === 'ArrayStart') {
      let node = {
        type: 'Array',
        elements: []
      }

      let currentToken = tokens[++currentIndex]

      while (currentToken.type !== 'ArrayEnd') {
        node.elements.push(process())
        currentToken = tokens[currentIndex]
      }

      currentIndex++

      return node
    }

    throw new Error(`Unknown token: ${currentToken.type}`)
  }

  let program = {
    type: 'Program',
    body: []
  }

  while (currentIndex < tokens.length) {
    program.body.push(process())
  }

  return program
}

export default toAST
