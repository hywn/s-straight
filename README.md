# s-straight

```
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
```

```
R3 = NOT(p)
R2 = AND(p, R3)
R5 = NOT(p)
R4 = AND(p, R5)
R1 = OR(R2, R4)
R8 = NOT(q)
R7 = AND(q, R8)
R10 = NOT(q)
R9 = AND(q, R10)
R6 = OR(R7, R9)
R13 = NOT(R6)
R12 = AND(R1, R13)
R15 = NOT(R1)
R14 = AND(R6, R15)
R11 = OR(R12, R14)
NOT(R11)
```