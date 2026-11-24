import { randomBytes } from 'node:crypto';

/**
 * Test-only Strapi client for the specs that change content (AC-007, AC-036, AC-039, AC-058). It
 * runs in Node only and uses the admin content manager API; nothing reaches the browser, and the
 * web application keeps reading through the public role (P4). Credentials come from the
 * environment; on a fresh stack without them, the global setup registers a fictitious
 * administrator with random credentials that live only for this run.
 */
export const CMS_URL = process.env['E2E_CMS_URL'] ?? 'http://localhost:1337';

const EMAIL_VARIABLE = 'E2E_STRAPI_ADMIN_EMAIL';
const PASSWORD_VARIABLE = 'E2E_STRAPI_ADMIN_PASSWORD';

const FIELD_MODEL = 'api::form-field.form-field';
const PLAN_MODEL = 'api::plan.plan';

export interface FieldData {
  readonly name: string;
  readonly label: string;
  readonly type: 'text' | 'number' | 'select' | 'date' | 'checkbox';
  readonly required: boolean;
  readonly errorMessage: string;
  readonly order: number;
  readonly helpText?: string;
  readonly placeholder?: string;
  readonly options?: readonly {
    readonly value: string;
    readonly label: string;
    readonly order: number;
  }[];
  readonly validation?: {
    readonly pattern?: string;
    readonly minLength?: number;
    readonly maxLength?: number;
  };
}

export interface PlanData {
  readonly name: string;
  readonly description: string;
  readonly basePrice: number;
  readonly currency: string;
  readonly order: number;
  readonly recommended: boolean;
  readonly active: boolean;
  readonly coverages: readonly { readonly name: string; readonly highlight?: string }[];
  readonly benefits: readonly { readonly text: string }[];
}

/** A published plan as the public API returns it. */
export interface PublishedPlan {
  readonly documentId: string;
  readonly name: string;
  readonly basePrice: number;
  readonly order: number;
  readonly recommended: boolean;
  readonly active: boolean;
}

async function call<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, ...request } = init;
  const response = await fetch(`${CMS_URL}${path}`, {
    ...request,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    throw new Error(`${request.method ?? 'GET'} ${path} failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

interface DataResponse<T> {
  readonly data: T;
}

/**
 * Makes sure the run has administrator credentials: those in the environment, or a fictitious
 * administrator registered with random credentials on a fresh stack, exported through
 * `process.env` so every worker logs in with them.
 */
export async function ensureAdminCredentials(): Promise<void> {
  if (process.env[EMAIL_VARIABLE] && process.env[PASSWORD_VARIABLE]) {
    return;
  }
  const init = await call<DataResponse<{ hasAdmin: boolean }>>('/admin/init');
  if (init.data.hasAdmin) {
    return;
  }
  const email = `e2e-${randomBytes(6).toString('hex')}@example.test`;
  const password = `E2e-${randomBytes(12).toString('hex')}`;
  await call('/admin/register-admin', {
    method: 'POST',
    body: JSON.stringify({ firstname: 'Prueba', lastname: 'E2E', email, password }),
  });
  process.env[EMAIL_VARIABLE] = email;
  process.env[PASSWORD_VARIABLE] = password;
}

export class StrapiAdmin {
  private constructor(private readonly token: string) {}

  /** Logs in with the credentials of the run (see {@link ensureAdminCredentials}). */
  static async connect(): Promise<StrapiAdmin> {
    await ensureAdminCredentials();
    const email = process.env[EMAIL_VARIABLE];
    const password = process.env[PASSWORD_VARIABLE];
    if (!email || !password) {
      throw new Error(
        `Strapi already has an administrator: set ${EMAIL_VARIABLE} and ${PASSWORD_VARIABLE}, ` +
          'or start a fresh stack with `docker compose down -v`.',
      );
    }
    const login = await call<DataResponse<{ token: string }>>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return new StrapiAdmin(login.data.token);
  }

  /** Document id of a country's step, read through the public content API. */
  static async stepId(code: string, slug: string): Promise<string> {
    const query = `filters[country][code][$eq]=${code}&filters[slug][$eq]=${slug}&fields[0]=slug`;
    const steps = await call<DataResponse<{ documentId: string }[]>>(`/api/wizard-steps?${query}`);
    const step = steps.data[0];
    if (!step) {
      throw new Error(`Step ${code}/${slug} not found`);
    }
    return step.documentId;
  }

  /** Document id of a country, read through the public content API. */
  static async countryId(code: string): Promise<string> {
    const query = `filters[code][$eq]=${code}&fields[0]=code`;
    const countries = await call<DataResponse<{ documentId: string }[]>>(`/api/countries?${query}`);
    const country = countries.data[0];
    if (!country) {
      throw new Error(`Country ${code} not found`);
    }
    return country.documentId;
  }

  /** Every published plan of a country, active or not, read through the public content API. */
  static async publishedPlans(code: string): Promise<PublishedPlan[]> {
    const query =
      `filters[country][code][$eq]=${code}&sort[0]=order:asc&sort[1]=createdAt:asc` +
      '&fields[0]=name&fields[1]=basePrice&fields[2]=order&fields[3]=recommended&fields[4]=active';
    const plans = await call<DataResponse<PublishedPlan[]>>(`/api/plans?${query}`);
    return plans.data;
  }

  /** Creates a field in a step, published or only as a draft; returns its document id. */
  async createField(stepId: string, field: FieldData, publish: boolean): Promise<string> {
    return this.create(
      FIELD_MODEL,
      { ...field, step: { connect: [{ documentId: stepId }] } },
      publish,
    );
  }

  /** Changes and publishes a field. */
  async publishField(id: string, changes: Partial<FieldData>): Promise<void> {
    await this.publish(FIELD_MODEL, id, changes);
  }

  async unpublishField(id: string): Promise<void> {
    await this.unpublish(FIELD_MODEL, id);
  }

  async deleteField(id: string): Promise<void> {
    await this.remove(FIELD_MODEL, id);
  }

  /** Creates a plan of a country, published or only as a draft; returns its document id. */
  async createPlan(countryId: string, plan: PlanData, publish: boolean): Promise<string> {
    return this.create(
      PLAN_MODEL,
      { ...plan, country: { connect: [{ documentId: countryId }] } },
      publish,
    );
  }

  /** Changes and publishes a plan. */
  async publishPlan(id: string, changes: Partial<PlanData>): Promise<void> {
    await this.publish(PLAN_MODEL, id, changes);
  }

  async deletePlan(id: string): Promise<void> {
    await this.remove(PLAN_MODEL, id);
  }

  private async create(model: string, data: object, publish: boolean): Promise<string> {
    const path = `/content-manager/collection-types/${model}${publish ? '/actions/publish' : ''}`;
    const created = await call<DataResponse<{ documentId: string }>>(path, {
      method: 'POST',
      token: this.token,
      body: JSON.stringify(data),
    });
    return created.data.documentId;
  }

  private async publish(model: string, id: string, changes: object): Promise<void> {
    await call(`/content-manager/collection-types/${model}/${id}/actions/publish`, {
      method: 'POST',
      token: this.token,
      body: JSON.stringify(changes),
    });
  }

  private async unpublish(model: string, id: string): Promise<void> {
    await call(`/content-manager/collection-types/${model}/${id}/actions/unpublish`, {
      method: 'POST',
      token: this.token,
      body: JSON.stringify({}),
    });
  }

  private async remove(model: string, id: string): Promise<void> {
    await call(`/content-manager/collection-types/${model}/${id}`, {
      method: 'DELETE',
      token: this.token,
    });
  }
}
