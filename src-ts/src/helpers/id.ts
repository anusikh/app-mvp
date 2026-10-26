let sequence = 0;

export const createId = (prefix: string) => {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${sequence.toString(36)}`;
};
