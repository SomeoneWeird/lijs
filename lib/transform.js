import crypto from 'crypto'

export default function transformAST (ast) {
  let variables = []

  function markVariableUsed (variable) {
    if (~variables.indexOf(variable)) return
    variables.push(variable)
  }

  function getUnusedVariable () {
    const variable = crypto.randomBytes(3).toString('hex')
    if (~variables.indexOf(variables)) {
      // already exists
      return getUnusedVariable()
    } else if (/^\d/.test(variable)) {
      // variables can't start with a number
      return getUnusedVariable()
    }
    return variable
  }

  const visitor = {
    Program: function (node) {
      return {
        type: 'Program',
        body: node.body.map(function (child) {
          return visit(child, node)
        }),
        _variables: variables
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
          body: null
        }
      }
      out.body.body = node.body.map(function (childNode) {
        return visit(childNode, out.body)
      })
      let lastIndex = out.body.body.length - 1
      let last = out.body.body[lastIndex]
      if (last) {
        if (last.type === 'ExpressionStatement') {
          last = last.expression
        }
        if (last.type !== 'IfStatement' && last.type !== 'ReturnStatement') {
          out.body.body[lastIndex] = {
            type: 'ReturnStatement',
            argument: last
          }
        }
      }
      return toMaybeExpressionStatement(out, node)
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
            id: toIdentifier(node.name),
            init: visit(node.value, node)
          }
        ],
        kind: 'var'
      }
      markVariableUsed(node.name)
      return out
    },
    ObjectCreation: function (node, parent) {
      let out = {
        type: 'VariableDeclaration',
        declarations: [ {
          type: 'VariableDeclarator',
          id: toIdentifier(node.name),
          init: {
            type: 'ObjectExpression',
            properties: []
          }
        } ],
        kind: 'var'
      }
      markVariableUsed(node.name)
      return toMaybeExpressionStatement(out, node)
    },
    ObjectGet: function (node, parent) {
      let name = visit(node.name, node)
      let key = visit(node.key, node)
      let out = toMemberExpression(toIdentifier(name), key, true)
      return toMaybeExpressionStatement(out, node)
    },
    ObjectSet: function (node, parent) {
      let name = visit(node.name, node)
      let key = visit(node.key, node)
      let value = visit(node.value, node)
      let out = {
        type: 'AssignmentExpression',
        operator: '=',
        left: toMemberExpression(toIdentifier(name), key, true),
        right: value
      }
      return toMaybeExpressionStatement(out, node)
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
        markVariableUsed(node.name)
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
    },
    Iterator: function (node, parent) {
      let arrOrIdentifierValue = visit(node.value, node)

      let isArray = arrOrIdentifierValue.type === 'ArrayExpression'

      let out = null

      if (isArray) {
        // We're going to hoist this array into a variable
        let arrVarName = getUnusedVariable()
        out = {
          type: 'BlockStatement',
          body: [ {
            type: 'VariableDeclaration',
            declarations: [ {
              type: 'VariableDeclarator',
              id: toIdentifier(arrVarName),
              init: arrOrIdentifierValue
            } ],
            kind: 'var'
          } ]
        }
        markVariableUsed(arrVarName)
        arrOrIdentifierValue = toIdentifier(arrVarName)
      }

      let forStatement = {
        type: 'ForStatement',
        init: {
          type: 'VariableDeclaration',
          declarations: [ {
            type: 'VariableDeclarator',
            id: toIdentifier('i'),
            init: toLiteral({
              type: 'NumberLiteral',
              value: 0
            })
          } ],
          kind: 'var'
        },
        test: {
          type: 'BinaryExpression',
          operator: '<',
          left: toIdentifier('i'),
          right: toMemberExpression(arrOrIdentifierValue, toIdentifier('length'))
        },
        update: {
          type: 'UpdateExpression',
          operator: '++',
          argument: toIdentifier('i'),
          prefix: false
        }
      }

      forStatement.body = {
        type: 'BlockStatement',
        body: null
      }

      forStatement.body.body = node.body.map(function (child) {
        return visit(child, forStatement.body)
      })

      forStatement.body.body.unshift({
        type: 'VariableDeclaration',
        declarations: [ {
          type: 'VariableDeclarator',
          id: toIdentifier('item'),
          init: toMemberExpression(arrOrIdentifierValue, toIdentifier('i'), true)
        } ],
        kind: 'var'
      })

      if (!out) {
        out = forStatement
      } else {
        out.body.push(forStatement)
      }

      return out
    },
    IfStatement: function (node, parent) {
      let out = {
        type: 'IfStatement'
      }

      switch (node.check.type) {
        case 'EqualityCheck':
        case 'KindaCheck': {
          out.test = {
            type: 'BinaryExpression',
            operator: node.check.type === 'EqualityCheck' ? '===' : '==',
            left: visit(node.check.left, node),
            right: visit(node.check.right, node)
          }
          break
        }
        case 'ContainsCheck': {
          out.test = {
            type: 'UnaryExpression',
            operator: '~',
            argument: {
              type: 'CallExpression',
              callee: toMemberExpression(visit(node.check.left, node), toIdentifier('indexOf')),
              arguments: [
                visit(node.check.right, node)
              ]
            }
          }
          break
        }
        case 'ExistsCheck': {
          out.test = visit(node.check.left)
          break
        }
      }

      out.consequent = {
        type: 'BlockStatement',
        body: null
      }

      out.consequent.body = node.pass.map(function (child) {
        return visit(child, out.consequent)
      })

      out.alternate = null

      if (node.fail) {
        out.alternate = {
          type: 'BlockStatement',
          body: null
        }
        out.alternate.body = node.fail.map(function (child) {
          return visit(child, out.alternate)
        })
      }

      return toMaybeExpressionStatement(out, parent)
    },
    ReturnStatement: function (node, parent) {
      let out = {
        type: 'ReturnStatement',
        argument: null
      }
      if (node.value) {
        out.argument = visit(node.value, node)
      }
      return out
    },
    Addition: function (node, parent) {
      let out = toBinaryExpression(visit(node.left, node), visit(node.right, node), '+')
      return toMaybeExpressionStatement(out, parent)
    },
    Subtraction: function (node, parent) {
      let out = toBinaryExpression(visit(node.left, node), visit(node.right, node), '-')
      return toMaybeExpressionStatement(out, parent)
    },
    Multiplication: function (node, parent) {
      let out = toBinaryExpression(visit(node.left, node), visit(node.right, node), '*')
      return toMaybeExpressionStatement(out, parent)
    },
    Division: function (node, parent) {
      let out = toBinaryExpression(visit(node.left, node), visit(node.right, node), '/')
      return toMaybeExpressionStatement(out, parent)
    },
    Modulus: function (node, parent) {
      let out = toBinaryExpression(visit(node.left, node), visit(node.right, node), '%')
      return toMaybeExpressionStatement(out, parent)
    }
  }

  function visit (node, parent) {
    if (!visitor[node.type]) return node
    return visitor[node.type](node, parent)
  }

  return visit(ast)
}

let expressionStatementTypes = [
  'Program',
  'BlockStatement'
]

function toBinaryExpression (left, right, operator) {
  return {
    type: 'BinaryExpression',
    operator,
    left,
    right
  }
}

function toMaybeExpressionStatement (node, parent) {
  if (!~expressionStatementTypes.indexOf(parent.type)) return node
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

function toMemberExpression (object, property, computed = false) {
  return {
    type: 'MemberExpression',
    object,
    property,
    computed
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

  let out = toMemberExpression(items.shift(), items.shift())

  for (let i = 0; i < items.length; i++) {
    out = toMemberExpression(out, items[i])
  }

  return out
}
