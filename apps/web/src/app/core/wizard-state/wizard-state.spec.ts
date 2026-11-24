import { TestBed } from '@angular/core/testing';
import {
  chileContent,
  colombiaContent,
  MemoryStorage,
  TODAY,
} from '../../../testing/content-fixtures';
import { storageKey, WIZARD_STORAGE, WizardStateStore } from './wizard-state';

describe('WizardStateStore', () => {
  let storage: MemoryStorage;
  let store: WizardStateStore;

  beforeEach(() => {
    storage = new MemoryStorage();
    TestBed.configureTestingModule({ providers: [{ provide: WIZARD_STORAGE, useValue: storage }] });
    store = TestBed.inject(WizardStateStore);
  });

  it('AC-019 AC-026 stores confirmed values only in the session storage of the country', () => {
    store.load('cl', chileContent().steps, TODAY);
    store.confirmStep('cl', 'tus-datos', { rut: '1234567-8', 'fecha-nacimiento': '1990-01-01' });

    expect(JSON.parse(storage.getItem('wizard:cl') ?? '')).toEqual({
      steps: {
        'tus-datos': {
          values: { rut: '1234567-8', 'fecha-nacimiento': '1990-01-01' },
          complete: true,
        },
      },
    });
  });

  it('AC-020 AC-022 restores the stored values after a reload', () => {
    store.load('co', colombiaContent().steps, TODAY);
    store.confirmStep('co', 'tus-datos-y-tu-vehiculo', {
      'tipo-documento': 'cc',
      placa: 'ABC123',
      'uso-particular': true,
    });

    const reloaded = TestBed.runInInjectionContext(() => new WizardStateStore());
    const data = reloaded.load('co', colombiaContent().steps, TODAY);

    expect(data.steps['tus-datos-y-tu-vehiculo']).toEqual({
      values: { 'tipo-documento': 'cc', placa: 'ABC123', 'uso-particular': true },
      complete: true,
    });
  });

  it('AC-023 keeps the data of each country apart', () => {
    store.load('co', colombiaContent().steps, TODAY);
    store.load('cl', chileContent().steps, TODAY);
    store.confirmStep('co', 'tus-datos-y-tu-vehiculo', { placa: 'ABC123' });

    expect(store.data('cl').steps).toEqual({});
    expect(store.data('co').steps['tus-datos-y-tu-vehiculo']?.values).toEqual({ placa: 'ABC123' });
    expect(storageKey('co')).not.toBe(storageKey('cl'));
  });

  it('AC-025 discards malformed stored data', () => {
    storage.setItem('wizard:cl', '{"steps": "roto"');
    expect(store.load('cl', chileContent().steps, TODAY)).toEqual({ steps: {} });

    storage.setItem('wizard:cl', JSON.stringify({ steps: { 'tus-datos': { values: 3 } } }));
    expect(store.load('cl', chileContent().steps, TODAY)).toEqual({ steps: {} });
  });

  it('AC-022 keeps working in memory when the storage refuses writes', () => {
    storage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    store.load('cl', chileContent().steps, TODAY);
    store.confirmStep('cl', 'tus-datos', { rut: '1234567-8' });

    expect(store.data('cl').steps['tus-datos']?.complete).toBe(true);
  });

  it('AC-023 works without a session storage', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: WIZARD_STORAGE, useValue: null }] });
    const memoryOnly = TestBed.inject(WizardStateStore);

    memoryOnly.load('co', colombiaContent().steps, TODAY);
    memoryOnly.confirmStep('co', 'tus-datos-y-tu-vehiculo', { placa: 'ABC123' });

    expect(memoryOnly.data('co').steps['tus-datos-y-tu-vehiculo']?.values).toEqual({
      placa: 'ABC123',
    });
  });
});
