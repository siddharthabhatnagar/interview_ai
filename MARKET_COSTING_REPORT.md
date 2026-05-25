# IntervuAI Market Costing Report

Date: 2026-04-16

## Executive Summary

This report estimates IntervuAI's unit economics using the actual architecture in this repository and current public pricing from the vendors used in the product. The main conclusion is that the product is already profitable under the current credit model.

For a standard live interview with detailed feedback, the estimated direct variable cost is about $0.138, or about INR 11.5. When early production fixed infrastructure is allocated across roughly 1,000 interviews per month, the fully loaded cost is about $0.325, or about INR 27.1. At higher volume, the fixed-cost portion drops quickly and margins improve further.

The primary cost driver is Deepgram audio processing, not Cerebras inference. One operational caveat remains: the live flow currently has two post-interview save and evaluation paths, which can duplicate AI work if both are exercised.

## Architecture Basis Used For Costing

The numbers in this report are based on the implementation in this repository, not on a hypothetical architecture.

| Component | Repo evidence | Cost implication |
|---|---|---|
| Self-hosted Python interview agent | [agent/app.py](./agent/app.py), [agent/railway.json](./agent/railway.json) | Agent compute belongs to Railway, not to LiveKit hosted agent session pricing |
| LiveKit realtime rooms | [backend/src/services/livekitService.js](./backend/src/services/livekitService.js) | Costed as LiveKit Cloud room and participant usage |
| Deepgram STT and TTS in live interview | [agent/app.py](./agent/app.py) | Main variable cost driver per interview minute |
| Cerebras realtime interview LLM | [agent/app.py](./agent/app.py) | Realtime agent uses `llama3.1-8b`, which is relatively inexpensive |
| Cerebras post-interview evaluation and summary | [backend/src/services/gptService.js](./backend/src/services/gptService.js) | Evaluation uses `gpt-oss-120b`, but total token cost is still modest |
| Live completion path from frontend | [frontend/src/pages/LiveInterviewPage.jsx](./frontend/src/pages/LiveInterviewPage.jsx) | Backend evaluation, summary, and roadmap run after the live session |
| Current plan and credit model | [backend/src/services/paymentService.js](./backend/src/services/paymentService.js) | Used for profitability analysis |

## Vendor Pricing Snapshot

The following public pricing points were checked on 2026-04-16.

| Vendor | Public pricing used | Notes for IntervuAI |
|---|---|---|
| LiveKit Cloud | Build: $0/mo, Ship: $50/mo, Scale: $500/mo | Self-hosted agents count against WebRTC participant minutes, not LiveKit hosted agent-session minutes |
| Deepgram | PAYG with $200 free credit | Nova-2 STT: $0.0058/min PAYG, Aura-2 TTS: $0.030/1k chars PAYG |
| Cerebras | Developer self-serve starting at $10 | `gpt-oss-120b`: $0.35/M input tokens, $0.75/M output tokens; `llama3.1-8b`: $0.10/M input and output tokens |
| MongoDB Atlas | Flex up to $30/mo, M10 dedicated starting at $56.94/mo | M10 is a practical early-production baseline |
| Railway | Hobby $5 minimum, Pro $20 minimum | Used for backend and Python agent hosting |
| Vercel | Pro $20/mo + usage | Frontend hosting is mostly fixed at early scale |
| Razorpay | 2% platform fee plus 18% GST on the fee | Effective payment cost is about 2.36% of revenue |

## Costing Assumptions

| Assumption | Value |
|---|---|
| USD to INR | 83.3 |
| Quick interview duration | 8 minutes |
| Standard interview duration | 15 minutes |
| Deep interview duration | 25 minutes |
| Quick interview questions | 5 |
| Standard interview questions | 8 |
| Deep interview questions | 12 |
| TTS output assumption, quick | 1.0k chars |
| TTS output assumption, standard | 1.4k chars |
| TTS output assumption, deep | 2.2k chars |
| STT assumption | Conservative full-session audio billing |
| Fully loaded baseline | 1,000 interviews per month |
| Monthly fixed infrastructure for baseline | About $187 |

Notes:

- Duration and question counts are aligned with [backend/src/services/paymentService.js](./backend/src/services/paymentService.js).
- Live sessions also trigger backend scoring, summary generation, and roadmap generation through [backend/src/controllers/interviewController.js](./backend/src/controllers/interviewController.js).

## Direct Variable Cost Per Interview

| Interview SKU | STT | TTS | Cerebras | Estimated direct variable cost |
|---|---:|---:|---:|---:|
| Quick + Basic | $0.046 | $0.030 | about $0.006 | about $0.082 |
| Standard + Detailed | $0.087 | $0.042 | about $0.009 | about $0.138 |
| Deep + Premium | $0.145 | $0.066 | about $0.015 | about $0.226 |

