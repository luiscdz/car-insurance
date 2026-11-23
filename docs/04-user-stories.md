# Functional User Stories

These are the three input stories for your flow, one per screen.

- [US-01 – Policyholder and vehicle data form](#us-01--policyholder-and-vehicle-data-form)
- [US-02 – Plan list](#us-02--plan-list)
- [US-03 – Summary and payment](#us-03--summary-and-payment)

---

## US-01 – Policyholder and vehicle data form

### Story

As a person interested in insuring my car, I want to enter my data and my vehicle's data in a simple form, so that I receive insurance options suited to my country and my vehicle.

### Context

Fields change by country. In Colombia the identity document is usually the citizenship ID (*cédula de ciudadanía*) or foreigner ID (*cédula de extranjería*), and the vehicle is identified by its license plate (*placa*). In Chile the document is the RUT and the vehicle is identified by its license plate (*patente*). The business team wants to add, remove or reorder fields from Strapi without asking development for changes.

### Business rules

- Each field is configured in Strapi with: label, type (text, number, select, date, checkbox), required flag, validations, help text, error message, order and country.
- Select fields (for example, make or city) get their options from Strapi.
- The vehicle year cannot be later than next year or more than 20 years old.
- The policyholder must be of legal age.

### Acceptance criteria

```gherkin
Scenario: Form configured by country
  Given fields are configured in Strapi for Colombia and for Chile
  When I open the application in the context of a country
  Then I see only the fields configured for that country, in the defined order

Scenario: Field validation
  Given I am filling out the form
  When a field does not meet its configured validation
  Then I see the configured error message next to the field
  And I cannot move to the next step

Scenario: Configuration change without deployment
  Given the business team adds a new published field in Strapi
  When I reload the application
  Then the new field appears without code changes

Scenario: Keep data when going back
  Given I moved on to step 2
  When I go back to step 1
  Then my data is still filled in
```

---

## US-02 – Plan list

### Story

As a person getting a quote, I want to see the plans available for my country with their price and coverages, so that I can choose the one that best fits my needs.

### Context

Plans, coverages, benefits and prices change by country and are managed by the business team from Strapi. The business team wants to highlight one plan as "recommended" and control the order in which plans appear.

### Business rules

- Each plan is configured in Strapi with: name, short description, base price, currency, coverages, benefits, order, recommended flag, active status and country.
- Only published and active plans for the country are shown.
- The price is shown in the country's currency and format (Colombian pesos or Chilean pesos).
- The final price may be adjusted by a simulated rule based on the step 1 data. The rule is documented.
- Only one plan can be selected.

### Acceptance criteria

```gherkin
Scenario: Plans for the country
  Given I completed the step 1 form
  When I reach the plans step
  Then I see only the active and published plans for my country, in the configured order

Scenario: Recommended plan
  Given a plan is marked as recommended in Strapi
  When I view the plan list
  Then that plan is visually distinguished from the others

Scenario: Plan selection
  Given I am on the plan list
  When I select a plan
  Then it is marked as chosen
  And I can move on to the summary

Scenario: No plans available
  Given there are no active plans for my country
  When I reach the plans step
  Then I see a message explaining that no plans are available
```

---

## US-03 – Summary and payment

### Story

As a person who chose a plan, I want to review a summary of my quote and pay, so that I become insured.

### Context

Before paying, the person must confirm their data and accept the terms and conditions, whose text varies by country and is managed by the business team from Strapi. Payment is simulated for this test.

### Business rules

- The summary shows the policyholder's data, the vehicle's data and the chosen plan with its final price.
- The document number is shown partially masked.
- From the summary the person can go back to edit their data or change the plan.
- The pay button is enabled only after accepting the terms and conditions.
- The payment cannot be submitted twice.
- On successful payment, a confirmation with a simulated quote number is shown.

### Acceptance criteria

```gherkin
Scenario: Complete summary
  Given I chose a plan
  When I reach the summary
  Then I see my data, my vehicle's data and the chosen plan with its final price

Scenario: Terms by country
  Given I am on the summary
  When I view the terms and conditions
  Then the text matches the one configured in Strapi for my country
  And the pay button is disabled until I accept them

Scenario: Successful payment
  Given I accepted the terms
  When I click pay
  Then the button is locked while the payment is processed
  And I see the confirmation with the quote number

Scenario: Rejected payment
  Given the simulated payment fails
  When I click pay
  Then I see a clear error message
  And I can try again without losing my information
```
