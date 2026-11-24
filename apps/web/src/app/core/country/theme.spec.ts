import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { rawChile, rawColombia } from '../../../testing/content-fixtures';
import { DEFAULT_THEME, resolveTheme, ThemeService } from './theme';

describe('country theme', () => {
  it('AC-003 uses the valid theme of Colombia, with the placeholder when it has no logo', () => {
    expect(resolveTheme(rawColombia()['theme'], 'http://cms.test', 'Colombia')).toEqual({
      primaryColor: '#2D6DF6',
      accentColor: '#00AEC7',
      logo: null,
    });
  });

  it('AC-003 uses the valid theme of Chile with its logo from Strapi', () => {
    expect(resolveTheme(rawChile()['theme'], 'http://cms.test', 'Chile')).toEqual({
      primaryColor: '#123456',
      accentColor: '#654321',
      logo: { url: 'http://cms.test/uploads/logo-cl.png', alt: 'Logo de prueba' },
    });
    const absolute = resolveTheme(
      { primaryColor: '#123456', accentColor: '#654321', logo: { url: 'https://cdn.test/l.png' } },
      'http://cms.test',
      'Chile',
    );
    expect(absolute.logo).toEqual({ url: 'https://cdn.test/l.png', alt: 'Chile' });
  });

  it.each([
    ['missing', undefined],
    ['null', null],
    ['with a malformed primary color', { primaryColor: 'azul', accentColor: '#00AEC7' }],
    ['with a malformed accent color', { primaryColor: '#2D6DF6', accentColor: '#00AEC' }],
    [
      'with a logo without address',
      { primaryColor: '#2D6DF6', accentColor: '#00AEC7', logo: { url: '' } },
    ],
  ])('AC-003 a theme %s falls back to the default theme', (_, theme) => {
    expect(resolveTheme(theme, 'http://cms.test', 'Colombia')).toEqual(DEFAULT_THEME);
  });

  it('AC-003 applies the country colors as CSS custom properties and restores the default', () => {
    const root = TestBed.inject(DOCUMENT).documentElement;
    const service = TestBed.inject(ThemeService);

    service.apply(resolveTheme(rawChile()['theme'], 'http://cms.test', 'Chile'));
    expect(root.style.getPropertyValue('--primary')).toBe('#123456');
    expect(root.style.getPropertyValue('--accent')).toBe('#654321');

    service.apply(DEFAULT_THEME);
    expect(root.style.getPropertyValue('--primary')).toBe('');
    expect(root.style.getPropertyValue('--accent')).toBe('');
  });
});
