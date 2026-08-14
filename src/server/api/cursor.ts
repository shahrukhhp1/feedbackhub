export function encodeTimestampIdCursor(timestamp: Date | number, id: string): string {
  const ms = timestamp instanceof Date ? timestamp.getTime() : timestamp;
  return `${ms}:${id}`;
}

export function decodeTimestampIdCursor(cursor: string): { timestamp: Date; id: string } {
  const separatorIndex = cursor.indexOf(":");
  if (separatorIndex === -1) {
    throw new Error("Invalid timestamp cursor: missing separator");
  }

  const timestamp = Number(cursor.slice(0, separatorIndex));
  if (!Number.isFinite(timestamp)) {
    throw new Error("Invalid timestamp cursor: timestamp is not a number");
  }

  const id = cursor.slice(separatorIndex + 1);
  if (!id) {
    throw new Error("Invalid timestamp cursor: missing id");
  }

  return { timestamp: new Date(timestamp), id };
}

export function encodeSequenceCursor(sequence: number): string {
  return String(sequence);
}

export function decodeSequenceCursor(cursor: string): number {
  const value = Number(cursor);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Invalid sequence cursor");
  }
  return value;
}
