/*** matchRecursiveRegExp
  Accepts a string to search, a left and right format delimiter
  as regex patterns, and optional regex flags. Returns an array
  of matches, allowing nested instances of left/right delimiters.
  Use the "g" flag to return all matches, otherwise only the
  first is returned. Be careful to ensure that the left and
  right format delimiters produce mutually exclusive matches.
  Backreferences are not supported within the right delimiter
  due to how it is internally combined with the left delimiter.
  When matching strings whose format delimiters are unbalanced
  to the left or right, the output is intentionally as a
  conventional regex library with recursion support would
  produce, e.g. "<<x>" and "<x>>" both produce ["x"] when using
  "<" and ">" as the delimiters (both strings contain a single,
  balanced instance of "<x>").

  examples:
    matchRecursiveRegExp("test", "\\(", "\\)")
      returns: []
    matchRecursiveRegExp("<t<<e>><s>>t<>", "<", ">", "g")
      returns: ["t<<e>><s>", ""]
    matchRecursiveRegExp("<div id=\"x\">test</div>", "<div\\b[^>]*>", "</div>", "gi")
      returns: ["test"]

*/
export declare function matchRecursiveRegExp(str: string, left: string, right: string, flags?: string): [start: number, end: number, content: string][];
//# sourceMappingURL=regex.d.ts.map