# System Design Fundamentals & Building Blocks Guidelines

This document provides guidance for writing articles in:
- `content/articles/system-design/system-design-fundamentals/`
- `content/articles/system-design/system-design-building-blocks/`

These articles cover foundational concepts and reusable components that appear across many system designs.

## Core Philosophy

### Design Choices, Not Prescriptions

Every fundamental concept has multiple valid implementations. The focus is:

1. **Present all viable approaches** - Not just the popular one
2. **Factors that influence the choice** - When does each approach shine?
3. **Explicit trade-offs** - What you gain, what you sacrifice
4. **Real-world examples** - Companies that chose each path and why

### Decision Framework Pattern

For every major concept, use this structure:

```markdown
## [Concept Name]

### Design Choices

#### Option A: [Name]

**How it works:** [Mechanism explanation]

**Best when:**
- [Condition 1]
- [Condition 2]

**Trade-offs:**
- ✅ [Advantage 1]
- ✅ [Advantage 2]
- ❌ [Disadvantage 1]
- ❌ [Disadvantage 2]

**Real-world example:** [Company] chose this because [specific reason].
The result: [concrete outcome]. The trade-off they accepted: [specific sacrifice].

#### Option B: [Name]

[Same structure]

### Decision Matrix

| Factor | Option A | Option B | Option C |
|--------|----------|----------|----------|
| Latency requirement | < 10ms | < 100ms | < 1s |
| Consistency need | Strong | Eventual OK | Eventual OK |
| Scale (ops/sec) | < 10K | < 100K | > 100K |
| Operational complexity | Low | Medium | High |

### Choosing Your Approach

**Start with these questions:**
1. [Question about requirements]
2. [Question about constraints]
3. [Question about team/org]

**Common patterns:**
- If [condition], lean toward [option]
- If [condition], lean toward [option]
```

## Real-World Examples Requirements

### Specificity Over Generality

Bad: "Many companies use consistent hashing"
Good: "Discord uses consistent hashing with 1000 virtual nodes per physical node to achieve <5% load variance after node failures"

### Include the Why and the Outcome

Bad: "Netflix uses Cassandra"
Good: "Netflix chose Cassandra for viewing history because they needed to handle 1M+ writes/second with eventual consistency acceptable for non-critical data. The trade-off: they built a custom repair mechanism (Priam) to handle Cassandra's operational complexity"

### Cite Specific Sources

Always link to:
- Engineering blog posts
- Conference talks (with timestamps)
- Design documents
- GitHub repos/issues

## Required Article Structure

### 1. Title and Description

```markdown
# [Concept Name]

Understanding [concept] for distributed systems: design choices, trade-offs, and when to use each approach.
```

### 2. Overview Diagram

Show the concept visually—how data flows, where state lives, what can fail.

### 3. Abstract (Mental Model)

Provide the key insight that makes the concept click:
- The core problem being solved
- Why naive solutions fail
- The fundamental trade-off space

### 4. Core Concept Explanation

Explain the mechanism in depth:
- How it works internally
- Invariants it maintains
- Failure modes

### 5. Design Choices Section (Required)

For each major implementation choice:

```markdown
## Design Choices

### [Choice Category 1]: [e.g., "Partitioning Strategy"]

#### Hash-Based Partitioning

**Mechanism:** [How it works]

**When to use:**
- Uniform access patterns
- No range query requirements
- Need even data distribution

**Trade-offs:**
- ✅ Even distribution with good hash function
- ✅ Simple to implement
- ❌ Range queries require scatter-gather
- ❌ Adding nodes requires full rehash (without consistent hashing)

**Real-world:** DynamoDB uses hash partitioning for item distribution.
Partition key choice is critical—hot partitions can throttle entire tables.
[Link to DynamoDB best practices doc]

#### Range-Based Partitioning

**Mechanism:** [How it works]

**When to use:**
- Time-series data
- Range query requirements
- Sequential access patterns

**Trade-offs:**
- ✅ Efficient range queries
- ✅ Sequential writes to same partition
- ❌ Hotspots on recent data
- ❌ Manual split point management

**Real-world:** HBase uses range partitioning (row key order).
Yahoo found hot regions were 80% of their operational issues.
Solution: salted row keys (prefix with hash) for write-heavy tables.
[Link to HBase best practices]
```

### 6. Factors Influencing Design Choices

