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
      return toMaybeExpressionStatement(out, parent)
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
      return toMaybeExpressionStatement(out, parent)
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
      if (node.name) {
        out = {
          type: 'VariableDeclaration',
          declarations: [ {
            type: 'VariableDeclarator',
            id: toIdentifier(node.name),
            init: out
          } ],
          kind: 'var'
        }
      }
      return toMaybeExpressionStatement(out, parent)
    },
    ExportStatement: function (node, parent) {
      let out = {
        type: 'AssignmentExpression',
        operator: '=',
        left: toIdentifier('module.exports'),
        right: toIdentifier(node.value)
      }
      return toMaybeExpressionStatement(out, parent)
    }
  }

  function visit (node, parent) {
    if (!visitor[node.type]) return node
    return visitor[node.type](node, parent)
  }

  return visit(ast)
}

function toMaybeExpressionStatement (node, parent) {
  if (parent.type !== 'Program') return node
  return {
    type: 'ExpressionStatement',
    expression: node
  }
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
    raw: `'${node.value}'`
  }
}

function getNodeName (node) {
  return node.name || node.value
}

function toIdentifier (node) {
  let name = typeof node === 'string' ? node : getNodeName(node)
  let items = name.split('.')

  if (items.length < 2) {
    return {
      type: 'Identifier',
      name
    }
  }

  items = items.map(toIdentifier)

  let out = {
    type: 'MemberExpression',
    object: items.shift(),
    property: items.shift()
  }

  for (let i = 0; i < items.length; i++) {
    out = {
      type: 'MemberExpression',
      object: out,
      property: items[i]
    }
  }

  return out
}
