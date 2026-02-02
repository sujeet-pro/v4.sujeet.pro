# Real-World Case Studies Guidelines

This document provides guidance for writing articles in `content/articles/system-design/real-world-case-studies/`.

These articles are deep-dives into production systems—not just incidents, but also architectural evolutions, performance breakthroughs, and scaling milestones.

## Core Philosophy

### Beyond Incidents

Case studies include:

1. **Outages and incidents** - What broke, why, and lessons learned
2. **Performance breakthroughs** - How a change dramatically improved metrics
3. **Bottleneck removals** - Identifying and eliminating scaling limits
4. **Architecture evolutions** - Major rewrites, migrations, or paradigm shifts
5. **Unconventional solutions** - Novel approaches that challenged conventional wisdom

### Specificity is Everything

These articles must be **extremely specific**:
- Exact tools, versions, and configurations
- Actual numbers (requests/sec, latency percentiles, error rates)
- Specific team sizes and timelines
- Code snippets or configurations where available
- Links to original sources (engineering blogs, talks, postmortems)

### Learning-Focused Structure

Each case study answers:
1. **What was the situation?** - Context, scale, constraints
2. **What was the problem/opportunity?** - The trigger for change
3. **What options were considered?** - The decision-making process
4. **What was implemented?** - Technical deep-dive
5. **What was the outcome?** - Measurable results
6. **What can we learn?** - Transferable insights

## Required Article Structure

### 1. Title and Description

```markdown
# [Company/Product]: [Specific Topic]

How [Company] [achieved/solved/built] [specific thing] at [scale], and what engineers can learn from their approach.
```

### 2. Context Section (Critical)

Establish the situation before diving into details:

```markdown
## Context

### The System

[Company]'s [product/service] handles:
- **Scale:** [specific numbers]
- **Architecture:** [high-level description]
- **Tech stack:** [specific technologies with versions]

### The Trigger

[Date/timeframe]: [What happened or was needed]

**Key metrics at the time:**
| Metric | Value |
|--------|-------|
| Daily active users | X million |
| Requests per second | X |
| Data size | X TB/PB |
| Team size | X engineers |

### Constraints

- **Budget:** [if relevant]
- **Timeline:** [if relevant]
- **Technical debt:** [existing limitations]
- **Organizational:** [team structure, skills]
```

### 3. The Problem/Opportunity (Deep Dive)

```markdown
## The Problem

### Symptoms

[What users/operators observed]

**Timeline of escalation:**
- [Date]: [First signs]
- [Date]: [Escalation]
- [Date]: [Critical point]

### Root Cause Analysis

**Investigation process:**
1. [What they checked first]
2. [What they discovered]
3. [The "aha" moment]

**The actual root cause:**
[Detailed technical explanation]

```
[Diagram showing the failure mode / bottleneck]
```

### Why It Wasn't Obvious

[What made this hard to find/fix]
- [Complicating factor 1]
- [Complicating factor 2]
```

### 4. Options Considered (Required)

Show the decision-making process:

```markdown
## Options Considered

### Option 1: [Name]

**Approach:** [Description]

**Pros:**
- [Advantage 1]
- [Advantage 2]

**Cons:**
- [Disadvantage 1]
- [Disadvantage 2]

**Estimated effort:** [X weeks/months] with [Y engineers]

**Why not chosen:** [Specific reason]

### Option 2: [Name]

[Same structure]

### Option 3: [Chosen Approach]

**Approach:** [Description]

**Pros:**
- [Advantage 1]
- [Advantage 2]

**Cons:**
- [Disadvantage 1]
- [Disadvantage 2]

**Why chosen:** [Specific rationale]

### Decision Factors

| Factor | Option 1 | Option 2 | Option 3 |
|--------|----------|----------|----------|
| Time to implement | 6 months | 3 months | 4 months |
| Risk | Low | High | Medium |
| Long-term maintainability | Good | Poor | Good |
| Team expertise available | No | No | Yes |
```

