// text => index into text => first substring that contains balanced paren pair
const nb_paren = text => start => {
	let i   = start
	let bal = 0

	for (; i<text.length; ++i) {
		if (text[i] === '(') ++bal
		else if (text[i] === ')')
			if (--bal === 0)
				return text.substring(start, i + 1)
	}
}

// string => [node]
// node = [node] | string
function parse(text) {

	const nbbb = nb_paren(text)

	let i = 0

	while(text[i] !== '(') i += 1

	++i

	const list = []

	let word = ''
	for(; i<text.length; ++i) {
		const c = text[i]
		if (c === ')') break
		if (c === '(') {
			const str = nbbb(i)
			list.push(parse(str))
			i += str.length - 1
		}
		if (c.match(/\w/))
			word += c
		else {
			if (word) {
				list.push(word)
				word = ''
			}
		}
	}

	return list
}

const builtin = cmd => (...xs) => [`${cmd.toUpperCase()}(${xs.join(', ')})`]

const functions = {
	and: builtin('and'),
	or:  builtin('or'),
	not: builtin('not')
}

let v = 1

// parse list => parse list with 'args' recursively replaced based on map
const cmap = map => list => typeof(list) === 'string'
	? map[list] || list
	: [list[0], ...list.slice(1).map(cmap(map))]

// [node] => [statements]
function evaluate(list)
{
	const [head, ...args] = list
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

const run = text => {
	text = text.replace(/--.+/g, '')

	const statements = []
	for (let i = 0; i < text.length; ++i) {
		if (text[i] !== '(') continue
		const str = nb_paren(text)(i)
		statements.push(str)
		i += str.length - 1
	}

	const spaced = str => str.replace(/(\(|\))/g, ' $1 ')

	// double iteration who????
	return statements.map(spaced).map(parse).map(evaluate).flat()
}

console.log(run(`
-- define XOR
(def (xor a b) (or
	(and a (not b))
	(and b (not a))
))

-- define equality
(def (eq a b) (not (xor a b)))

-- define function that always returns zero
(def (zero x) (xor x x))

-- defines function that always returns 1
(def (yes a b) (eq (zero a) (zero b)))

(yes p q) -- prints function that always returns 1
`).map(x => x).join('\n'))