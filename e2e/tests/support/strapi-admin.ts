import { randomBytes } from 'node:crypto';

/**
 * Test-only Strapi client for AC-007. It runs in Node only and uses the admin content manager
 * API; nothing reaches the browser, and the web application keeps reading through the public
 * role (P4). Credentials come from the environment; on a fresh stack without them, a fictitious
 * administrator is registered with random credentials that live only for this run.
 */
export const CMS_URL = process.env['E2E_CMS_URL'] ?? 'http://localhost:1337';

const FIELD_MODEL = 'api::form-field.form-field';

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

export class StrapiAdmin {
  private constructor(private readonly token: string) {}

  /** Logs in with E2E_STRAPI_ADMIN_EMAIL/PASSWORD or registers a first administrator. */
  static async connect(): Promise<StrapiAdmin> {
    const email = process.env['E2E_STRAPI_ADMIN_EMAIL'];
    const password = process.env['E2E_STRAPI_ADMIN_PASSWORD'];
    if (email && password) {
      const login = await call<DataResponse<{ token: string }>>('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return new StrapiAdmin(login.data.token);
    }
    const init = await call<DataResponse<{ hasAdmin: boolean }>>('/admin/init');
    if (init.data.hasAdmin) {
      throw new Error(
        'Strapi already has an administrator: set E2E_STRAPI_ADMIN_EMAIL and E2E_STRAPI_ADMIN_PASSWORD, ' +
          'or start a fresh stack with `docker compose down -v`.',
      );
    }
    const suffix = randomBytes(6).toString('hex');
    const registered = await call<DataResponse<{ token: string }>>('/admin/register-admin', {
      method: 'POST',
      body: JSON.stringify({
        firstname: 'Prueba',
        lastname: 'E2E',
        email: `e2e-${suffix}@example.test`,
        password: `E2e-${randomBytes(12).toString('hex')}`,
      }),
    });
    return new StrapiAdmin(registered.data.token);
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

  /** Creates a field in a step, published or only as a draft; returns its document id. */
  async createField(stepId: string, field: FieldData, publish: boolean): Promise<string> {
    const path = `/content-manager/collection-types/${FIELD_MODEL}${publish ? '/actions/publish' : ''}`;
    const created = await call<DataResponse<{ documentId: string }>>(path, {
      method: 'POST',
      token: this.token,
      body: JSON.stringify({ ...field, step: { connect: [{ documentId: stepId }] } }),
    });
    return created.data.documentId;
  }

  /** Changes and publishes a field. */
  async publishField(id: string, changes: Partial<FieldData>): Promise<void> {
    await call(`/content-manager/collection-types/${FIELD_MODEL}/${id}/actions/publish`, {
      method: 'POST',
      token: this.token,
      body: JSON.stringify(changes),
    });
  }

  async unpublishField(id: string): Promise<void> {
    await call(`/content-manager/collection-types/${FIELD_MODEL}/${id}/actions/unpublish`, {
      method: 'POST',
      token: this.token,
      body: JSON.stringify({}),
    });
  }

  async deleteField(id: string): Promise<void> {
    await call(`/content-manager/collection-types/${FIELD_MODEL}/${id}`, {
      method: 'DELETE',
      token: this.token,
    });
  }
}
