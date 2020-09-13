/*
(def (xor a b) (
    (let na (not a))
    (let nb (not b))
    (or (and a nb) (and b na))
))
*/

let stack = []
const cmd = {}

const arrange = n => f => () => f(...new Array(n).fill(0).map(() => stack.pop()).reverse())

cmd['over'] = () => stack.push(stack[stack.length - 2])
cmd['2dup'] = () => { cmd.over(); cmd.over() }
cmd['swap'] = arrange(2)((a, b) => stack.push(b, a))
cmd['rot']  = arrange(3)((a, b, c) => stack.push(b, c, a))

let v = 1
let vals = {}
const builtin = n => name => arrange(n)((...got) => {
	const varname = `R${v++}`
	vals[varname] = `${name.toUpperCase()}(${got.join(', ')})`
	stack.push(varname)
})

cmd.not = builtin(1)('not')
cmd.and = builtin(2)('and')
cmd.or  = builtin(2)('or')

const run = program => {
	stack = []
	// cmd = [] // ???
	v = 1
	vals = {}

	let defmode = false
	let def = []

	program.match(/\w+|\[|\]/g).forEach(word => {
		if (word === ']' && defmode) {
			const [name, ...words] = def
			cmd[name] = () => words.forEach(w => cmd[w]())
			defmode = false
			def     = []

		} else if (word === '[') {
			defmode = true

		} else if (defmode) {
			def.push(word)

		} else if (cmd[word]) {
			cmd[word]()

		} else {
			stack.push(word)

		}
	})

	return [vals, stack]
}

console.log(run(`
[ xor
	2dup swap
	not and
	rot rot
	not and
	or
]

a b xor`))