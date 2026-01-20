---
lastUpdatedOn: 2023-08-17
tags:
  - js
  - ts
  - unicode
  - encoding
  - frontend
  - performance
---

# JavaScript String Length and Unicode

Understand why `'👨‍👩‍👧‍👦'.length` returns 11 instead of 1, and learn how to properly handle Unicode characters, grapheme clusters, and international text in JavaScript applications.

<figure>

![Image with different non-text icons](./cover.jpg)

<figcaption>
Photo by <a href="https://unsplash.com/@rikku72?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Maria Cappelli</a> on <a href="https://unsplash.com/photos/assorted-color-and-shape-plastic-toy-fXjG59gqZxo?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
</figcaption>
</figure>

## TL;DR

JavaScript's `string.length` property counts UTF-16 code units, not user-perceived characters. Modern Unicode text—especially emoji and combining characters—requires multiple code units per visual character. Use `Intl.Segmenter` for grapheme-aware operations.

```typescript
console.log("👨‍👩‍👧‍👦".length) // 11 - UTF-16 code units
console.log(getGraphemeLength("👨‍👩‍👧‍👦")) // 1 - User-perceived characters
```


## The Problem: What You See vs. What You Get

The JavaScript string `.length` property operates at the lowest level of text abstraction—UTF-16 code units. What developers perceive as a single character is often a complex composition of multiple code units.

```typescript
const logLengths = (...items) => console.log(items.map((item) => `${item}: ${item.length}`))

// Basic characters work as expected
logLengths("A", "a", "À", "⇐", "⇟")
// ['A: 1', 'a: 1', 'À: 1', '⇐: 1', '⇟: 1']

// Emoji require multiple code units
logLengths("🧘", "🌦", "😂", "😃", "🥖", "🚗")
// ['🧘: 2', '🌦: 2', '😂: 2', '😃: 2', '🥖: 2', '🚗: 2']

// Complex emoji sequences are even longer
logLengths("🧘", "🧘🏻‍♂️", "👨‍👩‍👧‍👦")
// ['🧘: 2', '🧘🏻‍♂️: 7', '👨‍👩‍👧‍👦: 11']
```

## The Solution: Intl.Segmenter

The `Intl.Segmenter` API provides the correct abstraction for user-perceived characters (grapheme clusters):

```typescript
function getGraphemeLength(str, locale = "en") {
  return [...new Intl.Segmenter(locale, { granularity: "grapheme" }).segment(str)].length
}

console.log("👨‍👩‍👧‍👦".length) // 11
console.log(getGraphemeLength("👨‍👩‍👧‍👦")) // 1

// Iterate over grapheme clusters
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" })
for (const grapheme of segmenter.segment("👨‍👩‍👧‍👦🌦️🧘🏻‍♂️")) {
  console.log(`'${grapheme.segment}' at index ${grapheme.index}`)
}
// '👨‍👩‍👧‍👦' at index 0
// '🌦️' at index 11
// '🧘🏻‍♂️' at index 14
```

## The Historical Foundation: From ASCII to Unicode

### The Age of ASCII (1960s)

ASCII emerged from the economic constraints of 1960s computing. Teleprinters were expensive, and data transmission costs were significant. The 7-bit design (128 characters) was a deliberate trade-off:

- **95 printable characters**: English letters, digits, punctuation
- **33 control characters**: Device instructions (carriage return, line feed)
- **Economic constraint**: 8-bit would double transmission costs

```typescript
// ASCII characters (U+0000 to U+007F) are single UTF-16 code units
"A".charCodeAt(0) // 65 (U+0041)
"a".charCodeAt(0) // 97 (U+0061)
```

### The Extended ASCII Chaos

ASCII's 128-character limit proved inadequate for global use. This led to hundreds of incompatible 8-bit "Extended ASCII" encodings:

- **IBM Code Pages**: CP437 (North America), CP850 (Western Europe)
- **ISO 8859 series**: ISO-8859-1 (Latin-1), ISO-8859-5 (Cyrillic)
- **Vendor-specific**: Windows-1252, Mac OS Roman

The result was `mojibake`—garbled text when documents crossed encoding boundaries.

### The Unicode Revolution

Unicode introduced a fundamental separation between abstract characters and their byte representations:

- **Character Set**: Abstract code points (U+0000 to U+10FFFF)
- **Encoding**: Concrete byte representations (UTF-8, UTF-16, UTF-32)

