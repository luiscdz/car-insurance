# Product context

## Purpose

A digital insurer (insurtech) that sells in Colombia and Chile launches a car insurance product. A single front-end application sells it in both countries.

## Countries

- Colombia and Chile.
- Each country has its own regulations, identity documents, currency, coverages and copy, so the content the application consumes changes by country.

## People

- **Person insuring their car:** enters their data and their vehicle's data, chooses a plan and pays.
- **Business team (non-technical):** changes the form fields and the offered plans from Strapi, without requesting a deployment.

## Functional scope

The application is a wizard with at least three steps. Any additional step needs a justified decision.

| Step | Screen | What it does |
| --- | --- | --- |
| 1 | Data form | Captures policyholder and vehicle data. Fields, types, validations, copy and order are configured in Strapi per country. |
| 2 | Plan list | Shows the plans available for the country with price, coverages and benefits, configured in Strapi. The person picks one. |
| 3 | Summary and payment | Shows the entered data and the chosen plan, and offers the option to pay. |

## Scope rules

- The same application and the same build serve Colombia and Chile.
- A change to a form field or a plan in Strapi is reflected in the application without code changes.
- Price calculation is simulated; there is no real rating engine.
- Payment is simulated: a button leads to a confirmation screen or a mock gateway. No real payment gateway and no real card data.
- Only fictitious data is used.
- Quote data is persisted in the front end; no database is required.

## User stories

Each step is detailed by one user story:

- US-01 Policyholder and vehicle data form
- US-02 Plan list
- US-03 Summary and payment
