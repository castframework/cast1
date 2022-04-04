export function arrayToCSV<T>(array: T[], sep = ';'): string {
  // Y a pas de type au runtime donc yolo on y crois
  if (array.length === 0) {
    return '';
  }

  const keys = Object.keys(array[0]);

  const header = `${keys.join(sep)}\n`;

  return array.reduce(
    (acc, elt) => acc.concat(`${keys.map((key) => elt[key]).join(sep)}\n`),
    header,
  );
}
