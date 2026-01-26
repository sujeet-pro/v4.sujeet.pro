# Research and Fact-Checking Guidelines

Deep research is **mandatory** for both new articles and updates. Always validate technical claims against authoritative sources.

## Research Workflow

1. **Clarify scope and versions**
   - Identify the exact spec/version or product release you are writing about.
   - If the request says "latest", verify it explicitly with sources.

2. **Survey the topic (breadth first)**
   - Do a quick landscape pass to identify canonical sections, common pitfalls, and edge cases.
   - Use this to outline the article before deep dives.

3. **Collect primary sources first**
   - Specifications (RFCs, WHATWG/W3C, ECMAScript, IETF, etc.)
   - Official documentation from standards bodies or vendors
   - Source code or reference implementations

4. **Read relevant implementations**
   - Inspect the local codebase when it is the subject of the article.
   - Skim reference implementations for behavior not obvious in specs.

5. **Section-level deep research**
   - For each section, gather the sources that justify claims, limits, defaults, and edge cases.
   - Prefer primary sources; triangulate with secondary sources only when needed.

6. **Cross-check and triangulate**
   - Validate claims across at least two reputable sources.
   - Flag contradictions and resolve them explicitly.

7. **Capture spec quotes**
   - Use short quotes (<= 25 words) to highlight nuanced or lesser-known details.
   - Quote the spec directly when it clarifies a subtle behavior.

8. **Record citations**
   - Every technical claim must map to a source.
   - Keep a running References list while writing.

## Source Priority Order

1. Official specifications and RFCs
2. Official documentation (vendor docs, MDN)
3. Source code / reference implementations
4. Peer-reviewed papers
5. Reputable engineering blogs or conference talks
6. Community Q&A (only for narrow implementation details)

## Fact-Checking Rules

- Verify all numbers, limits, defaults, and algorithmic behaviors.
- Confirm version-specific behavior and edge cases.
- Use absolute dates when referencing timelines or "recent" changes.
- If you cannot verify a claim, **label it as a hypothesis** or omit it.

## References Formatting

References should be a dedicated section in the Appendix:

```
## Appendix

### References

- [Spec Name](https://example.com) - Section or relevant clause
- [Official Docs](https://example.com) - Implementation details
```

## Update-Article Requirements

- Always perform fresh research, even when updating a small section.
- Read the existing article and relevant code before drafting changes.
- Verify existing claims for drift or outdated behavior.
- Replace or augment references with newer primary sources when available.
