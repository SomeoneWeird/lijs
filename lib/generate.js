import escodegen from 'escodegen'

export default function generator (ast) {
  return escodegen.generate(ast)
}
