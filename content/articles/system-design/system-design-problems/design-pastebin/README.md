# Draft: Design Pastebin

Building a text-sharing service like Pastebin.

## TLDR

- URL generation requires uniqueness and brevity
- Expiration policies manage storage
- Abuse prevention protects the platform

## Outline

1. Content storage: text storage, compression
2. URL generation: short unique identifiers
3. Expiration: time-based, burn-after-read
4. Syntax highlighting: language detection, formatting
5. Access control: public, unlisted, private
6. Size limits: handling large pastes
7. Abuse prevention: spam, illegal content
