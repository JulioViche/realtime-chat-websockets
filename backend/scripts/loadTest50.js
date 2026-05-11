const fs = require('fs/promises')
const path = require('path')
const { io } = require('socket.io-client')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const API_URL = process.env.LOAD_TEST_API_URL || 'http://localhost:3000'
const VIRTUAL_USERS = Number(process.env.LOAD_TEST_USERS || 50)
const MESSAGES_PER_USER = Number(process.env.LOAD_TEST_MESSAGES_PER_USER || 1)
const TIMEOUT_MS = Number(process.env.LOAD_TEST_TIMEOUT_MS || 20000)
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-')
const REPORT_DIR = path.join(__dirname, '..', '..', 'docs', 'audit')
const JSON_REPORT = path.join(REPORT_DIR, 'load-test-50-users.json')
const MD_REPORT = path.join(REPORT_DIR, 'load-test-50-users.md')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const percentile = (values, p) => {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))]
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const data = await response.json().catch(() => ({}))
  return { response, data }
}

async function createTempRoom() {
  if (process.env.LOAD_TEST_PIN) {
    return {
      pin: process.env.LOAD_TEST_PIN,
      roomId: null,
      token: null,
      createdByScript: false,
    }
  }

  const adminUser = process.env.ADMIN_USER
  const adminPass = process.env.ADMIN_PASS

  if (!adminUser || !adminPass) {
    throw new Error('Define ADMIN_USER y ADMIN_PASS en backend/.env o usa LOAD_TEST_PIN.')
  }

  const login = await fetchJson(`${API_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ username: adminUser, password: adminPass }),
  })

  if (!login.response.ok) {
    throw new Error(`No se pudo iniciar sesión admin: ${login.data.error || login.response.status}`)
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const pin = String(Math.floor(100000 + Math.random() * 900000))
    const create = await fetchJson(`${API_URL}/api/rooms/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${login.data.token}` },
      body: JSON.stringify({
        name: `Load Test ${RUN_ID}`,
        pin,
        type: 'TEXT',
        pinSecurityMode: 'NON_RECOVERABLE',
      }),
    })

    if (create.response.ok) {
      return {
        pin,
        roomId: create.data.room._id,
        token: login.data.token,
        createdByScript: true,
      }
    }

    if (create.response.status !== 409) {
      throw new Error(`No se pudo crear sala temporal: ${create.data.error || create.response.status}`)
    }
  }

  throw new Error('No se pudo crear sala temporal con PIN único.')
}

function connectAndJoin(index, pin) {
  const username = `LoadUser${String(index + 1).padStart(2, '0')}`
  const deviceId = `load-device-${RUN_ID}-${index + 1}`
  const startedAt = Date.now()

  return new Promise((resolve) => {
    const socket = io(API_URL, {
      auth: { deviceId },
      transports: ['websocket'],
      reconnection: false,
      timeout: 10000,
    })

    const timer = setTimeout(() => {
      socket.disconnect()
      resolve({
        ok: false,
        username,
        error: 'Timeout conectando o entrando a la sala',
        latencyMs: Date.now() - startedAt,
        socket,
      })
    }, TIMEOUT_MS)

    socket.on('connect', () => {
      socket.emit('joinRoom', { pin, user: username }, (response = {}) => {
        clearTimeout(timer)

        if (response.success) {
          resolve({
            ok: true,
            username,
            roomId: response.roomId,
            latencyMs: Date.now() - startedAt,
            socket,
          })
          return
        }

        socket.disconnect()
        resolve({
          ok: false,
          username,
          error: response.error || 'joinRoom falló',
          latencyMs: Date.now() - startedAt,
          socket,
        })
      })
    })

    socket.on('connect_error', (error) => {
      clearTimeout(timer)
      socket.disconnect()
      resolve({
        ok: false,
        username,
        error: error.message,
        latencyMs: Date.now() - startedAt,
        socket,
      })
    })
  })
}

async function waitForBroadcasts(expectedMessages, receivedCounter) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < TIMEOUT_MS) {
    if (receivedCounter.count >= expectedMessages) return true
    await sleep(100)
  }

  return false
}

async function cleanupRoom(room) {
  if (!room.createdByScript || !room.roomId || !room.token) return null

  const deleted = await fetchJson(`${API_URL}/api/rooms/${room.roomId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${room.token}` },
  })

  return {
    ok: deleted.response.ok,
    status: deleted.response.status,
    body: deleted.data,
  }
}

async function writeReport(report) {
  await fs.mkdir(REPORT_DIR, { recursive: true })
  await fs.writeFile(JSON_REPORT, JSON.stringify(report, null, 2))

  const status = report.passed ? 'APROBADA' : 'NO APROBADA'
  const markdown = `# Prueba de carga WebSocket - 50 usuarios

Estado: **${status}**

| Métrica | Valor |
|---|---:|
| Fecha | ${report.startedAt} |
| Herramienta | Node.js + socket.io-client |
| URL probada | ${report.apiUrl} |
| Usuarios virtuales | ${report.virtualUsers} |
| Usuarios conectados | ${report.joinedUsers} |
| Mensajes enviados | ${report.sentMessages} |
| Broadcasts esperados | ${report.expectedBroadcasts} |
| Broadcasts recibidos | ${report.receivedBroadcasts} |
| Latencia p95 de ingreso | ${report.joinLatency.p95Ms} ms |
| Latencia máxima de ingreso | ${report.joinLatency.maxMs} ms |
| Latencia p95 de mensajes | ${report.messageLatency.p95Ms} ms |
| Latencia máxima de mensajes | ${report.messageLatency.maxMs} ms |
| Duración total | ${report.totalDurationMs} ms |

## Criterios

- 50 usuarios simultáneos conectados a una sala: ${report.joinedUsers >= 50 ? 'Cumple' : 'No cumple'}
- Entrega de mensajes en menos de 1 segundo p95: ${report.messageLatency.p95Ms < 1000 ? 'Cumple' : 'No cumple'}
- Sin errores de conexión o ingreso: ${report.errors.length === 0 ? 'Cumple' : 'No cumple'}

## Errores

${report.errors.length ? report.errors.map((error) => `- ${error}`).join('\n') : 'Sin errores registrados.'}

## Comando

\`\`\`bash
cd backend
npm run load:test
\`\`\`
`

  await fs.writeFile(MD_REPORT, markdown)
}

async function main() {
  const startedAt = new Date().toISOString()
  const overallStart = Date.now()
  const errors = []
  const sockets = []
  let room = null
  let cleanup = null

  try {
    room = await createTempRoom()

    const joinResults = await Promise.all(
      Array.from({ length: VIRTUAL_USERS }, (_, index) => connectAndJoin(index, room.pin))
    )

    joinResults.forEach((result) => {
      if (result.socket?.connected) sockets.push(result.socket)
      if (!result.ok) errors.push(`${result.username}: ${result.error}`)
    })

    const successfulJoins = joinResults.filter((result) => result.ok)
    const roomId = successfulJoins[0]?.roomId
    const messageLatencies = []
    const receivedCounter = { count: 0 }
    const messagePrefix = `load-test|${RUN_ID}|`

    sockets.forEach((socket) => {
      socket.on('newMessage', (message) => {
        if (typeof message.content !== 'string' || !message.content.startsWith(messagePrefix)) {
          return
        }

        const sentAt = Number(message.content.split('|')[2])
        if (Number.isFinite(sentAt)) {
          messageLatencies.push(Date.now() - sentAt)
        }
        receivedCounter.count += 1
      })
    })

    if (roomId) {
      for (const result of successfulJoins) {
        for (let messageIndex = 0; messageIndex < MESSAGES_PER_USER; messageIndex += 1) {
          result.socket.emit('sendMessage', {
            roomId,
            content: `${messagePrefix}${Date.now()}|${result.username}|${messageIndex + 1}`,
          })
        }
      }
    }

    const sentMessages = successfulJoins.length * MESSAGES_PER_USER
    const expectedBroadcasts = sentMessages * successfulJoins.length
    await waitForBroadcasts(expectedBroadcasts, receivedCounter)

    cleanup = await cleanupRoom(room)

    const joinLatencies = successfulJoins.map((result) => result.latencyMs)
    const report = {
      startedAt,
      apiUrl: API_URL,
      virtualUsers: VIRTUAL_USERS,
      joinedUsers: successfulJoins.length,
      sentMessages,
      expectedBroadcasts,
      receivedBroadcasts: receivedCounter.count,
      joinLatency: {
        p50Ms: percentile(joinLatencies, 50),
        p95Ms: percentile(joinLatencies, 95),
        maxMs: joinLatencies.length ? Math.max(...joinLatencies) : 0,
      },
      messageLatency: {
        p50Ms: percentile(messageLatencies, 50),
        p95Ms: percentile(messageLatencies, 95),
        maxMs: messageLatencies.length ? Math.max(...messageLatencies) : 0,
      },
      totalDurationMs: Date.now() - overallStart,
      roomCreatedByScript: room.createdByScript,
      cleanup,
      errors,
      passed:
        successfulJoins.length >= VIRTUAL_USERS &&
        receivedCounter.count >= expectedBroadcasts &&
        percentile(messageLatencies, 95) < 1000 &&
        errors.length === 0,
    }

    await writeReport(report)
    console.log(JSON.stringify(report, null, 2))

    sockets.forEach((socket) => socket.disconnect())
    process.exit(report.passed ? 0 : 1)
  } catch (error) {
    if (room) cleanup = await cleanupRoom(room).catch((cleanupError) => ({
      ok: false,
      error: cleanupError.message,
    }))

    const report = {
      startedAt,
      apiUrl: API_URL,
      virtualUsers: VIRTUAL_USERS,
      joinedUsers: 0,
      sentMessages: 0,
      expectedBroadcasts: 0,
      receivedBroadcasts: 0,
      joinLatency: { p50Ms: 0, p95Ms: 0, maxMs: 0 },
      messageLatency: { p50Ms: 0, p95Ms: 0, maxMs: 0 },
      totalDurationMs: Date.now() - overallStart,
      cleanup,
      errors: [error.message],
      passed: false,
    }

    await writeReport(report)
    console.error(error)
    process.exit(1)
  }
}

main()
