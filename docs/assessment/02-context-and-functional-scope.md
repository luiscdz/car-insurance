# Business Context and Functional Scope

## Business context

An insurtech that sells digital insurance in **Colombia** and **Chile** wants to launch a **car insurance** product with a single front-end application that can sell in both countries.

The business team, which is not technical, must be able to change the form fields and the offered plans from Strapi **without requesting a deployment**. Each country has its own regulations, identity documents, currency, coverages and copy, so the content the app consumes changes by country.

Part of the challenge is for you to **propose and justify the strategy for differentiating content by country** in Strapi and in Angular.

## Functional scope

The application is a **wizard with at least 3 steps**. You may add more if you justify it.

| Step | Screen | What it must do |
|------|--------|-----------------|
| 1 | Data form | Captures policyholder and vehicle data. Fields, types, validations, copy and order are configured in Strapi per country. |
| 2 | Plan list | Shows the plans available for the country with price, coverages and benefits, configured in Strapi. The user picks one. |
| 3 | Summary and payment | Shows the entered data and the chosen plan, and offers the option to pay. |

## Scope rules

- The same application and the same build serve Colombia and Chile.
- Changing a form field or a plan in Strapi must be reflected in the app without changing code.
- Price calculation may be simulated: a real rating engine is not expected.
- Payment is simulated: a button that leads to a confirmation screen or a mock gateway. Do not integrate real payment gateways or use real card data.
- Use fictitious data only.
- Use a front-end strategy to persist the data; a database is not required.

The functional detail of each screen is in the user stories → see [04-user-stories.md](04-user-stories.md).
