export { getActiveWorkspaceId } from '../features/auth/authStorage'

/** @deprecated Prefer getActiveWorkspaceId from auth for session-scoped data. */
export const DEFAULT_WORKSPACE_ID =
  import.meta.env.VITE_DEFAULT_WORKSPACE_ID ??
  '00000000-0000-0000-0000-000000000001'
