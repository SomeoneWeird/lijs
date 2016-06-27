# What?

A lisp-like compile-to JS language.

# Language

## Arrays

```
[ 1 2 3 4 5 ]
```

## Comments

### Single Line

```
// i am a comment
```

### Multi Line

```
/*
  i am a comment
*/
```

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

## Flow control

### iterate

```
$ arr [ 1 2 3 4 ]
@arr {
  (console.log item)
}
```

## Modules

### Importing

```
use 'fs' as fs
```

### Exporting

```
export fs
```