Create a dedicated section on decision factors:

```markdown
## How to Choose

### Factors to Consider

#### 1. Access Patterns

| Pattern | Recommended Approach | Rationale |
|---------|---------------------|-----------|
| Random point reads | Hash partitioning | Even distribution |
| Range scans | Range partitioning | Sequential access |
| Time-series writes | Range + TTL | Natural ordering |
| Key-value with hot keys | Hash + caching | Spread load |

#### 2. Consistency Requirements

| Requirement | Approach | Example |
|-------------|----------|---------|
| Strong consistency | Single leader, sync replication | Banking transactions |
| Eventual (seconds) | Multi-leader, async replication | Social media feeds |
| Eventual (minutes OK) | Leaderless, gossip | DNS, config distribution |

#### 3. Scale Characteristics

| Scale Factor | Threshold | Recommended Approach |
|--------------|-----------|---------------------|
| Operations/sec | < 10K | Single node may suffice |
| Operations/sec | 10K-100K | Replication + caching |
| Operations/sec | > 100K | Sharding required |
| Data size | < 100GB | Single node |
| Data size | 100GB-10TB | Replication |
| Data size | > 10TB | Sharding required |

#### 4. Operational Constraints

Consider your team's ability to operate:
- **Managed services** when: small team, no dedicated SREs
- **Self-hosted** when: cost at scale, specific customization needs
- **Simpler tech** when: debugging > performance optimization
```

### 7. Real-World Case Studies (Required)

Include 2-3 detailed case studies:

```markdown
## Real-World Examples

### Slack: Message Ordering with Hybrid Clocks

**Problem:** Ordering messages across distributed servers with clock skew.

**Naive approach:** Physical timestamps
- Failed because: 50ms+ clock skew caused message reordering

**Chosen approach:** Hybrid Logical Clocks (HLC)
- Physical time when clocks agree
- Logical increment when clocks conflict
- Result: Causal ordering preserved, <1ms ordering latency

**Key insight:** They didn't need wall-clock ordering—causal ordering was sufficient for chat UX.

**Source:** [Slack Engineering Blog, 2020]

### Discord: Snowflake IDs for Message Ordering

**Problem:** Need globally unique, sortable IDs at 100K+ messages/second.

**Rejected approaches:**
1. UUIDs: Not sortable, poor index locality
2. Database sequences: Single point of failure, bottleneck

**Chosen approach:** Snowflake IDs
- 41 bits: timestamp (69 years of IDs)
- 10 bits: worker ID
- 12 bits: sequence (4096 IDs/ms/worker)

**Implementation detail:** They added 5 bits for datacenter ID (regional deployments).

**Trade-off accepted:** Clock skew can cause non-monotonic IDs from same worker—they added clock skew detection.

**Source:** [Discord Engineering Blog, 2017]
```

### 8. Common Pitfalls

Dedicate a section to mistakes:

```markdown
## Common Pitfalls

### 1. [Pitfall Name]

**The mistake:** [What people do wrong]

**Why it happens:** [Root cause]

**The consequence:** [What goes wrong]

**The fix:** [How to avoid it]

**Example:** [Company] hit this when [specific scenario]. They fixed it by [solution].
```

### 9. Appendix Requirements

#### Prerequisites
- Assumed knowledge (link to prerequisite articles)

#### Summary
- 3-5 key takeaways
- Decision framework summary

#### References
Prioritized:
1. Original papers/RFCs
2. Official documentation
3. Engineering blog posts from companies at scale
4. Conference talks (with timestamps)

## Quality Checklist

### Design Choices
- [ ] Multiple approaches presented for each major decision
- [ ] Clear "when to use" criteria for each approach
- [ ] Explicit trade-offs (pros AND cons)
- [ ] Real-world examples with specific details

### Decision Factors
- [ ] Factors organized by category (scale, consistency, access patterns, ops)
- [ ] Thresholds and criteria are specific, not vague
- [ ] Includes operational/team considerations

### Real-World Examples
- [ ] Specific companies named
- [ ] Concrete numbers (scale, performance, impact)
- [ ] Why they chose that approach
- [ ] What trade-off they accepted
- [ ] Source linked

### Depth
- [ ] Covers failure modes
- [ ] Addresses edge cases
- [ ] Includes common pitfalls
- [ ] Implementation details for critical mechanisms
