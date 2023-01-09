import type { Extractor } from '@unocss/core'
import { isValidSelector } from '@unocss/core'
import { AttributifyOptions } from '.'

const strippedPrefixes = [
  'v-bind:',
  ':',
]

const splitterRE = /[\s'"`;]+/g

const elementRE = /<\w(?=.*>)[\w:\.$-]*\s((?:['"`\{].*?['"`\}]|.*?)*?)>/gs
const valuedAttributeRE = /([?]|(?!\d|-{2}|-\d)[a-zA-Z0-9\u00A0-\uFFFF-_:!%-.]+)=?(?:["]([^"]*)["]|[']([^']*)[']|[{]([^}]*)[}])?/gms

const rustUseStatementRE = /^use (?:(?:(?:[A-Za-z_][A-Za-z0-9_]*)|\*)(?:(?:::)|;$))*/gm
const rsxRE = /rsx!\(((?:.|\s)*)}\s*\)/gs
const rsxAttributesCondRE = /\w*\s?{\s*((?:"?[^"]*"?:\s?(?:(?:"[^"]+")|(?:if [^ {]+ { "[\w_]*" } else { "[\w_]*" }))*,\s*)*)/gm
const rsxAttributeValueCondRE = /"([a-zA-Z0-9\u00A0-\uFFFF-_:!%-.]+)":\s?(?:(?:["](?!{)([^"]*)(?!})["])|(?:if [^ {]*\s?{\s"([^"]*)"\s?}\s?else\s?{\s?"([^"]*)"\s?}))/gm

// const rsxAttributesRE = /{\s*((?:"?[^"]*"?:\s?"[^"]*",\s*)*)/gm
// const rsxAttributeValueRE = /"([a-zA-Z0-9\u00A0-\uFFFF-_:!%-.]+)":\s?(?:["](?!{)([^"]*)(?!})["])?/gm

export const defaultIgnoreAttributes = ['placeholder']

export const extractorAttributify = (options?: AttributifyOptions): Extractor => {
  const ignoreAttributes = options?.ignoreAttributes ?? defaultIgnoreAttributes
  const nonValuedAttribute = options?.nonValuedAttribute ?? true
  const trueToNonValued = options?.trueToNonValued ?? false
  const rsxParsing = options?.rsxParsing ?? false
  const detectRust = options?.detectRust ?? false

  return {
    name: 'attributify',
    extract({ code }) {
      // detects rust code by finding `use` statements
      const isRust = rsxParsing || (detectRust && Array.from(code.matchAll(rustUseStatementRE)).length > 0);
      if (isRust) {
        if (!rsxParsing) {
          console.log("detected Rust source code file, using rsx parsing");
        }
        // first match finds all instances of an `rsx!` invocation
        const result = Array.from(code.matchAll(rsxRE))
        // second match extracts the section of the macro invocation which contains element attributes
        // caveat: text content and nested nodes must occur after the attribute definitions
        .flatMap(match => Array.from((match[1] || '').matchAll(rsxAttributesCondRE)))
        // third match finds the key and value of every attribute in the block.
        // if the attribute has a conditional value, `value` will be undefined and
        // `cond1` and `cond2` will contain the values in the condition
        .flatMap(match => Array.from((match[1] || '').matchAll(rsxAttributeValueCondRE)))
        .flatMap(([, name, value, cond1, cond2]) => {
          console.log([name, value, cond1, cond2]);
          if (ignoreAttributes.includes(name)) {
            return []
          }

          for (const prefix of strippedPrefixes) {
            if (name.startsWith(prefix)) {
              name = name.slice(prefix.length)
              break
            }
          }

          if (!value) {
            if (cond1 && cond2) {
              return [cond1, cond2]
                .map(v => v.split(splitterRE))
                .flat()
                .filter(Boolean)
                .map(v => `[${name}~="${v}"]`)
            } else {
              console.warn(`found an attribute with no value: ${name}`)
              return []
            }
          }

          if (name === 'class') {
            return value
              .split(splitterRE)
              .filter(isValidSelector)
          } else {
            return value.split(splitterRE)
              .filter(Boolean)
              .map(v => `[${name}~="${v}"]`)
          }
        })

        return new Set(result)
      } else {
          const result = Array.from(code.matchAll(elementRE))
        .flatMap(match => Array.from((match[1] || '').matchAll(valuedAttributeRE)))
        .flatMap(([, name, ...contents]) => {
          const content = contents.filter(Boolean).join('')

          if (ignoreAttributes.includes(name))
            return []

          for (const prefix of strippedPrefixes) {
            if (name.startsWith(prefix)) {
              name = name.slice(prefix.length)
              break
            }
          }

          if (!content) {
            if (isValidSelector(name) && nonValuedAttribute !== false) {
              const result = [`[${name}=""]`]
              if (trueToNonValued)
                result.push(`[${name}="true"]`)
              return result
            }
            return []
          }

          if (['class', 'className'].includes(name)) {
            return content
              .split(splitterRE)
              .filter(isValidSelector)
          }
          else {
            if (options?.prefixedOnly && options.prefix && !name.startsWith(options.prefix))
              return []

            const extractTernary = Array.from(content.matchAll(/(?:[\?:].*?)(["'])([^\1]*?)\1/gms))
              .map(([,,v]) => v.split(splitterRE)).flat()
            return (extractTernary.length ? extractTernary : content.split(splitterRE))
              .filter(Boolean)
              .map(v => `[${name}~="${v}"]`)
          }
        })

        return new Set(result)
      }
    },
  }
}
