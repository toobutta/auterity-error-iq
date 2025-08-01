
// .kiro/register.ts

import { onErrorEvent } from './hooks/error-intelligence.hook'

export const modules = [
  {
    name: 'error-intelligence',
    hook: onErrorEvent,
    permissions: './permissions/error_analytics.yaml',
    steering: './steering/error.md',
    enabled: true
  }
]