### 5. Implementation Deep-Dive (The Core)

This is the heart of the article—be extremely specific:

```markdown
## Implementation

### Architecture Changes

**Before:**
```
[Diagram of previous architecture]
```

**After:**
```
[Diagram of new architecture]
```

**Key differences:**
1. [Change 1]: [Why it matters]
2. [Change 2]: [Why it matters]

### Technical Details

#### [Component 1]

**Technology:** [Exact tool/version]

**Configuration:**
```yaml
# Actual configuration (sanitized if needed)
setting_1: value
setting_2: value
```

**Why this configuration:**
- `setting_1: value` because [reason]
- `setting_2: value` because [reason]

**Code changes:**
```[language]
// Before
[old code]

// After
[new code]
```

**Why this change:**
[Technical explanation]

#### [Component 2]

[Same structure]

### Migration Strategy

**Approach:** [How they rolled this out]

**Phases:**
1. **Phase 1 (Week 1-2):** [What was done]
   - Risk mitigation: [How they reduced risk]
   - Rollback plan: [What they'd do if it failed]

2. **Phase 2 (Week 3-4):** [What was done]

**Monitoring during migration:**
- [Metric 1]: [Threshold for concern]
- [Metric 2]: [Threshold for rollback]

### Challenges Encountered

**Challenge 1:** [What went wrong]
- **Impact:** [How bad it was]
- **Resolution:** [How they fixed it]
- **Time to resolve:** [Duration]

**Challenge 2:** [What went wrong]
[Same structure]
```

### 6. Outcome Section (Required)

Concrete, measurable results:

```markdown
## Outcome

### Metrics Comparison

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| P99 latency | 500ms | 50ms | 10x |
| Error rate | 2% | 0.01% | 200x |
| Cost/request | $X | $Y | Z% reduction |
| Engineering hours/week (ops) | 40 | 5 | 8x reduction |

### Timeline

- **Total project duration:** X months
- **Engineering effort:** X person-months
- **Time to see results:** X days/weeks after deployment

### Unexpected Benefits

- [Benefit they didn't anticipate]
- [Another unexpected positive outcome]

### Remaining Limitations

- [What still isn't perfect]
- [Future work planned]
```

### 7. Lessons Learned (Required)

Transferable insights:

```markdown
## Lessons Learned

### Technical Lessons

#### 1. [Lesson Title]

**The insight:** [Core takeaway]

**How it applies elsewhere:**
- [Application 1]
- [Application 2]

**Warning signs to watch for:**
- [Sign that you might have this problem]

#### 2. [Lesson Title]

[Same structure]

### Process Lessons

#### 1. [Lesson about how they worked]

**What they'd do differently:**
[Specific change]

### Organizational Lessons

#### 1. [Lesson about team/company dynamics]

[How organization structure affected the outcome]
```

### 8. How to Apply This (Optional but Valuable)

Help readers apply insights to their own systems:

```markdown
## Applying This to Your System

### When This Pattern Applies

You might face similar challenges if:
- [Condition 1]
- [Condition 2]

### Checklist for Evaluation

- [ ] Are you seeing [symptom]?
- [ ] Is your scale approaching [threshold]?
- [ ] Do you have [prerequisite]?

### Starting Points

If you want to explore this approach:
1. [First step to investigate]
2. [Tool/technique to try]
3. [Metric to measure]
```

## Sourcing Requirements

### Primary Sources (Required)

Every case study must cite primary sources:

1. **Official engineering blogs** - Company's own writeup
2. **Conference talks** - With timestamps for specific claims
3. **Postmortem documents** - Public incident reports
4. **GitHub repos/PRs** - Where code is visible
5. **Papers** - If the company published research

### Verification

For each major claim:
- Link to source
- Quote relevant passage
- Note any caveats or uncertainty

### When Sources Are Limited

