// text => index into text => first substring that contains balanced paren pair
const nb_paren = text => start => {
	let bal = 0

	for (let i = start; i < text.length; ++i) {
		if (text[i] === '(')
			++bal
		else if (text[i] === ')' && --bal === 0)
			return text.substring(start, i + 1)
	}
}

// string => [node]
// node = [node] | string
function parse(text) {

	let word = ''
	const list = []

	for (let i = text.indexOf('(') + 1; i < text.length; ++i) {
		const c = text[i]

		if (c === ')') {
			return list
		} else if (c === '(') {
			const str = nb_paren(text)(i)
			list.push(parse(str))
			i += str.length - 1
		} else if (c.match(/\w/)) {
			word += c
		} else if (word) {
			list.push(word)
			word = ''
		}
	}

	throw 'paren error'
}

const builtin = cmd => (...xs) => `${cmd.toUpperCase()}(${xs.join(', ')})`
const functions = {
	and: builtin('and'),
	or:  builtin('or'),
	not: builtin('not'),
	nand: builtin('nand')
}

// parse list => parse list with 'args' recursively replaced based on map
const cmap = map => list => typeof(list) === 'string'
	? map[list] || list
	: list.map(cmap(map))

let v = 1
let aliases = {}
let env = {}
// [node] => [statements]
function evaluate(list)
{
	const [head, ...args] = list
	if (typeof(head) !== 'string')
		return list.map(evaluate).join('')

	const cmd = head.toLowerCase()

	// store a new function
	if (cmd === 'def') {
		const [signature, body] = args
		const [name, ...params] = signature

		functions[name] = (...xs) => {
			const map = Object.fromEntries(params.map((pname, i) => [pname, xs[i]]))

			return evaluate(cmap(map)(body))
		}

		return ''
	}

	if (cmd === 'let') {
		const [varname, varval] = args

		const val = evaluate(varval)
		const existing = (Object.entries(env).find(([k, v]) => v === val) || [])[0]

		if (!existing) {
			const newvar = `R${v++}`
			env[newvar] = val
			aliases[varname] = newvar
		} else {
			aliases[varname] = existing
		}

		return ''
	}

	const fun = functions[cmd]
	if (!fun) throw `command '${cmd}' was called but not found`

	// get all necessary statements to evaluate this function
	const vargs = args.map(x => {
		if (typeof(x) === 'string')
			return aliases[x] || x

		const val = evaluate(x)

		const existing = (Object.entries(env).find(([k, v]) => v === val) || [])[0]
		if (existing)
			return existing

		const var_name = `R${v++}`
		env[var_name] = val
		return var_name
	})
	return fun(...vargs)
}

const spaced = str => str.replace(/(\(|\))/g, ' $1 ')
const run = text => {
	v = 1
	aliases = {}
	env = {}

	text = text.replace(/--.+/g, '')

	const val = evaluate(parse(spaced(`(${text})`)))

	return [...Object.entries(env), ['', val]]
}