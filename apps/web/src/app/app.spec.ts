import { provideRouter } from '@angular/router';
import { render } from '@testing-library/angular';
import { App } from './app';

describe('App', () => {
  it('AC-001 renders the router outlet that shows the page of each address', async () => {
    const { container } = await render(App, { providers: [provideRouter([])] });

    expect(container.querySelector('router-outlet')).not.toBeNull();
  });
});
