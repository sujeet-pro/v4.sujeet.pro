# Draft: Design a Payment System

Building a payment processing system.

## TLDR

- Payment flows require careful state management
- Idempotency prevents duplicate charges
- Security and compliance are non-negotiable

## Outline

1. Payment flow: authorization, capture, settlement
2. Payment methods: cards, bank transfer, wallets
3. Idempotency: preventing duplicate charges
4. Security: PCI compliance, tokenization, encryption
5. Reconciliation: matching transactions, handling discrepancies
6. Refunds and disputes: chargeback handling
7. Fraud detection: rule-based, ML-based detection
