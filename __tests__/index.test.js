const path = require('path')
const babel = require('@babel/core')

const envRE = /if\s+\(process\.env\.NODE_ENV\s+!==\s+("production"|'production')\)/g

const options = {
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "edge": "17",
          "firefox": "60",
          "chrome": "67",
          "safari": "11.1"
        },
        "useBuiltIns": "usage",
        "corejs": "3.6.5"
      }
    ],
    [
      "@babel/preset-react",
      { "runtime": "automatic" }
    ]
  ],
  "plugins": [
    path.resolve('./index')
  ]
}

describe('test BabelPluginEliminateDisplayName', () => {
  it('FunctionDeclaration', () => {
    const code = `
      function App() {
        return <div>App</div>
      }
      App.displayName = 'App'
    `

    const result = babel.transformSync(code, options)
    const matched = result.code.match(envRE)
    expect(matched.length).toBe(1)
  })

  it('ClassDeclaration', () => {
    const code = `
      class App {
        contructor() {}

        render() {
          return <div>App</div>
        }
      }
      App.displayName = 'App'
    `

    const result = babel.transformSync(code, options)
    const matched = result.code.match(envRE)
    expect(matched.length).toBe(1)
  })

  it('VariableDeclarator', () => {
    const code = `
      const App = () => {
        return <div>App</div>
      }
      App.displayName = 'App'

      let App1 = () => {
        return <div>App</div>
      }
      App1.displayName = 'App'

      var App2 = () => {
        return <div>App</div>
      }
      App2.displayName = 'App'

      const App3 = function () {
        return <div>App</div>
      }
      App3.displayName = 'App'

      let App4 = function () {
        return <div>App</div>
      }
      App4.displayName = 'App'

      var App5 = function () {
        return <div>App</div>
      }
      App5.displayName = 'App'
    `

    const result = babel.transformSync(code, options)
    const matched = result.code.match(envRE)
    expect(matched.length).toBe(6)
  })

  it('React.forwardRef and React.memo', () => {
    const code = `
      const ForwardRefApp = React.forwardRef(() => {
        return <div>App</div>
      })
      ForwardRefApp.displayName = 'ForwardRef(App)'

      const MemoApp = React.memo(() => {
        return <div>App</div>
      })
      MemoApp.displayName = 'Memo(App)'
    `

    const result = babel.transformSync(code, options)
    const matched = result.code.match(envRE)
    expect(matched.length).toBe(2)
  })
})
