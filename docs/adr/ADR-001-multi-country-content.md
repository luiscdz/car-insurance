# ADR-001: Multi-country content strategy

## Context and problem

The product sells car insurance in Colombia and Chile with one application and one build ([context](../context.md), principle P1). Each country has its own identity documents, vehicle identifiers, currency, coverages, plans, terms and copy, and the business team changes them from Strapi without a deployment (P2).

Two things must be decided: how Strapi models content per country, and how the Angular application knows which country it is serving. Without a decision, each user story would solve it differently and the three wizard steps would diverge.

## Decision drivers

- One build serves both countries; no country-specific code branches (P1).
- The business team adds, removes and reorders fields and plans per country from Strapi (P2).
- Countries differ in structure, not only in wording: Colombia uses *cédula* and *placa*, Chile uses RUT and *patente*.
- The number and order of wizard steps can differ by country (for example three steps in Colombia and four in Chile).
- Only published and active content for the current country is shown.
- Prices are shown in the country's currency and format.
- Adding a country later should not require code changes.
- The project starts locally with a single command.

## Considered options

### Strapi option A: `Country` collection with related content

A `Country` collection (code, name, currency, formatting locale). Form fields, plans and terms are their own collections, each entry related to one country.

- Advantages: each country has its own fields, order and required flags; plans and fields are edited and published independently; filtering by country, status and order is a simple query; a new country is a new entry.
- Disadvantages: more collections and relations to model and seed.

### Strapi option B: Strapi i18n locales per country

Locales such as `es-CO` and `es-CL`, with each entry localized per locale.

- Advantages: built into Strapi.
- Disadvantages: i18n localizes the same content into languages, while countries have different fields; it forces empty or "not applicable" entries per country and mixes country with language.

### Strapi option C: one document per country

A single `Country` entry holding fields, plans and terms as components or dynamic zones.

- Advantages: one request per country.
- Disadvantages: a large document; publishing one plan change publishes the whole country; filtering active plans and ordering is harder.

### Application option a: country prefix in the URL

Routes start with the country code (`/co/...`, `/cl/...`); the root lets the person choose a country.

- Advantages: one build; shareable links per country; reload keeps the country; easy to test end to end.
- Disadvantages: the code in the URL must be validated.

### Application option b: subdomain or domain per country

The host (`co.…`, `cl.…`) selects the country.

- Advantages: clean URLs per market.
- Disadvantages: requires DNS or proxy setup; hard to reproduce with a single local command.

### Application option c: country selector kept in state

The person picks a country and it is stored in browser storage.

- Advantages: simple.
- Disadvantages: the country is not in the URL; reload and sharing depend on stored state.

### Application option d: one build per country

A build-time variable selects the country.

- Advantages: none relevant.
- Disadvantages: violates P1. Rejected.

## Decision

- **Strapi: option A.** A `Country` collection and form-field, plan and terms collections related to it. It is the only option where countries differ in structure without empty placeholders, and adding a country is a content change.
- **Application: option a.** The country code is the first route segment. It keeps one build, survives reloads and makes each country directly testable.
- **Wizard steps:** the steps are content too. A wizard-step collection related to `Country` defines, per country, each step's order, title and type. Step types are a fixed set implemented in code: form step, plan list, summary and payment. Form fields belong to a form step, so a country can split its data across several form steps. Each country has at least one form step, then exactly one plan list, then exactly one summary and payment step as the last step. A new step type needs code and a new decision.
- **Formatting:** currency and number formats come from the `Country` entry (currency code and locale) and are applied with the browser `Intl` API; no formatting code per country.

## Consequences

- Positive: no country branches in code; a new country is added from Strapi plus its seed data; each wizard step queries content by country code; the business team changes the number and order of form steps per country without code.
- Negative: more content types, relations and seed data to maintain; every content request carries the country; navigation, progress indicator and "keep data when going back" must work for any number of steps.
- Risks: an unknown or unpublished country code in the URL must be handled (the behavior is defined in the specs); relations or step sequences misconfigured in Strapi are caught by content validation (P3).

## Compliance verification

- Application code has no conditions on specific country codes; country data comes only from Strapi.
- Every content request filters by the current country.
- The wizard's steps come from Strapi; no step count or order is hard-coded.
- Seed data includes Colombia and Chile with different step configurations, and tests exercise content from both countries.

## Illustrative model

Not normative: it shows the shape of the decision. The exact content types and fields are defined in the architecture reference and the specs.

### Content types

```
Country                         WizardStep
├─ code        (uid: co, cl)    ├─ country     → Country (many-to-one)
├─ name                         ├─ order
├─ currency    (COP, CLP)       ├─ title
└─ locale      (es-CO, es-CL)   ├─ type        (form | plans | summary)
                                └─ fields      → FormField (only when type = form)

FormField                       Plan                     Terms
├─ step        → WizardStep     ├─ country → Country     ├─ country → Country
├─ name, label                  ├─ name, description     └─ text
├─ type (text | number | select | date | checkbox)
├─ required                     ├─ basePrice
├─ validation (min, max, pattern…)   ├─ coverages, benefits
├─ helpText, errorMessage       ├─ order, recommended, active
├─ order                        └─ draft and publish
└─ options (for select)
```

### Steps per country

| Country | Order | Title | Type | Fields |
| --- | --- | --- | --- | --- |
| co | 1 | Tus datos y tu vehículo | form | Tipo de documento, Número de cédula, Fecha de nacimiento, Placa, Marca, Año |
| co | 2 | Elige tu plan | plans | — |
| co | 3 | Resumen y pago | summary | — |
| cl | 1 | Tus datos | form | RUT, Fecha de nacimiento |
| cl | 2 | Tu vehículo | form | Patente, Marca, Año |
| cl | 3 | Elige tu plan | plans | — |
| cl | 4 | Resumen y pago | summary | — |

### Requests for `/cl/…`

```
GET /api/wizard-steps?filters[country][code][$eq]=cl&sort=order:asc&populate[fields][sort]=order:asc
GET /api/plans?filters[country][code][$eq]=cl&filters[active][$eq]=true&sort=order:asc
GET /api/terms?filters[country][code][$eq]=cl
```

The same requests with `co` return three steps; the application code is the same.

## Relations

- Supersedes: none.
- Related changes: none yet.
