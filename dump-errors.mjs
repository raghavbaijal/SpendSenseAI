import { execSync } from 'child_process';
try {
  const result = execSync('npx eslint .', { encoding: 'utf8' });
  console.log(result);
} catch (e) {
  console.log("ESLINT FAILED. Output:");
  console.log(e.stdout);
}
