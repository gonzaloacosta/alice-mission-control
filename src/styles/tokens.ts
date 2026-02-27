export const STATUS_COLOR = {
  healthy: 'var(--green)',
  unhealthy: 'var(--red)',
  unknown: 'var(--yellow)',
  info: 'var(--blue)',
  highlight: 'var(--cyan)',
  crypto: 'var(--purple)',
} as const;

export type StatusTone = keyof typeof STATUS_COLOR;
