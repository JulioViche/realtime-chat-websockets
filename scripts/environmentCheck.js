const fs = require('fs/promises')
const path = require('path')
const { exec } = require('child_process')

const rootDir = path.join(__dirname, '..')
const reportDir = path.join(rootDir, 'docs', 'audit')
const reportPath = path.join(reportDir, 'environment-smoke.md')

function quoteArg(arg) {
  if (/^[\w./:-]+$/.test(arg)) return arg
  return `"${arg.replace(/"/g, '\\"')}"`
}

function runCommand(command, args = []) {
  return new Promise((resolve) => {
    exec([command, ...args.map(quoteArg)].join(' '), { cwd: rootDir }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        code: error?.code || 0,
      })
    })
  })
}

async function exists(relativePath) {
  try {
    await fs.access(path.join(rootDir, relativePath))
    return true
  } catch {
    return false
  }
}

async function read(relativePath) {
  return fs.readFile(path.join(rootDir, relativePath), 'utf8')
}

async function getCoverageSummary() {
  const coveragePath = 'backend/coverage/lcov-report/index.html'
  if (!(await exists(coveragePath))) return null

  const html = await read(coveragePath)
  const matches = [...html.matchAll(/<span class="strong">([\d.]+)%\s*<\/span>\s*<span class="quiet">([^<]+)<\/span>/g)]

  return Object.fromEntries(
    matches.map((match) => [match[2].trim(), `${match[1]}%`])
  )
}

async function checkHttp(url) {
  try {
    const response = await fetch(url)
    const text = await response.text()
    return {
      ok: response.ok,
      detail: `${response.status} ${text.slice(0, 60)}`,
    }
  } catch (error) {
    return {
      ok: false,
      detail: error.message,
    }
  }
}

async function main() {
  const nodeMajor = Number(process.versions.node.split('.')[0])
  const npm = await runCommand('npm', ['--version'])
  const gitIgnoredBackendEnv = await runCommand('git', ['check-ignore', 'backend/.env'])
  const gitIgnoredFrontendEnv = await runCommand('git', ['check-ignore', 'frontend/.env'])
  const coverage = await getCoverageSummary()
  const backendHealth = await checkHttp(process.env.BACKEND_URL || 'http://localhost:3000/')

  const checks = [
    {
      name: 'Node.js 18 o superior',
      ok: nodeMajor >= 18,
      detail: process.version,
    },
    {
      name: 'npm disponible',
      ok: npm.ok,
      detail: npm.stdout || npm.stderr,
    },
    {
      name: 'README en la raíz',
      ok: await exists('README.md'),
      detail: 'README.md',
    },
    {
      name: 'Backend separado',
      ok: await exists('backend/package.json') && await exists('backend/main.js'),
      detail: 'backend/package.json, backend/main.js',
    },
    {
      name: 'Frontend separado',
      ok: await exists('frontend/package.json') && await exists('frontend/src/App.jsx'),
      detail: 'frontend/package.json, frontend/src/App.jsx',
    },
    {
      name: 'Plantilla de entorno backend',
      ok: await exists('backend/.env.example'),
      detail: 'backend/.env.example',
    },
    {
      name: 'Plantilla de entorno frontend',
      ok: await exists('frontend/.env.example'),
      detail: 'frontend/.env.example',
    },
    {
      name: 'backend/.env está ignorado por Git',
      ok: gitIgnoredBackendEnv.ok,
      detail: gitIgnoredBackendEnv.stdout || gitIgnoredBackendEnv.stderr,
    },
    {
      name: 'frontend/.env está ignorado por Git',
      ok: gitIgnoredFrontendEnv.ok,
      detail: gitIgnoredFrontendEnv.stdout || gitIgnoredFrontendEnv.stderr,
    },
    {
      name: 'Dependencias backend instaladas',
      ok: await exists('backend/node_modules') && await exists('backend/package-lock.json'),
      detail: 'backend/node_modules, backend/package-lock.json',
    },
    {
      name: 'Dependencias frontend instaladas',
      ok: await exists('frontend/node_modules') && await exists('frontend/package-lock.json'),
      detail: 'frontend/node_modules, frontend/package-lock.json',
    },
    {
      name: 'Build frontend generado',
      ok: await exists('frontend/dist/index.html'),
      detail: 'frontend/dist/index.html',
    },
    {
      name: 'Reporte HTML de cobertura disponible',
      ok: Boolean(coverage),
      detail: coverage
        ? `Statements ${coverage.Statements}, Lines ${coverage.Lines}`
        : 'Ejecuta cd backend && npm test',
    },
    {
      name: 'Backend responde health check',
      ok: backendHealth.ok,
      detail: backendHealth.detail,
    },
  ]

  const passed = checks.filter((check) => check.ok).length
  const report = `# Prueba de ambiente local

Fecha: ${new Date().toISOString()}

Resultado: **${passed}/${checks.length} verificaciones aprobadas**

| Verificación | Estado | Evidencia |
|---|---|---|
${checks.map((check) => `| ${check.name} | ${check.ok ? 'OK' : 'REVISAR'} | ${String(check.detail).replace(/\|/g, '\\|')} |`).join('\n')}

## Comando

\`\`\`bash
node scripts/environmentCheck.js
\`\`\`
`

  await fs.mkdir(reportDir, { recursive: true })
  await fs.writeFile(reportPath, report)

  console.log(report)
  process.exit(checks.every((check) => check.ok) ? 0 : 1)
}

main()
