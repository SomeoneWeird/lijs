export default function transformAST (ast) {
  const visitor = {
    Program: function (node) {
      return {
        type: 'Program',
        body: node.body.map(function (child) {
          return visit(child, node)
        })
      }
    },
    FunctionCall: function (node, parent) {
      let out = {
        type: 'CallExpression',
        callee: toIdentifier(node),
        arguments: node.args.map(function (child) {
          return visit(child, node)
        })
      }
      if (parent.type === 'Program') {
        out = {
          type: 'ExpressionStatement',
          expression: out
        }
      }
      return out
    },
    FunctionDefinition: function (node) {
      var out = {
        type: 'FunctionDeclaration',
        id: toIdentifier(node),
        params: node.args.map(function (arg) {
          return visit(arg, node)
        }),
        defaults: [],
        body: {
          type: 'BlockStatement',
          body: node.body.map(function (childNode) {
            return visit(childNode, node)
          })
        }
      }
      let lastIndex = out.body.body.length - 1
      let last = out.body.body[lastIndex]
      out.body.body[lastIndex] = {
        type: 'ReturnStatement',
        argument: last
      }
      return out
    },
    Literal: toIdentifier,
    StringLiteral: toLiteral,
    NumberLiteral: toLiteral,
    FloatLiteral: toLiteral,
    Array: function (node, parent) {
      let out = {
        type: 'ArrayExpression',
        elements: node.elements.map(function (child) {
          return visit(child, node)
        })
      }
      if (parent.type === 'Program') {
        out = {
          type: 'ExpressionStatement',
          expression: out
        }
      }
      return out
    },
    Assignment: function (node, parent) {
      let out = {
        type: 'VariableDeclaration',
        declarations: [
          {
            type: 'VariableDeclarator',
            id: toIdentifier(node),
            init: visit(node.value, node)
          }
        ],
        kind: 'var'
      }
      return out
    },
    ImportStatement: function (node, parent) {
      let out = {
        type: 'CallExpression',
        callee: toIdentifier('require'),
        arguments: [ toLiteral(node) ]
      }
      if (parent.type === 'Program') {
        out = {
          type: 'ExpressionStatement',
          expression: out
        }
      }
      return out
    }
  }

  function visit (node, parent) {
    if (!visitor[node.type]) return node
    return visitor[node.type](node, parent)
  }

  return visit(ast)
}

function toNumberFloatLiteral (node) {
  return {
    type: 'Literal',
    value: parseFloat(node.value),
    raw: node.value.toString()
  }
}

function toLiteral (node) {
  if (node.type === 'NumberLiteral' || node.type === 'FloatLiteral') {
    return toNumberFloatLiteral(node)
  }
  return {
    type: 'Literal',
    value: node.value,
    raw: "'" + node.value + "'"
  }
}

function getNodeName (node) {
  return node.name || node.value || node
}

function toIdentifier (node) {
  // TODO: support more than 1 object call
  var name = typeof node === 'string' ? node : getNodeName(node)
  var tmp = name.split('.')
  if (tmp.length < 2) {
    return {
      type: 'Identifier',
      name
    }
  }
  return {
    type: 'MemberExpression',
    object: toIdentifier(tmp[0]),
    property: toIdentifier(tmp[1])
  }
}
