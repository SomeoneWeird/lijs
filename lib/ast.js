function toAST (tokens) {
  let currentIndex = 0

  function getDefinitionBody () {
    let nextNode = tokens[currentIndex]
    let body = []

    if (nextNode.type === 'DefinitionPoint' && nextNode.value === '{') {
      // skip DefinitionPoint
      nextNode = tokens[++currentIndex]
      while (nextNode.type !== 'DefinitionPoint' || (nextNode.type === 'DefinitionPoint' && nextNode.value === '{')) {
        let next = process()
        if (next) {
          body.push(next)
        }
        nextNode = tokens[currentIndex]
      }
      currentIndex++ // skip }
    } else {
      let next = process()
      if (next) {
        body.push(next)
      }
    }

    return body
  }

  let checkTypes = [
    'EqualityCheck',
    'KindaCheck',
    'ContainsCheck',
    'ExistsCheck'
  ]

  let checkTypesRightSide = [
    'EqualityCheck',
    'KindaCheck',
    'ContainsCheck'
  ]

  let binaryCheckNodes = {
    add: 'Addition',
    sub: 'Subtraction',
    mul: 'Multiplication',
    div: 'Division',
    mod: 'Modulus'
  }

  function process () {
    let currentToken = tokens[currentIndex]

    if (
      currentToken.type === 'Literal' ||
      currentToken.type === 'NumberLiteral' ||
      currentToken.type === 'FloatLiteral' ||
      currentToken.type === 'StringLiteral' ||
      currentToken.type === 'EqualityCheck' ||
      currentToken.type === 'KindaCheck' ||
      currentToken.type === 'ContainsCheck' ||
      currentToken.type === 'ExistsCheck') {
      currentIndex++
      return currentToken
    }

    // Make sure this is before LineBreak check
    if (currentToken.type === 'ReturnStatement') {
      currentIndex++

      let out = {
        type: 'ReturnStatement',
        value: null
      }

      let nextToken = tokens[currentIndex]

      if (nextToken && nextToken.type !== 'LineBreak') {
        out.value = process()
      }

      return out
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

    if (currentToken.type === 'IfStatement') {
      currentIndex++

      let out = {
        type: 'IfStatement',
        check: {
          left: process()
        }
      }

      let checkNode = process()

      if (!~checkTypes.indexOf(checkNode.type)) {
        throw new Error('if statement must contain check type')
      }

      out.check.type = checkNode.type

      if (~checkTypesRightSide.indexOf(checkNode.type)) {
        out.check.right = process()
      }

      out.pass = getDefinitionBody()

      let currentToken = tokens[currentIndex]

      if (currentToken && currentToken.type === 'ElseExpression') {
        currentIndex++
        out.fail = getDefinitionBody()
      }

      return out
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

    if (currentToken.type === 'MakeStatement') {
      currentIndex++

      let node = {
        type: 'ObjectCreation'
      }

      let assignmentNameNode = tokens[currentIndex++]

      if (assignmentNameNode.type !== 'Literal') {
        throw new Error('Object name must be a literal')
      }

      node.name = assignmentNameNode.value

      return node
    }

    if (currentToken.type === 'GetStatement') {
      currentIndex++

      let nameNode = tokens[currentIndex++]

      if (nameNode.type !== 'Literal') {
        throw new Error('Object name must be literal')
      }

      let keyNode = tokens[currentIndex++]

      if (keyNode.type !== 'Literal' && keyNode.type !== 'StringLiteral') {
        throw new Error('Object key must be literal or string')
      }

      return {
        type: 'ObjectGet',
        name: nameNode.value,
        key: keyNode
      }
    }

    if (currentToken.type === 'SetStatement') {
      currentIndex++

      let nameNode = tokens[currentIndex++]

      if (nameNode.type !== 'Literal') {
        throw new Error('Object name must be literal')
      }

      let keyNode = tokens[currentIndex++]

      if (keyNode.type !== 'Literal' && keyNode.type !== 'StringLiteral') {
        throw new Error('Object key must be literal or string')
      }

      let valueNode = process()

      return {
        type: 'ObjectSet',
        name: nameNode.value,
        key: keyNode,
        value: valueNode
      }
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

      let node

      for (let n in binaryCheckNodes) {
        if (functionCallNameNode.value === n) {
          if (args.length > 2) {
            throw new Error('add/sub/mul/div/mod only support 2 arguments')
          }
          node = {
            type: binaryCheckNodes[n],
            left: args[0],
            right: args[1]
          }
          break
        }
      }

      if (!node) {
        node = {
          type: 'FunctionCall',
          name: functionCallNameNode.value,
          args
        }
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

      return {
        type: 'FunctionDefinition',
        name: functionNameNode.value,
        body: getDefinitionBody(),
        args
      }
    }

    if (currentToken.type === 'Iterator') {
      currentIndex++
      let iterValue = process()

      return {
        type: 'Iterator',
        value: iterValue,
        body: getDefinitionBody()
      }
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
