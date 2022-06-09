module.exports = function BabelPluginEliminateDisplayName({ types: t }) {
  const NODE = t.binaryExpression(
    '!==',
    t.memberExpression(
      t.memberExpression(
        t.identifier('process'),
        t.identifier('env')
      ),
      t.identifier("NODE_ENV")
    ),
    t.stringLiteral("production")
  )

  function wrappedByIfProd(node) {
    return t.isIfStatement(node) && node.test && node.test.right && node.test.right.value === 'production'
  }

  const components = {}
  function addToMap(name) {
    if (name && /^[A-Z]/.test(name)) {
      components[name] = true
    }
  }

  return {
    visitor: {
      VariableDeclarator(path) {
        const { init, id } = path.node
        if (init && init.type === 'CallExpression' && init.callee && init.callee.type === 'MemberExpression' && init.callee.object.name === 'React' && ['forwardRef', 'memo'].includes(init.callee.property.name)) {
          addToMap(id.name)
        }

        if (init && (['FunctionExpression', 'ArrowFunctionExpression'].includes(init.type) || init.type === 'CallExpression' && ['forwardRef', 'memo'].includes(init.callee.name))) {
          addToMap(id.name)
        }
      },
      'FunctionDeclaration|ClassDeclaration'(path) {
        const functionName = path.node.id.name
        if (!/^_/.test(functionName)) {
          addToMap(functionName)
        }
      },
      ExpressionStatement(path) {
        const { type, left, operator } = path.node.expression
        const isAssignmentExpression = type === 'AssignmentExpression' &&
          operator === '=' &&
          components[left && left.object && left.object.name] === true &&
          left.property.name === 'displayName'

        if (!isAssignmentExpression) {
          return
        }

        const isWrappedBlockAndIf = t.isBlockStatement(path.parent) && wrappedByIfProd(path.parentPath.parent)
        if (isWrappedBlockAndIf) {
          return
        }

        const isWrapped = wrappedByIfProd(path.parent)
        if (isWrapped) {
          return
        }

        path.replaceWith(
          t.ifStatement(
            NODE,
            path.node
          )
        )
      },
    }
  }
}
