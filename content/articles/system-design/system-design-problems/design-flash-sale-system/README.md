# Draft: Design a Flash Sale System

Building a system to handle high-traffic flash sales.

## TLDR

- Traffic spikes require queue-based ordering
- Inventory management prevents overselling
- Fairness ensures legitimate users can participate

## Outline

1. Traffic handling: rate limiting, queue-based ordering
2. Inventory management: preventing overselling
3. Hot product handling: distributed inventory counters
4. Order processing: asynchronous order creation
5. Fairness: preventing bots, queue fairness
6. User experience: waiting room, progress indication
7. Post-sale handling: failed payment, cancellation
