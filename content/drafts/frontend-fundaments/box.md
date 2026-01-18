# Box Model

## Box Anatomy

- Content Box: contains content
- Padding Box: space around the content
- Border Box: contains the border containing both padding and content
- Margin Box - represents externsl space outside the element's border

## Box Properties

### Box Size

- Intrinsic: uses its content to determin the space it occupies
- Restricted: size is governed by ruls
  - Explicit width / height, set via css
  - Contrained by parents or other boxes
    - Flex / Grid layout system
    - Percentage of parent size
    - aspect ration (images, etc)
    - Presense of other children in the DOM tree

### Box Type

- Block level (includes display: block, but not restricted by that)
- Inline level
- Anonymous box

#### Block Level Box Type

- width: 100% of container
- height: intrinsic
- rendered top to bottom
- Participate in Block Context Formatting (BCF)

Eg.

- Lists: ul, ol, li
- Table: table, tfoot
- Semantic divs: div, section, main, nav, header, footer, p, pre, h1..h6, article, aside
- Art: figure, figcaption, video
- Form: fieldset, address, form,

##### Width Calculation based on box-sizing

Note: Margins are never included in the element's width calculation. They create space outside the element.

**box-sizing: content-box** (default)

The `width` property sets only the content width. Total rendered width is:

`Total Width = border-left + padding-left + content-width + padding-right + border-right`

Example: `width: 100px; padding: 10px; border: 5px solid;`

- Content width: 100px
- Total rendered width: 5 + 10 + 100 + 10 + 5 = 130px

**box-sizing: border-box**

The `width` property includes content + padding + border. Total rendered width equals the `width` value.

`width = border-left + padding-left + content-width + padding-right + border-right`

Example: `width: 100px; padding: 10px; border: 5px solid;`

- Total rendered width: 100px
- Content width: 100 - 5 - 10 - 10 - 5 = 70px

#### Inline Level Box Type

- Rendered as string, flow from left to right and top to bottom. (this is for ltr languages like english)
- they participate in Inline Formatting Context (IFC)
- Gnerate inline level boxes

e.g.: a, abbr, acronym, br, button, cite, img, input

Behaviour:

- Does not respond to width and height properties. Completely ignores them
- Doesn not react to vertical margins (ignores them)
- Inline padding does not alter the height of the inline element.

#### Anonymous Box (box type = behaves block level)

- Adds blocks for content, which doesn't have any defined boxes
- Its a Block Level Box

```html
<div>
  <p>Some text - this will be wrapped in TextNode</p>
</div>
This will be an anonymous box
```
