---
lastUpdatedOn: 2023-03-20
tags:
  - js
  - ts
---

# Length of a string

What you see is not always what you get!
The length of "👩‍👩‍👦‍👦🌦️🧘🏻‍♂️" is 21.
Let us explore why is it 21 and how to get 3.

<figure>

![Image with different non-text icons](./2023-03-20-js-length-of-a-string/2023-03-20-cover-length-of-a-string.jpg)

<figcaption>
Photo by <a href="https://unsplash.com/@rikku72?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Maria Cappelli</a> on <a href="https://unsplash.com/photos/assorted-color-and-shape-plastic-toy-fXjG59gqZxo?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
</figcaption>
</figure>

## Table of Contents

## TL;DR

`'👩‍👩‍👦‍👦🌦️🧘🏻‍♂️'.length` is 21 instead of 3 because JS gives length UTF-16 code
units and icons are a combination of more than one of such code units. Use
`Intl.Segmenter` to get the length of rendered graphemes.

```typescript
console.log("👩‍👩‍👦‍👦🌦️🧘🏻‍♂️".length); // 21
console.log(getVisibleLength("👩‍👩‍👦‍👦🌦️🧘🏻‍♂️")); // 3 - How can we get this?
```

## What is the `.length`?

> The `length` data property of a string contains the length of the string in
> UTF-16 code units. -
> [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length)

I always thought we used `utf-8` encoding, mostly because we use to set
`<meta charset="UTF-8">` in our HTML file.

> 💡Did you know, JS engines use UTF-16 encoding and not UTF-8?

```typescript
const logItemsWithlength = (...items) => console.log(items.map((item) => `${item}:${item.length}`));
logItemsWithlength("A", "a", "À", "⇐", "⇟");
// ['A:1', 'a:1', 'À:1', '⇐:1', '⇟:1']
```

In the above example. `A`, `a`, and `À` can be represented using `utf-8`
encoding and hence in length is 1, irrespective if you check utf-8 or utf-16
encoding.

`⇐` and `⇟` needs `utf-16` (if it was utf-8, its length would be 2)

But since all the characters could be represented using utf-16, the length for
each character is 1.

## Length of Icons

```typescript
logItemsWithlength("🧘", "🌦", "😂", "😃", "🥖", "🚗");
// ['🧘:2', '🌦:2', '😂:2', '😃:2', '🥖:2', '🚗:2']
```

The above icon needs two code points of UTF-16 to be represented, and hence the
length of all the icons is 2.

Encoding values for the icon - 🧘

- UTF-8 Encoding: 0xF0 0x9F 0xA7 0x98
- UTF-16 Encoding: 0xD83E 0xDDD8
- UTF-32 Encoding: 0x0001F9D8

### Icons With different colors

While using reactions in multiple apps, we have seen the same icons with
different colors, are they different icons or the same icons with some CSS
magic?

Irrespective of the approach, the length should be now 2, right? After all, two
codepoints of utf-16 encoding (basically utf-32 encoding) have a lot of possible
spaces to accommodate different colors.

```typescript
logItemsWithlength("🧘", "🧘🏻‍♂️");
//  ['🧘:2', '🧘🏻‍♂️:7']
```

Why is the icon in blue have a length of 7?

### Icons are like words!

```typescript
console.log("👩‍👩‍👦‍👦".length); // 11
console.log([..."👩‍👩‍👦‍👦"]);
// ['👩', '‍', '👩', '‍', '👦', '‍', '👦']
```

Icons, like words in English, are composed of multiple icons. And this can make
the icons of variable length.

## How do you split these?

```typescript
console.log("👩‍👩‍👦‍👦🌦️🧘🏻‍♂️".length); // 21
console.log("👩‍👩‍👦‍👦🌦️🧘🏻‍♂️".split(""));
// ['\uD83D', '\uDC69', '‍', '\uD83D', '\uDC69', '‍', '\uD83D', '\uDC66', '‍', '\uD83D', '\uDC66', '\uD83C', '\uDF26', '️', '\uD83E', '\uDDD8', '\uD83C', '\uDFFB', '‍', '♂', '️']
```

Since JS uses utf-16 encoding, splitting would give you those codepoints and is
not useful.

## Introducing Intl.Segmenter

> The `Intl.Segmenter` object enables locale-sensitive text segmentation,
> enabling you to get meaningful items (graphemes, words or sentences) from a
> string. -
> [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter)

```typescript
const segmenterEn = new Intl.Segmenter('en')
[...segmenterEn.segment('👩‍👩‍👦‍👦🌦️🧘🏻‍♂️')].forEach((seg) => {
  console.log(`'${seg.segment}' starting at index ${seg.index}`)
})
// '👩‍👩‍👦‍👦' starting at index 0
// '🌦️' starting at index 11
// '🧘🏻‍♂️' starting at index 14
```

## Getting the visible length of a string

Using the segmenter API, we could split the text based on the graphemes and get
the visible length of the string.

Since the output of `.segment()` is iterable, we will collect that in an array
and return its length.

```typescript
function getVisibleLength(str, locale = "en") {
  return [...new Intl.Segmenter(locale).segment(str)].length;
}
console.log("👩‍👩‍👦‍👦🌦️🧘🏻‍♂️".length); // 21
console.log(getVisibleLength("👩‍👩‍👦‍👦🌦️🧘🏻‍♂️")); // 3
```

## References

- [String:Length - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length)
- [Segmenter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter)
- [Latin-1 Supplement Wikipedia page](https://en.wikipedia.org/wiki/Latin-1_Supplement)
