import type { Schema, Struct } from '@strapi/strapi';

export interface CountryPlanCopy extends Struct.ComponentSchema {
  collectionName: 'components_country_plan_copies';
  info: {
    description: 'Texts of the plan list step: choice action, chosen mark, recommended badge, price labels, headings and messages.';
    displayName: 'Plan copy';
  };
  attributes: {
    basePriceLabel: Schema.Attribute.String & Schema.Attribute.Required;
    benefitsHeading: Schema.Attribute.String & Schema.Attribute.Required;
    chooseLabel: Schema.Attribute.String & Schema.Attribute.Required;
    choosePlanMessage: Schema.Attribute.String & Schema.Attribute.Required;
    chosenLabel: Schema.Attribute.String & Schema.Attribute.Required;
    coveragesHeading: Schema.Attribute.String & Schema.Attribute.Required;
    finalPriceLabel: Schema.Attribute.String & Schema.Attribute.Required;
    noPlansMessage: Schema.Attribute.Text & Schema.Attribute.Required;
    priceErrorMessage: Schema.Attribute.String & Schema.Attribute.Required;
    quotingLabel: Schema.Attribute.String & Schema.Attribute.Required;
    recommendedLabel: Schema.Attribute.String & Schema.Attribute.Required;
    retryLabel: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface CountryTheme extends Struct.ComponentSchema {
  collectionName: 'components_country_themes';
  info: {
    description: 'Country theme applied as CSS custom properties; the default theme is used when it is missing or invalid.';
    displayName: 'Theme';
  };
  attributes: {
    accentColor: Schema.Attribute.String;
    logo: Schema.Attribute.Media<'images'>;
    primaryColor: Schema.Attribute.String;
  };
}

export interface CountryWizardCopy extends Struct.ComponentSchema {
  collectionName: 'components_country_wizard_copies';
  info: {
    description: "Labels of the wizard's actions, progress indicator ({current} and {total}) and leave dialog.";
    displayName: 'Wizard copy';
  };
  attributes: {
    backLabel: Schema.Attribute.String & Schema.Attribute.Required;
    continueLabel: Schema.Attribute.String & Schema.Attribute.Required;
    leaveConfirmLabel: Schema.Attribute.String & Schema.Attribute.Required;
    leaveMessage: Schema.Attribute.Text & Schema.Attribute.Required;
    leaveStayLabel: Schema.Attribute.String & Schema.Attribute.Required;
    leaveTitle: Schema.Attribute.String & Schema.Attribute.Required;
    progressLabel: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface FormOption extends Struct.ComponentSchema {
  collectionName: 'components_form_options';
  info: {
    description: 'An option of a select field.';
    displayName: 'Option';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    order: Schema.Attribute.Integer & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface FormValidation extends Struct.ComponentSchema {
  collectionName: 'components_form_validations';
  info: {
    description: 'Inclusive limits of a field. minAge applies to dates; yearsBefore and yearsAfter set a year range relative to the current year.';
    displayName: 'Validation';
  };
  attributes: {
    integer: Schema.Attribute.Boolean;
    max: Schema.Attribute.Decimal;
    maxLength: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    min: Schema.Attribute.Decimal;
    minAge: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    minLength: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    pattern: Schema.Attribute.String;
    yearsAfter: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    yearsBefore: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
  };
}

export interface PlanBenefit extends Struct.ComponentSchema {
  collectionName: 'components_plan_benefits';
  info: {
    description: 'A benefit of a plan.';
    displayName: 'Benefit';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PlanCoverage extends Struct.ComponentSchema {
  collectionName: 'components_plan_coverages';
  info: {
    description: 'A coverage of a plan; the highlighted value is optional free text, for example a limit.';
    displayName: 'Coverage';
  };
  attributes: {
    highlight: Schema.Attribute.String;
    name: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'country.plan-copy': CountryPlanCopy;
      'country.theme': CountryTheme;
      'country.wizard-copy': CountryWizardCopy;
      'form.option': FormOption;
      'form.validation': FormValidation;
      'plan.benefit': PlanBenefit;
      'plan.coverage': PlanCoverage;
    }
  }
}
