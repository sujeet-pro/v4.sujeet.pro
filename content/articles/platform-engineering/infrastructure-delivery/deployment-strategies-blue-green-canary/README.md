# Draft: Deployment Strategies: Blue-Green, Canary, and Rolling

Choosing release strategies to balance safety and velocity.

## TLDR

- Blue-green offers fast rollback at higher cost
- Canary enables gradual exposure with metrics-driven gates
- Rolling updates are simple but risk longer exposure

## Outline

1. Deployment strategy comparison
2. Traffic shifting and feature flags
3. Automated rollback criteria
4. Database migration coordination
5. Monitoring and release health checks
6. Operational playbooks
