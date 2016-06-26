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

    if (
      currentToken.type === 'LineBreak' ||
      currentToken.type === 'SingleLineComment' ||
      currentToken.type === 'MultiLineComment') {
      // we don't care about this here
      currentIndex++
      return
    }

    if (currentToken.type === 'ImportStatement') {
      currentIndex++

      let next = process()

      if (next.type !== 'StringLiteral') {
        throw new Error('use statement must use string')
      }

      currentToken.value = next.value

      let maybeAs = tokens[currentIndex]

      if (maybeAs && maybeAs.type === 'ImportAsStatement') {
        currentIndex++ // this
        let name = process()
        if (name.type !== 'Literal') {
          throw new Error('must assign imports to literal')
        }
        currentToken.name = name.value
      }

      return currentToken
    }

    if (currentToken.type === 'ExportStatement') {
      currentIndex++

      let next = process()

      if (next.type !== 'Literal') {
        throw new Error('must export literal')
      }

      currentToken.value = next.value

      return currentToken
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

    if (currentToken.type === 'Parenthesis' && currentToken.value === '(') {
      // Skip this
      currentIndex++

      let functionCallNameNode = tokens[currentIndex++]

      if (functionCallNameNode.type !== 'Literal') {
        throw new Error('Function call name must be literal')
      }

      let args = []

      let currentToken = tokens[currentIndex]

      while (currentToken.type !== 'Parenthesis' ||
        (currentToken.type === 'Parenthesis' && currentToken.value !== ')')) {
        let next = process()
        if (next) {
          args.push(next)
        }
        currentToken = tokens[currentIndex]
      }

      let node = {
        type: 'FunctionCall',
        name: functionCallNameNode.value,
        args
      }

      // Skip )
      currentIndex++

      return node
    }

    if (currentToken.type === 'Definition') {
      // Skip this
      currentIndex++

      // Get function name
      let functionNameNode = tokens[currentIndex++]

      if (functionNameNode.type !== 'Literal') {
        throw new Error('Function name must be literal')
      }

      // Find function arguments
      let args = []

      let currentToken = tokens[++currentIndex]

      while (currentToken.type !== 'ArrayEnd') {
        let next = process()
        if (next) {
          args.push(next)
        }
        currentToken = tokens[currentIndex]
      }

      // Skip ArrayEnd
      currentIndex++

      let node = {
        type: 'FunctionDefinition',
        name: functionNameNode.value,
        body: [],
        args
      }

      let nextNode = tokens[currentIndex]

      if (nextNode.type === 'DefinitionPoint' && nextNode.value === '{') {
        // skip DefinitionPoint
        nextNode = tokens[++currentIndex]
        while (nextNode.type !== 'DefinitionPoint' || (nextNode.type === 'DefinitionPoint' && nextNode.value === '{')) {
          let next = process()
          if (next) {
            node.body.push(next)
          }
          nextNode = tokens[currentIndex]
        }
        currentIndex++ // skip }
      } else {
        let next = process()
        if (next) {
          node.body.push(next)
        }
      }

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
