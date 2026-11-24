/**
 * The only copy written in the front end (engineering reference): Spanish fallback shown before
 * any country content exists or when it cannot be used (AC-001, AC-002, AC-003, AC-015 to AC-018).
 */
export const FALLBACK_COPY = {
  pageTitle: 'Cotiza tu seguro de auto',
  countrySelectionHeading: 'Elige tu país para cotizar tu seguro de auto',
  loading: 'Cargando…',
  unavailable: 'No pudimos cargar el formulario. Revisa tu conexión e inténtalo de nuevo.',
  retry: 'Reintentar',
  notAvailableNow: 'El formulario no está disponible en este momento. Inténtalo más tarde.',
  countryNotAvailable: 'Este país no está disponible.',
  chooseCountry: 'Elegir otro país',
  logoPlaceholder: 'SURA',
} as const;
