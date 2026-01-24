# Draft: OAuth 2.0 and OIDC Flows: Authorization Code to PKCE

A practical guide to OAuth 2.0 and OpenID Connect flows for web and mobile apps.

## TLDR

- Authorization Code + PKCE is the default safe flow for clients
- Tokens must be scoped, short-lived, and stored carefully
- OIDC layers identity on top of OAuth with ID tokens

## Outline

1. Roles and terminology (client, resource, authorization server)
2. Authorization Code flow with PKCE
3. Refresh tokens and rotation strategies
4. ID tokens, scopes, and userinfo endpoints
5. Common security pitfalls and mitigations
6. Implementation checklist and sample diagrams
