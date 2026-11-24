import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { envelope, FakeContentReader } from '../../../testing/content-fixtures';
import { routes } from '../../app.routes';
import { CONTENT_READER } from '../../core/content/content-reader';
import { FALLBACK_COPY } from '../../core/content/fallback-copy';
import { CountrySelection } from './country-selection';

async function setup(reader = new FakeContentReader()) {
  const result = await render(CountrySelection, {
    providers: [provideRouter([]), { provide: CONTENT_READER, useValue: reader }],
  });
  return { ...result, reader };
}

describe('CountrySelection', () => {
  it('AC-001 shows the fallback heading and one link per published country by its name', async () => {
    await setup();

    expect(
      await screen.findByRole('heading', { level: 1, name: FALLBACK_COPY.countrySelectionHeading }),
    ).toBeTruthy();
    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent?.trim())).toEqual(['Chile', 'Colombia']);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/cl', '/co']);
  });

  it('AC-001 the root page title is the fallback title', () => {
    expect(routes.find((route) => route.path === '')?.title).toBe('Cotiza tu seguro de auto');
  });

  it('AC-001 offers only the countries in the published response', async () => {
    const reader = new FakeContentReader();
    reader.countries = envelope([{ code: 'co', name: 'Colombia' }]);
    await setup(reader);

    expect((await screen.findAllByRole('link')).map((link) => link.textContent?.trim())).toEqual([
      'Colombia',
    ]);
  });

  it('AC-015 shows a loader with an announced label and no list while loading', async () => {
    const reader = new FakeContentReader();
    reader.hold = true;
    await setup(reader);

    expect(await screen.findByTestId('loader')).toBeTruthy();
    await vi.waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe(FALLBACK_COPY.loading),
    );
    expect(screen.queryByRole('link')).toBeNull();
    reader.hold = false;
  });

  it('AC-016 shows the unavailable message with retry, which loads the list again', async () => {
    const reader = new FakeContentReader();
    reader.fail = true;
    await setup(reader);

    expect((await screen.findByRole('alert')).textContent).toContain(FALLBACK_COPY.unavailable);
    reader.fail = false;
    screen.getByRole('button', { name: FALLBACK_COPY.retry }).click();

    expect(await screen.findByRole('link', { name: 'Chile' })).toBeTruthy();
    expect(reader.requests).toEqual(['countries', 'countries']);
  });

  it('AC-017 shows the not available message when the list is invalid', async () => {
    const reader = new FakeContentReader();
    reader.countries = envelope([{ code: 'Chile' }]);
    await setup(reader);

    expect((await screen.findByRole('alert')).textContent).toContain(FALLBACK_COPY.notAvailableNow);
    expect(screen.queryByRole('heading')).toBeNull();
  });
});
