/**
 * Profile-scoped localStorage helper.
 * All fitness data is keyed under the active profile name so multiple
 * users on the same device have fully isolated cycles, sets, and XP.
 *
 * pk('cycles') → 'gtl-jordan-cycles'  (when profile = 'jordan')
 */
export function pk(key) {
  try {
    const profile = localStorage.getItem('gtl-active-profile') || 'default'
    return `gtl-${profile}-${key}`
  } catch (_) {
    return `gtl-default-${key}`
  }
}
