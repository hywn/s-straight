# s-straight

## description
two toy 'languages'? that simplify some boolean expressions into 'AON straightline'

## background

### 1. weird 'list reduction'-type thing
my 'theory of computation' course asked us to write a bunch of 'AON straightline' solutions. this is very tedious, and I do not like tedious things, so I spent time trying to develop a tool that would allow me to do it non-tediously.

my first thoughts were to take something like

```
(or (and a (not b)) (and b (not a)))
```

and output some equivalent 'AON straightline' code, like

```
R1 = NOT(b)
R2 = AND(a, R1)
R3 = NOT(a)
R4 = AND(b, R3)
   = OR(R2, R4)
```

so I spent a while trying to figure that out. a significant hurdle was actually just figuring out how to parse the nested paren lists into actual nested lists, which I've never done before. it was pretty fun!! but quite hacked together. maybe I will rewrite it one day (but probably not)

another problem that took me a while to wrap my head around was how to store the intermediate values R1, R2, R3. for a while I did this like crazy stack-type thing where everything was stored as a string, and the program was generated by continually popping off last result and appending `Rn = {popped off string}`

somewhere in the process, i realized that i wanted to add 'defines' where you could do something like `xor = this function; impl = use xor to define impl`.

so that got thrown into the mix, and then i decided i wanted to make like 'bindings' where you could define variables within definitions to make your life easier.

eventually i ended up with the following strategy (hacked together and will prob never rewrite since this whole thing was just fun experiment)

- `env = {}` global variable that maps `R1` to `NOT(b)`, `R2` to `AND(a, R1)`, etc. every time a new (it actually checks if it's new and will reuse old R if it is not new) expression is created, it is added to `env`
- `aliases = {}` global variable that stores temporary bindings within definitions.
	- e.g. for the following, `not a` is evaluated and put into `env` like `env['R1']` = `NOT(a)`, and then `aliases['na'] = 'R1'`.
	 ```
	 (def (xor a b) (
	     (let na (not a))
	     (let nb (not b))
	     (or (and a nb) (and b na))
	 ))
	 ```
	 - this probably has a ton of bugs, esp. since it's a global variable. just thinking now I can imagine nested function calls overriding their parent's bindings, completely unrelated functions messing each other up because one used the name of another's bindings, etc.

and it all eventually worked for what i wanted it to do, which was nice. but its core was made in like a 4-hour write-as-you-think programming fever so it has structure of glue and cardboard.

### 2. stack-based
so i was pretty proud of my 'language' i made, but it was kinda ugly and a pain to read and write (but at least not more than 'AON straightline' itself). and I had happened to be fascinated and looking into 'combinatory logic/calculus/whatever/lambda calculus' that day and the idea that you can get rid of variables!!.

so I thought a bit about this and wondered if i could do something with like haskell syntax and everything would just be a bunch function composition and it would just print out the final function.

but I don't have strong theoretical background and was all very confusing. like i thought 'oh yes instead of `f a b = and(not(a), b)` you can do `f = not.and`!! and then started stumbling over how to compose _after_ a is taken, and I kinda eventually got that? but then I ran into 'how do you reuse variables though??' like

```
(def (xor a b) (or
	(and a (not b))
	(and b (not a))
))
```

how would you use `a` in both the `and` _and_ the `not`?? it didn't make very much sense to me and still doesn't make very much sense, and my brain still hurts to think about it and I want to study it more, but anyways I hit a pretty dead end.

but the next day (or night; not sure) i remembered 'stack based languages'. and it seemed perfect for this problem! it does not use variables, and you can duplicate and move stuff around willy-nilly. not very exciting theoretically blow your mind but still a very cool idea imo.

the following stuff is influenced by forth, which I have almost never used and only know vague abstract idea of. i basically just looked up some documentation for what i needed and copied the ideas.

so i made stack-based 'language' to simplify into 'AON straightline'. the implementation actually took me very little time, probably because i reused some concepts from the 'list-reduction whatever' and that the whole language is literally just a stack. here is structure

```
global stack = [] : the stack where everything happens
global cmd   = {} : lookup table for commands
global v     = 1  : R counter for naming variables
global vals  = {} : store the evaluated variables
```

running a program was basically `programtext.match(/\w+/g).forEach(word => cmd[word]())`.

but then to define new words, i made special `[ newword words to execute when newword called ]` syntax. am actually not sure how forth handles word definition and just slapped it together. `[` and `]` atm are not actually 'normal' words in that they aren't just part of the `cmd` lookup table, but i kinda wish they were... maybe will try to do that one day?? (probably not lol)

it seems to work atm but havent rlly tested w/ anything except simple xor program so not sure.

```
[ xor
	2dup swap
	not and
	rot rot
	not and
	or
]
```

#### more stack-based programs
so i used the language for more problems, and it was actually pretty nice. the following is a 'greater than' circuit for comparing two 4-bit numbers. the stack-based nature was very nice for breaking a problem down into one step that could pipeline into the same step, kinda like iteration/recursion?

```
[ gt not and ] -- a > b
[ nlt not or ] -- a >= b

-- takes stack: a b cmp
-- where a and b are new least-significant bits
-- and cmp is the last comparison
[ cmpstep
	rot rot    -- cmp a b
	2dup gt    -- cmp a b gt
	rot rot    -- cmp gt a b
	nlt        -- cmp gt nlt
	rot and or -- newcmp
]

[ gr4
	gt
	cmpstep cmpstep cmpstep
]

a3 b3 a2 b2 a1 b1 a0 b0 -- a3 is most-significant
gr4
```

the following is a program to make 4-bit adder with only NANDs. I added `push` and `pop` words which push/pop from an internal stack, which seems kinda weird using a stack inside of another stack and I wonder if this is where I would use memory in something like forth
```
-- !builtin 2->1 nand

[ not dup nand ]
[ and nand not ]
[ or  not swap not swap nand ]

-- vanilla XOR
[ xor 2dup swap not and rot rot not and or ]

[ xor -- more efficient NAND XOR
	2dup nand -- a b temp1
	dup rot   -- a temp1 temp1 b
	nand      -- a temp1 nand
	rot rot nand nand
]

[ carry and ]
[ add   xor ]

-- adds 1-bit to 2-bit: a b c -> (ab + c)
[ sadd
	2dup -- a b c b c
	carry rot rot add -- a carry add
	rot rot add swap
]

-- 1-bit add with carry (takes 3 inputs)
[ fadd
	2dup -- a b c b c
	carry rot rot add -- a carry add
	rot sadd
]
-- a b c fadd3

-- 4-bit add no carry
[ add4
	2dup carry rot rot add push -- sets up carry add
	fadd push
	fadd push
	fadd push drop

	pop pop pop pop
]
a0 b0 a1 b1 a2 b2 a3 b3 add4
```

i wrote one other program, [a multiplier](https://gist.github.com/hywn/6b0d521714101c71e0cf167d092e430d), which was very hacked-together and not very good. it basically did

```
accept 4-bit a, 4-bit b
bit done = zero? b
4-bit counter = b
4-bit result = 0
15 times do:
	result += (counter & donedonedonedone)
	counter -= (0b1111 & donedonedonedone)
	done = zero? counter
```

even right now I want to go back and move `done` completely into the loop, but I also don't really want to touch this problem again 🙂

also to solve it, I added `pushN` and `popN` like 'dynamic' words which would recognize any N and make a new stack and let you use it, which um idk seems not like a great idea