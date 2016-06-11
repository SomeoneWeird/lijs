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
          body: [
            {
              type: 'ReturnStatement',
              argument: visit(node.value, node)
            }
          ]
        }
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

function toIdentifier (node) {
  return {
    type: 'Identifier',
    name: node.name || node.value
  }
}