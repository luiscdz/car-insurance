# Project Constitution

Non-negotiable principles of the car insurance quoting product. Every spec, plan, line of code and review follows them. Product context: [docs/context.md](../docs/context.md); technology: [docs/stack.md](../docs/stack.md).

## P1. One application, one build, two countries

The same application and the same build serve Colombia and Chile. Code has no country-specific branches; country differences come from content and configuration.

**Why:** the product sells in both countries with a single front end, and adding or changing a country must not fork the code.

## P2. Business content lives in Strapi

Form fields, validations, copy, plans and terms are configured in Strapi per country. Changing them requires no code change and no deployment.

**Why:** the business team is not technical and must change fields and plans on its own.

## P3. Content is validated before it is used

Content received from Strapi is validated before the application uses it. When content is missing or invalid, the person sees a controlled message, never a broken screen.

**Why:** content is edited by people outside development, so the application must tolerate configuration mistakes.

## P4. No secrets in the browser

No Strapi token with write permissions reaches the browser. Public role permissions are the minimum the wizard needs, and each one is justified.

**Why:** anything sent to the browser is public.

## P5. Fictitious data and simulated money

Only fictitious data is used. There is no real personal data, no real card data and no real payment gateway; price calculation and payment are simulated.

**Why:** the product scope excludes real rating and real payments.

## P6. Accessible and responsive by default

Everything built follows accessibility and responsive design practices. The specific rules live in the design reference.

**Why:** the wizard must work for every person, on any device.

## P7. Work follows the agreed flow

No code is written without an approved spec. The process, its checkpoints and its criteria are defined in [.roclec/flow.toml](flow.toml) and are not repeated here.

**Why:** one source of truth for the process.

## Governance

Amending this constitution requires the owner's agreement (`roclec foundation agree --ref principles`). Any edit makes the agreed reference stale until it is agreed again; the decision history records every version.
