**My recommendation: 4 top-level sections**

| Section           | What goes here                                                                             | Why it works                                                  |
| ----------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **`/writing`**    | Technical blogs, implementation stories, reviews (papers, videos, blogs), adoption stories | Narrative, timestamped, your voice and opinions               |
| **`/deep-dives`** | How things work, tools (k6, statsig), internals (v8, node, browser), 3P services           | Exploratory, evergreen reference material                     |
| **`/work`**       | Design docs, architecture diagrams, case studies of things you've shipped                  | Portfolio of real impact — shows you build, not just theorize |
| **`/uses`**       | Setup, tools, productivity systems                                                         | Common pattern on dev sites (uses.tech), people love this     |

**What about the other items?**

- **TOMs** → Don't make it a nav item. Either put them as a feed on your homepage (like a microblog/stream), or make them a subsection within writing (`/writing/toms` or tagged). Short-form thoughts work best when they're _visible but not elevated_ to top-level.

- **System design, DS&A, leadership concepts** → These fit under `/deep-dives`. You can subcategorize: `/deep-dives/system-design`, `/deep-dives/algorithms`, `/deep-dives/leadership`. This reframes "interview prep" as "things I understand deeply" — much better for your audience.

**Visual structure:**

```
sujeet.pro
├── /writing
│   ├── technical posts
│   ├── reviews
│   └── toms (or tagged inline)
├── /deep-dives
│   ├── system-design
│   ├── tools
│   ├── internals
│   └── leadership
├── /work
│   ├── design-docs
│   └── architecture
└── /uses
```

**Why this works for your audience:**

Experienced professionals scanning your site will quickly see: "This person ships real things (`/work`), thinks deeply (`/deep-dives`), writes clearly (`/writing`), and is intentional about their craft (`/uses`)." That's exactly the signal you want.

Does this structure feel right, or do you want to explore alternatives?