If primary sources don't cover everything:
```markdown
> **Note:** The following is reconstructed from [talk/blog] and may not reflect all implementation details. [Company] has not published specifics about [aspect].
```

## Case Study Types

### Type 1: Outage/Incident Analysis

Focus on:
- Detailed timeline
- Root cause chain
- Why detection was delayed
- Immediate vs long-term fixes
- Prevention mechanisms added

Example structure addition:
```markdown
## Incident Timeline

| Time (UTC) | Event | Action |
|------------|-------|--------|
| 14:00 | [Trigger] | - |
| 14:05 | [First alert] | Team paged |
| 14:15 | [Escalation] | [Response] |
| ... | ... | ... |

## Detection Gap

**Why it took X minutes to detect:**
[Analysis of monitoring gaps]

**Detection improvements made:**
- [New alert 1]
- [New dashboard 2]
```

### Type 2: Performance Breakthrough

Focus on:
- Before/after metrics
- What enabled the breakthrough
- Why it wasn't done earlier
- How the improvement was measured

### Type 3: Architecture Evolution

Focus on:
- Why the old architecture hit limits
- What drove the new design
- How migration was executed
- What the new architecture enables

### Type 4: Unconventional Solution

Focus on:
- Why conventional wisdom didn't apply
- What insight led to the unconventional approach
- How risk was managed
- When NOT to use this approach

## Quality Checklist

### Specificity
- [ ] Exact tools and versions named
- [ ] Actual numbers throughout (not "millions" but "3.2 million")
- [ ] Timelines with dates
- [ ] Team sizes mentioned
- [ ] Configuration snippets where relevant

### Sources
- [ ] All major claims have primary sources
- [ ] Links to engineering blogs/talks
- [ ] Timestamps for video sources
- [ ] Uncertainty explicitly noted where sources are limited

### Completeness
- [ ] Context fully established (scale, constraints, trigger)
- [ ] Options considered (not just chosen approach)
- [ ] Implementation deep-dive (not high-level summary)
- [ ] Measurable outcomes
- [ ] Lessons learned that apply beyond this case

### Learning Value
- [ ] Transferable insights identified
- [ ] Warning signs readers can watch for
- [ ] When this approach does NOT apply
- [ ] Starting points for readers to explore

## Examples of Good Case Study Topics

### Incidents
- **Facebook 2021 BGP outage** - DNS dependency, physical access
- **AWS Kinesis 2020** - Metadata explosion, thundering herd
- **GitLab 2017 database deletion** - Backup verification

### Performance Breakthroughs
- **Discord Rust rewrite** - 10x latency improvement
- **LinkedIn feed ranking optimization** - 50% latency reduction
- **Cloudflare Pingora** - Replacing NGINX for 1M+ RPS

### Architecture Evolutions
- **Netflix microservices migration** - Monolith to microservices
- **Uber Schemaless to Docstore** - Database evolution
- **Slack's channel-based sharding** - Scaling real-time messaging

### Unconventional Solutions
- **Figma multiplayer CRDTs** - Not using OT
- **Discord's Cassandra partition strategy** - Counter-intuitive keys
- **Cloudflare's Quicksilver** - Replacing etcd with custom solution

## Finding Case Studies

### Sources to Mine

1. **Company engineering blogs:**
   - Netflix Tech Blog
   - Uber Engineering
   - Discord Blog
   - Slack Engineering
   - Meta Engineering
   - Google Cloud Blog
   - AWS Architecture Blog

2. **Conference talks:**
   - Strange Loop
   - QCon
   - KubeCon
   - AWS re:Invent
   - Google I/O (infrastructure talks)

3. **Postmortem databases:**
   - https://github.com/danluu/post-mortems
   - https://statuspage.io (major incidents)

4. **Academic papers:**
   - USENIX conferences
   - VLDB
   - SIGMOD
   - OSDI

5. **Podcasts/interviews:**
   - Software Engineering Daily
   - The Changelog
   - CoRecursive
