# Draft: DNS Security and Privacy: DNSSEC, DoH, and DoT

Security and privacy primitives for DNS, from DNSSEC validation to encrypted resolvers.

## TLDR

- DNSSEC protects integrity with signed records and trust chains
- DoH and DoT encrypt DNS queries but add policy tradeoffs
- Operational success depends on key management and resolver choice

## Outline

1. DNSSEC chain of trust and validation flow
2. Key rotation, DS records, and operational pitfalls
3. DoH vs DoT: latency, policy, and deployment models
4. Resolver selection and enterprise policy controls
5. Encrypted ClientHello (ECH) and privacy interactions
6. Testing and monitoring DNS security posture
