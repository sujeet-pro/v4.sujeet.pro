export default {
  name: "m3u8",
  scopeName: "source.m3u8",
  fileTypes: ["m3u8"],
  patterns: [
    {
      name: "comment.line.number-sign.m3u8",
      match: "^#.*$",
      captures: {
        0: { name: "comment.line.number-sign.m3u8" },
      },
    },
    {
      name: "constant.language.m3u8",
      match: "^#EXTM3U",
      captures: {
        0: { name: "constant.language.m3u8" },
      },
    },
    {
      name: "meta.tag.m3u8",
      begin: "^(#EXT[^\\s]+)",
      end: "$",
      captures: {
        1: { name: "entity.name.tag.m3u8" },
      },
      patterns: [
        {
          name: "meta.attribute.m3u8",
          match: "([:,])([A-Z-]+)",
          captures: {
            1: { name: "punctuation.separator.key-value.m3u8" },
            2: { name: "support.type.property-name.m3u8" },
          },
        },
        {
          name: "string.quoted.double.m3u8",
          begin: '="',
          end: '"',
          captures: {
            0: { name: "punctuation.definition.string.begin.m3u8" },
            1: { name: "punctuation.definition.string.end.m3u8" },
          },
          patterns: [
            {
              name: "punctuation.separator.sequence.m3u8",
              match: ",",
            },
          ],
        },
        {
          name: "string.unquoted.m3u8",
          match: '=[^"\\s,=]+',
          captures: {
            0: { name: "punctuation.definition.string.m3u8" },
          },
        },
        {
          name: "constant.numeric.m3u8",
          match: "\\b\\d+\\b",
        },
        {
          name: "punctuation.separator.key-value.m3u8",
          match: "=",
        },
        {
          name: "punctuation.separator.sequence.m3u8",
          match: "[:,]",
        },
      ],
    },
    {
      name: "string.unquoted.m3u8",
      match: "^[^#].+$",
      captures: {
        0: { name: "string.unquoted.m3u8" },
      },
      patterns: [
        {
          name: "variable.other.m3u8",
          match: "{\\$[^}]+}",
          captures: {
            0: { name: "variable.other.m3u8" },
          },
        },
        {
          name: "punctuation.separator.path.m3u8",
          match: "[/]",
        },
        {
          name: "punctuation.separator.query.m3u8",
          match: "[?]",
        },
        {
          name: "punctuation.separator.parameter.m3u8",
          match: "[=&]",
        },
        {
          name: "punctuation.terminator.m3u8",
          match: "[.]",
        },
      ],
    },
    {
      name: "variable.other.m3u8",
      match: "{\\$[^}]+}",
      captures: {
        0: { name: "variable.other.m3u8" },
      },
    },
  ],
}
