const { execSync } = require('child_process')
execSync('tsc -d --emitDeclarationOnly --declarationDir dist --skipLibCheck', { stdio: 'inherit' })
