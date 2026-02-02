# Draft: Design Amazon Shopping Cart

Building an e-commerce shopping cart system.

## TLDR

- Cart persistence handles guest and logged-in users
- Inventory reservation prevents checkout failures
- Promotions add complexity to pricing

## Outline

1. Cart persistence: logged-in vs guest carts
2. Cart merge: combining guest and user carts
3. Price updates: handling price changes
4. Inventory reservation: soft vs hard reservation
5. Promotions: coupon application, discount rules
6. Checkout flow: multi-step, address, payment
7. Abandoned cart: recovery, notifications
