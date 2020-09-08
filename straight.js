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

const builtin = cmd => (...xs) => [`${cmd.toUpperCase()}(${xs.join(', ')})`]
const functions = {
	and: builtin('and'),
	or:  builtin('or'),
	not: builtin('not')
}

// parse list => parse list with 'args' recursively replaced based on map
const cmap = map => list => typeof(list) === 'string'
	? map[list] || list
	: list.map(cmap(map))

let v = 1
let env = {}
// [node] => [statements]
function evaluate(list)
{
	const [head, ...args] = list
	if (typeof(head) !== 'string')
		return list.map(evaluate).flat()

	const cmd = head.toLowerCase()

	// store a new function
	if (cmd === 'def') {
		const [signature, body] = args
		const [name, ...params] = signature

		functions[name] = (...xs) => {
			const map = Object.fromEntries(params.map((pname, i) => [pname, xs[i]]))

			return evaluate(cmap(map)(body))
		}

		return []
	}

	if (cmd === 'let') {
		const [varname, varval] = args
		const stacked = evaluate(varval)
		env[varname] = stacked.pop()
		stacked.push(`${varname} = ${env[varname]}`)
		return stacked
	}

	const fun = functions[cmd]
	if (!fun) throw `command '${cmd}' was called but not found`

	// get all necessary statements to evaluate this function
	const collected = []
	const vargs = args.map(x => {
		if (typeof(x) === 'string')
			return x

		const var_name = `R${v++}`

		collected.push(...evaluate(x))
		collected.push(`${var_name} = ${collected.pop()}`)

		return var_name
	})

	// return all necessary statements + this function's evaluated statements
	return [...collected, ...fun(...vargs)]
}

const spaced = str => str.replace(/(\(|\))/g, ' $1 ')
const run = text => {
	v = 1

	text = text.replace(/--.+/g, '')

	return evaluate(parse(spaced(`(${text})`)))
}