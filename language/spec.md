## Variable Assignment

```
$ a 1
```

## Function Calling

```
(add one two)
// add(one, two)
```

## Function declaration

```
def myFn [ one two ] {
  (add one two)
}
```

## Line breaks

Used for distinguishing expressions

Invalid:

```
def myFn [ one two ] {
  (add one two)
}
(add 1 2)
```

Valid:

```
def myFn [ one two ] {
  (add one two)
}

(add 1 2)
```