```typescript
// Unicode code points vs. encoding
"€".codePointAt(0) // 8364 (U+20AC)
"💩".codePointAt(0) // 128169 (U+1F4A9)
```

## Unicode Architecture: Planes and Code Units

### The 17 Unicode Planes

Unicode organizes its 1,114,112 code points into 17 planes:

| Plane | Range            | Name                                      | Contents                                                                                                  |
| ----- | ---------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 0     | U+0000–U+FFFF    | Basic Multilingual Plane (BMP)            | Most modern scripts (Latin, Cyrillic, Greek, Arabic, CJK), symbols, punctuation                           |
| 1     | U+10000–U+1FFFF  | Supplementary Multilingual Plane (SMP)    | Historic scripts (Linear B, Egyptian Hieroglyphs), musical notation, mathematical symbols, and most emoji |
| 2     | U+20000–U+2FFFF  | Supplementary Ideographic Plane (SIP)     | Additional, less common, and historic CJK Unified Ideographs                                              |
| 3     | U+30000–U+3FFFF  | Tertiary Ideographic Plane (TIP)          | Additional historic CJK Unified Ideographs, Oracle Bone script                                            |
| 4–13  | U+40000–U+DFFFF  | Unassigned                                | Reserved for future use                                                                                   |
| 14    | U+E0000–U+EFFFF  | Supplementary Special-purpose Plane (SSP) | Non-graphical characters, such as language tags and variation selectors                                   |
| 15–16 | U+F0000–U+10FFFF | Supplementary Private Use Area (SPUA-A/B) | Available for private use by applications and vendors; not standardized                                   |

### Code Units: The Building Blocks

Each encoding uses fixed-size code units:

- **UTF-8**: 8-bit code units (1-4 bytes per character)
- **UTF-16**: 16-bit code units (1-2 code units per character)
- **UTF-32**: 32-bit code units (1 code unit per character)

```typescript
// UTF-16 encoding examples
"€".length // 1 (BMP character)
"💩".length // 2 (supplementary plane - surrogate pair)
"👨‍👩‍👧‍👦".length // 11 (complex grapheme cluster)
```

## JavaScript's UTF-16 Legacy

JavaScript's string representation is a historical artifact from the UCS-2 era (1995). When Unicode expanded beyond 16 bits, JavaScript maintained backward compatibility by adopting UTF-16's surrogate pair mechanism.

### Surrogate Pairs

Supplementary plane characters (U+10000 to U+10FFFF) are encoded using surrogate pairs:

```typescript
// Surrogate pair encoding for U+1F4A9 (💩)
const highSurrogate = 0xd83d // U+D800 to U+DBFF
const lowSurrogate = 0xdca9 // U+DC00 to U+DFFF

// Mathematical transformation
const codePoint = 0x1f4a9
const temp = codePoint - 0x10000
const high = Math.floor(temp / 0x400) + 0xd800
const low = (temp % 0x400) + 0xdc00

console.log(high.toString(16), low.toString(16)) // 'd83d', 'dca9'
```

### The Legacy API Problem

JavaScript's core string methods operate on code units, not code points:

```typescript
const emoji = "💩"

// Unsafe operations
emoji.length // 2 (code units)
emoji.charAt(0) // '\uD83D' (incomplete surrogate)
emoji.charCodeAt(0) // 55357 (high surrogate only)

// Safe operations
emoji.codePointAt(0) // 128169 (full code point)
[...emoji].length // 1 (code points)
```

## Modern Unicode-Aware JavaScript

### Code Point Iteration

ES6+ provides code point-aware iteration:

```typescript
const text = "A💩Z"

// Unsafe: iterates over code units
for (let i = 0; i < text.length; i++) {
  console.log(text[i]) // 'A', '\uD83D', '\uDCA9', 'Z'
}

// Safe: iterates over code points
for (const char of text) {
  console.log(char) // 'A', '💩', 'Z'
}

// Spread operator also works
console.log([...text]) // ['A', '💩', 'Z']
```

### Grapheme Cluster Segmentation

For user-perceived characters, use `Intl.Segmenter`:

```typescript
const family = "👨‍👩‍👧‍👦"
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" })

// Count grapheme clusters
console.log([...segmenter.segment(family)].length) // 1

// Iterate over grapheme clusters
for (const grapheme of segmenter.segment(family)) {
  console.log(grapheme.segment) // '👨‍👩‍👧‍👦'
}
```

### Unicode-Aware Regular Expressions

The `u` flag enables Unicode-aware regex:

