# 1 - Record decisions as ADRs

### Status
Accepted

### Decision
We will record architecturally significant design decisions to preserve context and rationale. 

### Context
We often forget why we chose to do something a certain way, and this leads to an increased likelihood of repeating the same mistakes in the future. We would like to keep a record of the high level decisions made so that we can refer to them when faced with new decisions. This will also help new team members to get a good overview of our systems and an understanding of why things are done the way they are.

### Consequences
Going forward, we will record architecturally significant decisions. There will be some debate about what is architecturally significant, and we should try to maintain a balance. As a rough guide, if there's a design proposal that generates a lot of discussion, it's probably architecturally significant and should be recorded. 

Our decisions will be available for everyone, present and future. We should not be confused about what choices were made to affect the architecture of a system.

### Rejected alternatives
#### Don't do it
We could continue *not* capturing design decisions, but we agreed that this is definitely worth trying out for reasons listed above.

#### Formal spec
We discussed a formal process proposal to capture how / when / why we use ADRs but this was determined to be anti-agile and contrary to the spirit of ADRs. We want a lightweight solution to the problem that is developer driven so that these documents have a good chance of being kept up to date.

## Related documents

 - Michael Nygard's [blog post](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions) on the topic
 - Joel Parker Henderson's [ADR github repo](https://github.com/joelparkerhenderson/architecture_decision_record) contains many links
 - [Wikipedia entry](https://en.wikipedia.org/wiki/Architectural_decision)
