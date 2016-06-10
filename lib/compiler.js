import tokenizer from './tokenizer'
import toAST from './ast'
import transform from './transform'
import generate from './generate'

export default function compiler (input) {
  const tokens = tokenizer(input)
  const ast = toAST(tokens)
  const ast2 = transform(ast)
  const js = generate(ast2)

  return js
}
