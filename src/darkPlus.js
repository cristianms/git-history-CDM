// Tema "Dark+ (default dark)" do VS Code mapeado para os tipos de token do Prism
const theme = {
  plain: {
    color: "#d4d4d4",
    backgroundColor: "#1e1e1e"
  },
  lineNumber: {
    color: "#858585"
  },
  styles: [
    {
      types: ["comment", "prolog", "cdata"],
      style: { color: "#6a9955" }
    },
    {
      types: ["string", "url", "attr-value", "template-string"],
      style: { color: "#ce9178" }
    },
    {
      types: ["number", "inserted"],
      style: { color: "#b5cea8" }
    },
    {
      types: ["deleted"],
      style: { color: "#ce9178" }
    },
    {
      types: ["keyword", "boolean", "tag", "doctype", "important", "atrule"],
      style: { color: "#569cd6" }
    },
    {
      types: ["function"],
      style: { color: "#dcdcaa" }
    },
    {
      types: ["class-name", "builtin", "namespace"],
      style: { color: "#4ec9b0" }
    },
    {
      types: ["attr-name", "property", "variable"],
      style: { color: "#9cdcfe" }
    },
    {
      types: ["constant", "symbol"],
      style: { color: "#4fc1ff" }
    },
    {
      types: ["selector", "entity"],
      style: { color: "#d7ba7d" }
    },
    {
      types: ["regex"],
      style: { color: "#d16969" }
    },
    {
      types: ["operator", "punctuation"],
      style: { color: "#d4d4d4" }
    }
  ]
};

module.exports = theme;
