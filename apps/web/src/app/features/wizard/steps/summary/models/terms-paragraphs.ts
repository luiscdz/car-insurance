/** A blank line, possibly with spaces or tabs, separates two paragraphs (AC-074). */
const BLANK_LINE = /\n[ \t]*\n/;

/**
 * Splits plain terms text into paragraphs exactly as configured (AC-074): blocks separated by a
 * blank line become paragraphs, line breaks inside a block are kept, and empty blocks are dropped.
 * The text is never interpreted as markup.
 */
export function toParagraphs(text: string): string[] {
  return text
    .replaceAll('\r\n', '\n')
    .split(BLANK_LINE)
    .map((block) => block.replace(/^\n+|\n+$/g, ''))
    .filter((block) => block.trim() !== '');
}