```typescript
// Without u flag: matches code units
/^.$/.test("💩") // false (2 code units)

// With u flag: matches code points
/^.$/u.test("💩") // true (1 code point)

// Unicode property escapes
/\p{Emoji}/u.test("💩") // true
/\p{Script=Latin}/u.test("A") // true
```

### String Normalization

Handle different representations of the same character:

```typescript
const e1 = "é" // U+00E9 (precomposed)
const e2 = "e\u0301" // U+0065 + U+0301 (decomposed)

console.log(e1 === e2) // false
console.log(e1.normalize() === e2.normalize()) // true
```

## Beyond JavaScript: Full-Stack Unicode Considerations

### Database Storage

MySQL's legacy `utf8` charset only supports 3 bytes per character, excluding supplementary plane characters:

```sql
-- Legacy (incomplete UTF-8)
CREATE TABLE users (name VARCHAR(255) CHARACTER SET utf8);

-- Modern (complete UTF-8)
CREATE TABLE users (name VARCHAR(255) CHARACTER SET utf8mb4);
```

### API Design Best Practices

1. **Explicit Encoding**: Always specify UTF-8 in Content-Type headers
2. **Server-Side Normalization**: Normalize all input to canonical form
3. **Opaque Strings**: Don't expose internal character representations

```typescript
// API response with explicit encoding
res.setHeader("Content-Type", "application/json; charset=utf-8")

// Input normalization
const normalizedInput = userInput.normalize("NFC")
```

## Common Unicode-Related Bugs

### Surrogate Pair Corruption

```typescript
const emoji = "💩"

// Dangerous: splits surrogate pair
const corrupted = emoji.substring(0, 1) // '\uD83D' (invalid)

// Safe: use code point-aware methods
const safe = [...emoji][0] // '💩'
```

### Buffer Overflow with Multi-byte Characters

```typescript
// Dangerous: assumes 1 byte per character
const buffer = Buffer.alloc(100)
buffer.write(text.slice(0, 100)) // May overflow with emoji

// Safe: use proper encoding
const safeBuffer = Buffer.from(text, "utf8")
```

### Visual Spoofing (Homograph Attacks)

```typescript
// Cyrillic 'а' vs Latin 'a'
const cyrillicA = "а" // U+0430
const latinA = "a" // U+0061

console.log(cyrillicA === latinA) // false
console.log(cyrillicA.normalize() === latinA.normalize()) // false
```

## Defensive Programming Strategies

### The Unicode Sanctuary Pattern

```typescript
class UnicodeSanctuary {
  // Decode on input
  static decode(input: Buffer, encoding: string = "utf8"): string {
    return input.toString(encoding).normalize("NFC")
  }

  // Process internally (always Unicode)
  static process(text: string): string {
    // All operations on normalized Unicode
    return text.toUpperCase()
  }

  // Encode on output
  static encode(text: string, encoding: string = "utf8"): Buffer {
    return Buffer.from(text, encoding)
  }
}
```

### Validation and Sanitization

```typescript
function validateUsername(username: string): boolean {
  // Normalize first
  const normalized = username.normalize("NFC")

  // Check for homographs
  const hasHomographs = /[\u0430-\u044F]/.test(normalized) // Cyrillic

  // Validate grapheme length
  const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" })
  const graphemeCount = [...segmenter.segment(normalized)].length

  return !hasHomographs && graphemeCount >= 3 && graphemeCount <= 20
}
```

## Conclusion

JavaScript's string length behavior isn't a flaw—it's a historical artifact reflecting the evolution of character encoding standards. Understanding this history is essential for building robust, globally-compatible applications.

The key insights:

1. **Abstraction Layers**: Characters exist at multiple levels (grapheme clusters, code points, code units)
2. **Historical Context**: JavaScript's UTF-16 choice reflects 1990s industry assumptions
3. **Modern Solutions**: Use `Intl.Segmenter` for grapheme-aware operations
4. **Full-Stack Awareness**: Unicode considerations extend beyond the browser

For expert developers, mastery of Unicode is no longer optional. In a globalized world, the ability to handle every script, symbol, and emoji correctly is fundamental to building secure, reliable software.

## References

- [String:Length - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length)
- [Intl.Segmenter - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter)
- [Unicode Standard](https://unicode.org/standard/standard.html)
- [UTF-8 Everywhere](http://utf8everywhere.org/)
- [JavaScript has a Unicode Problem](https://mathiasbynens.be/notes/javascript-unicode)
