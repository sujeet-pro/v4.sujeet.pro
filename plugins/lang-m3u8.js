export default {
  doctype: /#EXTM3U/,
  uri: {
    pattern: /(\n)[^#].+/,
    lookbehind: true,
    alias: "url",
    inside: {
      variable: /{\$.+?}/,
      punctuation: /[/.?=&]/,
    },
  },
  tag: {
    pattern: /#EXT.+/,
    inside: {
      "attr-name": {
        pattern: /([:,])[A-Z-]+/,
        lookbehind: true,
      },
      "attr-value": [
        {
          pattern: /(=")[^"]*/,
          lookbehind: true,
          inside: {
            punctuation: /,/,
          },
        },
        {
          pattern: /(=)[^"\s,=]+/,
          lookbehind: true,
        },
      ],
      punctuation: [
        {
          pattern: /^=/,
          alias: "attr-equals",
        },
        {
          pattern: /[:,."]/,
        },
      ],
      number: /\d/,
    },
  },
  comment: /#.*/,
  variable: /{\$.+?}/,
};
