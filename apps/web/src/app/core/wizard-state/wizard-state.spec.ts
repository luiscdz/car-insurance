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
    store.load('cl', chileContent(), TODAY);
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
    store.load('co', colombiaContent(), TODAY);
    store.confirmStep('co', 'tus-datos-y-tu-vehiculo', {
      'tipo-documento': 'cc',
      'numero-documento': '1234567890',
      placa: 'ABC123',
      'uso-particular': true,
    });

    const reloaded = TestBed.runInInjectionContext(() => new WizardStateStore());
    const data = reloaded.load('co', colombiaContent(), TODAY);

    expect(data.steps['tus-datos-y-tu-vehiculo']).toEqual({
      values: {
        'tipo-documento': 'cc',
        'numero-documento': '1234567890',
        placa: 'ABC123',
        'uso-particular': true,
      },
      complete: true,
    });
  });

  it('AC-023 keeps the data of each country apart', () => {
    store.load('co', colombiaContent(), TODAY);
    store.load('cl', chileContent(), TODAY);
    store.confirmStep('co', 'tus-datos-y-tu-vehiculo', { placa: 'ABC123' });

    expect(store.data('cl').steps).toEqual({});
    expect(store.data('co').steps['tus-datos-y-tu-vehiculo']?.values).toEqual({ placa: 'ABC123' });
    expect(storageKey('co')).not.toBe(storageKey('cl'));
  });

  it('AC-025 discards malformed stored data', () => {
    storage.setItem('wizard:cl', '{"steps": "roto"');
    expect(store.load('cl', chileContent(), TODAY)).toEqual({ steps: {} });

    storage.setItem('wizard:cl', JSON.stringify({ steps: { 'tus-datos': { values: 3 } } }));
    expect(store.load('cl', chileContent(), TODAY)).toEqual({ steps: {} });
  });

  it('AC-022 keeps working in memory when the storage refuses writes', () => {
    storage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    store.load('cl', chileContent(), TODAY);
    store.confirmStep('cl', 'tus-datos', { rut: '1234567-8' });

    expect(store.data('cl').steps['tus-datos']?.complete).toBe(true);
  });

  it('AC-023 works without a session storage', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: WIZARD_STORAGE, useValue: null }] });
    const memoryOnly = TestBed.inject(WizardStateStore);

    memoryOnly.load('co', colombiaContent(), TODAY);
    memoryOnly.confirmStep('co', 'tus-datos-y-tu-vehiculo', { placa: 'ABC123' });

    expect(memoryOnly.data('co').steps['tus-datos-y-tu-vehiculo']?.values).toEqual({
      placa: 'ABC123',
    });
  });

  const chileValues = { rut: '1234567-8', 'fecha-nacimiento': '1990-01-01' };

  it('AC-048 stores the chosen plan at once, without a final price, and replaces the previous one', () => {
    store.load('cl', chileContent(), TODAY);

    store.choosePlan('cl', 'cl-full');
    expect(JSON.parse(storage.getItem('wizard:cl') ?? '').plan).toEqual({
      id: 'cl-full',
      finalPrice: null,
    });

    store.storeFinalPrice('cl', 'cl-full', 624000);
    store.choosePlan('cl', 'cl-esencial');
    expect(store.data('cl').plan).toEqual({ id: 'cl-esencial', finalPrice: null });
  });

  it('AC-049 choosing the plan already chosen changes nothing and late prices of other plans are ignored', () => {
    store.load('co', colombiaContent(), TODAY);
    store.choosePlan('co', 'co-clasico');
    store.storeFinalPrice('co', 'co-clasico', 2312500);
    const before = store.data('co');

    store.choosePlan('co', 'co-clasico');
    store.storeFinalPrice('co', 'co-basico', 1500000);

    expect(store.data('co')).toBe(before);
  });

  it('AC-053 the chosen plan and its final price survive a reload, per country', () => {
    store.load('cl', chileContent(), TODAY);
    store.load('co', colombiaContent(), TODAY);
    store.confirmStep('cl', 'tus-datos', chileValues);
    store.choosePlan('cl', 'cl-full');
    store.storeFinalPrice('cl', 'cl-full', 624000);

    const reloaded = TestBed.runInInjectionContext(() => new WizardStateStore());

    expect(reloaded.load('cl', chileContent(), TODAY).plan).toEqual({
      id: 'cl-full',
      finalPrice: 624000,
    });
    expect(reloaded.load('co', colombiaContent(), TODAY).plan).toBeUndefined();
  });

  it('AC-053 AC-056 discards the stored final price while a new one is obtained', () => {
    store.load('cl', chileContent(), TODAY);
    store.discardFinalPrice('cl');
    expect(store.data('cl').plan).toBeUndefined();

    store.choosePlan('cl', 'cl-full');
    store.storeFinalPrice('cl', 'cl-full', 624000);
    store.discardFinalPrice('cl');

    expect(store.data('cl').plan).toEqual({ id: 'cl-full', finalPrice: null });
  });

  it('AC-054 confirming changed values keeps the plan and discards its final price', () => {
    store.load('cl', chileContent(), TODAY);
    store.confirmStep('cl', 'tus-datos', chileValues);
    store.choosePlan('cl', 'cl-full');
    store.storeFinalPrice('cl', 'cl-full', 624000);

    store.confirmStep('cl', 'tus-datos', { ...chileValues, 'fecha-nacimiento': '2004-01-01' });

    expect(store.data('cl').plan).toEqual({ id: 'cl-full', finalPrice: null });
    expect(store.data('cl').steps['tus-datos']?.values['fecha-nacimiento']).toBe('2004-01-01');
  });

  it('AC-054 confirming unchanged values keeps the final price', () => {
    store.load('cl', chileContent(), TODAY);
    store.confirmStep('cl', 'tus-datos', chileValues);
    store.choosePlan('cl', 'cl-full');
    store.storeFinalPrice('cl', 'cl-full', 624000);

    store.confirmStep('cl', 'tus-datos', { ...chileValues });

    expect(store.data('cl').plan).toEqual({ id: 'cl-full', finalPrice: 624000 });
  });

  describe('confirmation', () => {
    const confirmation = {
      planId: 'cl-full',
      planName: 'Plan Full',
      amount: 624000,
      quoteNumber: 'CL-20261123-A9F03Z',
    };

    function paid(): void {
      store.load('cl', chileContent(), TODAY);
      store.confirmStep('cl', 'tus-datos', chileValues);
      store.choosePlan('cl', 'cl-full');
      store.storeFinalPrice('cl', 'cl-full', 624000);
      store.storeConfirmation('cl', confirmation);
    }

    it('AC-085 stores the confirmation in the country wizard data and keeps it after a reload', () => {
      paid();

      expect(store.data('cl').confirmation).toEqual(confirmation);
      expect(JSON.parse(storage.getItem('wizard:cl') ?? '').confirmation).toEqual(confirmation);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [{ provide: WIZARD_STORAGE, useValue: storage }],
      });
      const reloaded = TestBed.inject(WizardStateStore);
      reloaded.load('cl', chileContent(), TODAY);
      expect(reloaded.data('cl').confirmation).toEqual(confirmation);
      reloaded.load('co', colombiaContent(), TODAY);
      expect(reloaded.data('co').confirmation).toBeUndefined();
    });

    it('AC-085 does not store a confirmation for a plan that is no longer chosen', () => {
      store.load('cl', chileContent(), TODAY);
      store.choosePlan('cl', 'cl-esencial');

      store.storeConfirmation('cl', confirmation);

      expect(store.data('cl').confirmation).toBeUndefined();
    });

    it('AC-086 confirming changed values discards the confirmation', () => {
      paid();

      store.confirmStep('cl', 'tus-datos', { ...chileValues, 'fecha-nacimiento': '2004-01-01' });

      expect(store.data('cl').confirmation).toBeUndefined();
      expect(store.data('cl').plan).toEqual({ id: 'cl-full', finalPrice: null });
    });

    it('AC-086 choosing another plan discards the confirmation', () => {
      paid();

      store.choosePlan('cl', 'cl-esencial');

      expect(store.data('cl').confirmation).toBeUndefined();
    });

    it('AC-086 unchanged values, the paid plan again and a new final price keep the confirmation', () => {
      paid();

      store.confirmStep('cl', 'tus-datos', { ...chileValues });
      store.choosePlan('cl', 'cl-full');
      store.discardFinalPrice('cl');
      store.storeFinalPrice('cl', 'cl-full', 624000);

      expect(store.data('cl').confirmation).toEqual(confirmation);
    });

    it('AC-087 a new quote discards only the data of that country', () => {
      paid();
      store.load('co', colombiaContent(), TODAY);
      store.confirmStep('co', 'tus-datos-y-tu-vehiculo', { placa: 'ABC123' });

      store.startNewQuote('cl');

      expect(store.data('cl')).toEqual({ steps: {} });
      expect(JSON.parse(storage.getItem('wizard:cl') ?? '')).toEqual({ steps: {} });
      expect(store.data('co').steps['tus-datos-y-tu-vehiculo']?.values).toEqual({
        placa: 'ABC123',
      });
    });
  });
});
