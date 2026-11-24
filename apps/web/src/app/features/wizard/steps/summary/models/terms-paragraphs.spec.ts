import { toParagraphs } from './terms-paragraphs';

describe('toParagraphs', () => {
  it('AC-074 splits on blank lines and keeps line breaks inside a block', () => {
    expect(
      toParagraphs('Primero.\n\nLínea uno\nLínea dos\n \t\nÚltimo con <b>marca</b> y **negrita**.'),
    ).toEqual(['Primero.', 'Línea uno\nLínea dos', 'Último con <b>marca</b> y **negrita**.']);
  });

  it('AC-074 drops empty blocks and edge line breaks and accepts Windows line ends', () => {
    expect(toParagraphs('\n\nUno.\r\n\r\n\n\n\nDos.\n')).toEqual(['Uno.', 'Dos.']);
  });

  it('AC-074 keeps a text without blank lines as one paragraph', () => {
    expect(toParagraphs('Un solo párrafo.')).toEqual(['Un solo párrafo.']);
  });
});
