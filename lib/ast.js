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
        let next = process()
        if (next) {
          node.elements.push(next)
        }
        currentToken = tokens[currentIndex]
      }

      currentIndex++

      return node
    }

    if (currentToken.type === 'AssignmentOperator') {
      let node = {
        type: 'Assignment',
        name: null,
        value: null
      }

      // Skip this token
      currentIndex++

      let assignmentNameNode = tokens[currentIndex++]

      if (assignmentNameNode.type !== 'Literal') {
        throw new Error('Variable name must be a literal')
      }

      node.name = assignmentNameNode.value

      let assignmentValueNode = process()

      if (assignmentValueNode.type === 'Assignment') {
        throw new Error('Variable value cannot be assignment')
      }

      node.value = assignmentValueNode

      return node
    }

    throw new Error(`Unknown token: ${currentToken.type}`)
  }

  let program = {
    type: 'Program',
    body: []
  }

  while (currentIndex < tokens.length) {
    let next = process()
    if (next) {
      program.body.push(next)
    }
  }

  return program
}

export default toAST
