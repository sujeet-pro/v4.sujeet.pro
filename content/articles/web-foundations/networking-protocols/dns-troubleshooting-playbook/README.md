# Draft: DNS Troubleshooting Playbook

Step-by-step workflows to diagnose DNS outages, propagation issues, and resolver bugs.

## TLDR

- Start with symptoms, then isolate resolver vs authoritative failure
- Trace queries end-to-end to catch cache and propagation issues
- Validate records, TTLs, and DNSSEC signatures before rollback

## Outline

1. Symptom-driven triage and scope definition
2. Resolver vs authoritative diagnosis steps
3. Cache flushing, TTL overrides, and propagation checks
4. DNSSEC validation and common signing failures
5. CDN and load balancer DNS pitfalls
6. Incident playbook and postmortem checklist
