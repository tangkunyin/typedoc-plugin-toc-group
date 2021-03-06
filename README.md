# typedoc-plugin-toc-group

A plugin for [TypeDoc](https://github.com/TypeStrong/typedoc) that generate a menu for toc content list.

It can help you group your api list by `@platform`、`@kind`、`@group`. Just put the keywords to you code content then it will be ok when TypeDoc build over.

## Installation

```
npm install --save-dev typedoc-plugin-toc-group
```

## Usage

```
npx typedoc --out ./typings/doc  ./typings  --module umd --theme ./node_modules/typedoc-default-themes-extension/bin/default"

// or make a filter. if you don't want show Interfaces, we can use this
npx .... --tocg !256 --theme ./node_modules/typedoc-default-themes-extension/bin/default

```

the enum number were defined here: [ReflectionKind](https://github.com/TypeStrong/typedoc/blob/master/src/lib/models/reflections/abstract.ts)

## What does it look like?

![demo-snapshot](snapshot.png)

## Something else...

I have made a little change in [typedoc-default-themes-extension](https://github.com/tangkunyin/typedoc-default-themes-extension)

In order to show a bigger group title to users, you'd better install this theme first.
