/**
 * Conventional Commits enforcement for delfos-api. Runs in CI against the
 * commits of each pull request. CommonJS (.cjs) so the config loads
 * regardless of the package "type".
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
