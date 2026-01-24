# Draft: CSRF and CORS Defenses for Modern Web Apps

Threat models and defensive patterns for CSRF and CORS configuration.

## TLDR

- CSRF exploits ambient authority; SameSite cookies are the first line
- CORS is a browser policy, not a server-side security boundary
- Misconfigurations usually happen in preflight and wildcard rules

## Outline

1. CSRF threat model and attack surface
2. SameSite, CSRF tokens, and double-submit patterns
3. CORS basics: origins, preflight, and credentialed requests
4. Safe CORS configurations and anti-patterns
5. Testing and monitoring CSRF/CORS failures
6. Implementation checklist
