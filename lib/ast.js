function toAST (tokens) {
  let currentIndex = 0

  function go () {
    let out = []

    function getUntil (type) {
      let bucket = []
      while (true) {
        let nextItem = tokens[currentIndex + bucket.length]
        if (!nextItem || nextItem.type === type) {
          break
        }
        bucket.push(nextItem)
      }
      return bucket
    }

    function getNext (offset = 0) {
      const tokenIndex = currentIndex + offset
      const token = tokens[tokenIndex]

      if (token.type === 'ArrayStart') {
        // skip this token
        currentIndex++

        let elements = getUntil('ArrayEnd')

        return [ {
          type: 'Array',
          elements: elements
        }, elements.length ]
      }

      if (token.type === 'ArrayEnd') {
        return []
      }

      if (
        token.type === 'Literal' ||
        token.type === 'NumberLiteral' ||
        token.type === 'FloatLiteral' ||
        token.type === 'StringLiteral'
      ) {
        return [ token ]
      }

      throw new TypeError(`Unknown token ${token.type}`)
    }

    while (currentIndex < tokens.length) {
      let [ next, incr = 1 ] = getNext()
      if (next) {
        out.push(next)
      }
      currentIndex += incr
    }

    return out
  }

  return {
    type: 'Program',
    body: go()
  }
}

export default toAST
