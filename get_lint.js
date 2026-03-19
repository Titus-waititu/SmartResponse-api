const { execSync } = require('child_process');
try {
  const result = execSync('npx eslint "src/**/*.ts"', { encoding: 'utf8' });
  console.log('NO LINT ERRORS');
} catch (e) {
  console.log('LINT ERRORS:');
  console.log(e.stdout);
  console.log(e.stderr);
}
