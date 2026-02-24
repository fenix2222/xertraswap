// Emit .d.ts files — tsc exits non-zero due to pre-existing type errors,
// but still produces the declarations we need. Ignore the exit code.
const { execSync } = require('child_process')
try {
  execSync('tsc -d --emitDeclarationOnly --declarationDir dist --skipLibCheck', { stdio: 'inherit' })
} catch (_) {
  // tsc emits declarations even on type errors — the exit code doesn't matter
}
