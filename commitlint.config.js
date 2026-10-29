export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        // Exige la clave Jira en el scope: feat(PLPA-12): descripción
        'scope-jira-key': ({ scope }) => {
          const ok = typeof scope === 'string' && /^PLPA-\d+(,PLPA-\d+)*$/.test(scope);
          return [ok, 'el scope debe ser la clave Jira, ej: feat(PLPA-12): descripción'];
        },
      },
    },
  ],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'refactor', 'test', 'chore']],
    'scope-empty': [2, 'never'],
    'scope-case': [0],
    'scope-jira-key': [2, 'always'],
    'header-max-length': [2, 'always', 100],
  },
};