Converted to INR at 83.3 INR/USD:

| Interview SKU | Direct variable cost in INR |
|---|---:|
| Quick + Basic | about INR 6.9 |
| Standard + Detailed | about INR 11.5 |
| Deep + Premium | about INR 18.8 |

## Fully Loaded Cost At Early Production Scale

This section allocates fixed monthly infrastructure across about 1,000 interviews per month using an early-production baseline of LiveKit Ship, MongoDB Atlas M10, Railway backend plus agent hosting, and Vercel Pro.

| Interview SKU | Direct variable cost | Fully loaded cost | Fully loaded cost in INR |
|---|---:|---:|---:|
| Quick + Basic | $0.082 | about $0.269 | about INR 22.4 |
| Standard + Detailed | $0.138 | about $0.325 | about INR 27.1 |
| Deep + Premium | $0.226 | about $0.413 | about INR 34.4 |

## Current Product Pricing

IntervuAI's current plans come from [backend/src/services/paymentService.js](./backend/src/services/paymentService.js).

| Plan | Price | Credits | Revenue per credit |
|---|---:|---:|---:|
| Starter | INR 499 | 15 | INR 33.3 |
| Growth | INR 999 | 35 | INR 28.5 |
| Pro | INR 1999 | 80 | INR 25.0 |

Approximate net revenue per credit after Razorpay fees:

| Plan | Net revenue per credit |
|---|---:|
| Starter | about INR 32.5 |
| Growth | about INR 27.9 |
| Pro | about INR 24.4 |

Current credit charges per interview:

| Interview option | Credit cost |
|---|---:|
| Quick + Basic | 1 credit |
| Standard + Detailed | 3 credits |
| Deep + Premium | 5 credits |

## Profitability Under Current Pricing

| Interview SKU | Effective revenue range | Fully loaded cost | Margin read |
|---|---:|---:|---|
| Quick + Basic | about INR 24.4 to INR 32.5 | about INR 22.4 | Profitable, but the thinnest edge case on the Pro plan at low scale |
| Standard + Detailed | about INR 73.2 to INR 97.5 | about INR 27.1 | Strongly profitable |
| Deep + Premium | about INR 122.0 to INR 162.5 | about INR 34.4 | Very strongly profitable |

The most important economic takeaway is that the analysis upsell is high margin. Deepgram drives most of the direct spend, while extra Cerebras spend for better analysis is relatively small.

## Market Benchmark

| Competitor | Public pricing found | Positioning takeaway |
|---|---:|---|
| Final Round AI | Free, $150 monthly, $83.33 monthly billed quarterly, $25 monthly billed annually, $41.67 monthly premium annual tier | Strong premium benchmark for AI interview assistance |
| Pramp / Exponent Practice | Free | Sets the free peer-practice baseline |
| Interviewing.io | Free AI interviewer visible on landing page, human practice positioned as premium | Human expert practice supports higher pricing tiers |

This means IntervuAI's current India-first pricing is conservative relative to premium global AI interview products.

## Recommendation For Judge Discussion

The clean judge-facing answer is:

- A standard detailed live interview costs about INR 11.5 in direct variable spend.
- With early production infrastructure included, the same interview costs about INR 27.1 fully loaded at around 1,000 interviews per month.
- At higher monthly volume, fixed infrastructure cost per interview falls quickly.
- The current pricing model remains profitable under those assumptions.

Recommended pricing stance:

1. Keep the current INR 499, INR 999, and INR 1999 bundles if the goal is adoption and growth.
2. If a safer margin floor is needed, reduce Pro from 80 credits to 70 credits, or raise Pro to INR 2299 to INR 2499.
3. If one-off pricing is introduced later, a practical starting ladder is INR 79 for quick, INR 149 for standard plus detailed feedback, and INR 249 for deep plus premium roadmap.

## Risks And Caveats

1. The live flow currently appears to have two result-save paths: [frontend/src/pages/LiveInterviewPage.jsx](./frontend/src/pages/LiveInterviewPage.jsx) calls `complete-live`, while [agent/app.py](./agent/app.py) also contains `save-live-results`. If both run, post-interview evaluation cost may be duplicated.
2. This report excludes customer acquisition cost, salaries, support headcount, taxes outside payment processing, and enterprise sales overhead.
3. Volume discounts or startup credits from vendors can improve margins further, but they are not assumed here unless clearly public.

## Suggested Next Actions

1. Deduplicate `complete-live` and `save-live-results` so live interviews do not run redundant scoring.
2. Recalculate unit economics after the first month of real usage using actual interview duration, average transcript size, and TTS character volume.
3. Create a separate recruiter or B2B pricing model, since per-seat or per-job pricing can support materially higher margins than candidate credit packs.