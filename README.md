# unocss-attributify-rust (experimental)

Attributify Mode for [UnoCSS](https://github.com/unocss/unocss), 
modified for Rust and the `rsx!` macro. Currently, only [`dioxus`](https://dioxuslabs.com)'s `rsx!` macro has been tested with this package. **This package should be considered experimental. Please report any issues to this repository, not the UnoCSS repository.**

## Installation

```bash
# if your project has a git repository
git submodule add https://github.com/campbellcole/unocss-attributify-rust
# else
git clone https://github.com/campbellcole/unocss-attributify-rust
```

```ts
import presetAttributify from './unocss-attributify-rust/src/index'

Unocss({
  presets: [
    presetAttributify({ /* options */ }),
    // ...other presets
  ],
})
```

## Rust support

Enable Rust support with one of two options:
```ts
presetAttributify({
  rsxParsing: true, // forces `rsx!` parsing and disables normal parsing
  // OR
  detectRust: true, // enables `rsx!` parsing on a per-file basis by searching for `use` statements
})
```

Basic support for conditional attributes is also implemented:
```rs
let mut state = use_state(&cx, || true);

cx.render(rsx!(
    main {
        class: "w-full h-full",
        "bg": if *state.get() { "black" } else { "white" },
        "text": "white",
        "hello there",
        span {
            "state: {state}"
        }
        button {
            onclick: move |_| {
                state.set(!state);
            },
            "toggle"
        }
    }
))
```

### Caveats

It is currently required that all attributes be above the text content and children of an `rsx` element.
The `rsx` implementation in [`dioxus`](https://dioxuslabs.com) also requires this, so it currently isn't a problem.
However, if `dioxus` changes this in the future, the entire implementation in this package will have to change, because regex won't be able to handle that.

## Attributify Mode

This preset enabled [Windi CSS's Attributify Mode](https://windicss.org/posts/v30.html#attributify-mode) for **other presets**.

Imagine you have this button using Tailwind's utilities. When the list gets long, it becomes really hard to read and maintain.

```html
<button class="bg-blue-400 hover:bg-blue-500 text-sm text-white font-mono font-light py-2 px-4 rounded border-2 border-blue-200 dark:bg-blue-500 dark:hover:bg-blue-600">
  Button
</button>
```

With attributify mode, you can separate utilities into attributes:

```html
<button 
  bg="blue-400 hover:blue-500 dark:blue-500 dark:hover:blue-600"
  text="sm white"
  font="mono light"
  p="y-2 x-4"
  border="2 rounded blue-200"
>
  Button
</button>
```

For example, `text-sm text-white` could be grouped into `text="sm white"` without duplicating the same prefix.

### Prefix Self-referencing

For utilities like `flex`, `grid`, `border`, that have the utilities same as the prefix, a special `~` value is provided.

For example:

```html
<button class="border border-red">
  Button
</button>
```

Can be written as

```html
<button border="~ red">
  Button
</button>
```

### Valueless Attributify

In addition to Windi CSS's Attributify Mode, this presets also supports valueless attributes.

For example,

```html
<div class="m-2 rounded text-teal-400" />
```

now can be

```html
<div m-2 rounded text-teal-400 />
```

> Note: If you are using JSX, `<div foo>` might be transformed to `<div foo={true}>` which will make the generate CSS from UnoCSS failed to match the attributes. To solve this, you might want to try [`transformer-attributify-jsx`](https://github.com/unocss/unocss/tree/main/packages/transformer-attributify-jsx) along with this preset.

### Properties Conflicts

If the name of the attributes mode ever conflicts with the elements' or components' properties, you can add `un-` prefix to be specific to UnoCSS's attributify mode.

For example:

```html
<a text="red">This conflicts with links' `text` prop</a>
<!-- to -->
<a un-text="red">Text color to red</a>
```

Prefix is optional by default, if you want to enforce the usage of prefix, set

```ts
presetAttributify({
  prefix: 'un-',
  prefixedOnly: true, // <--
})
```

You can also disable the scanning for certain attributes by:

```ts
presetAttributify({
  ignoreAttributes: [
    'text'
    // ...
  ]
})
```

## TypeScript Support (JSX/TSX)

Create `shims.d.ts` with the following content:

> By default, the type includes common attributes from `@unocss/preset-uno`. If you need custom attributes, refer to the [type source](https://github.com/antfu/unocss/blob/main/packages/preset-attributify/src/jsx.ts) to implement your own type.

### Vue

Since Volar 0.36, [it's now strict to unknown attributes](https://github.com/johnsoncodehk/volar/issues/1077#issuecomment-1145361472). To opt-out, you can add the following file to your project:

```ts
// html.d.ts
declare module '@vue/runtime-dom' {
  interface HTMLAttributes {
    [key: string]: any
  }
}
declare module '@vue/runtime-core' {
  interface AllowedComponentProps {
    [key: string]: any
  }
}
export {}
```

### React

```ts
import type { AttributifyAttributes } from '@unocss/preset-attributify'

declare module 'react' {
  interface HTMLAttributes<T> extends AttributifyAttributes {}
}
```

### Vue 3

```ts
import type { AttributifyAttributes } from '@unocss/preset-attributify'

declare module '@vue/runtime-dom' {
  interface HTMLAttributes extends AttributifyAttributes {}
}
```

### SolidJS

```ts
import type { AttributifyAttributes } from '@unocss/preset-attributify'

declare module 'solid-js' {
  namespace JSX {
    interface HTMLAttributes<T> extends AttributifyAttributes {}
  }
}
```

### Svelte & SvelteKit

```ts
import type { AttributifyAttributes } from '@unocss/preset-attributify'

declare global {
  namespace svelte.JSX {
    interface HTMLAttributes<T> extends AttributifyAttributes {}
  }
}
```

### Astro

```ts
import type { AttributifyAttributes } from '@unocss/preset-attributify'

declare global {
  namespace astroHTML.JSX {
    interface HTMLAttributes extends AttributifyAttributes { }
  }
}
```

### Preact

```ts
import type { AttributifyAttributes } from '@unocss/preset-attributify'

declare module 'preact' {
  namespace JSX {
    interface HTMLAttributes extends AttributifyAttributes {}
  }
}
```

### Attributify with Prefix

```ts
import type { AttributifyNames } from '@unocss/preset-attributify'

type Prefix = 'uno:' // change it to your prefix

interface HTMLAttributes extends Partial<Record<AttributifyNames<Prefix>, string>> {}
```

## Credits

Initial idea by [@Tahul](https://github.com/Tahul) and [@antfu](https://github.com/antfu). Prior implementation in Windi CSS by [@voorjaar](https://github.com/voorjaar).

## License

MIT License &copy; 2021-PRESENT [Anthony Fu](https://github.com/antfu)
