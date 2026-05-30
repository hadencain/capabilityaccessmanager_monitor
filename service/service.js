const net = require('net');
const { runRemediation } = require('./remediate');

const PIPE_PATH = '\\\\.\\pipe\\CAMmonitor';

const server = net.createServer((socket) => {
  let buffer = '';

  socket.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      let msg;
      try { msg = JSON.parse(line); } catch (_) { continue; }
      if (msg.cmd === 'REMEDIATE') {
        handleRemediation(socket, msg.walSizeBefore || 0);
      }
    }
  });

  socket.on('error', () => {});
});

function send(socket, obj) {
  try { socket.write(JSON.stringify(obj) + '\n'); } catch (_) {}
}

async function handleRemediation(socket, walSizeBefore) {
  try {
    await runRemediation((progress) => send(socket, progress));
  } catch (e) {
    send(socket, { status: 'error', message: e.message });
  }
}

server.on('error', (e) => {
  process.stderr.write(`[service] pipe error: ${e.message}\n`);
});

server.listen(PIPE_PATH, () => {
  process.stdout.write(`[service] listening on ${PIPE_PATH}\n`);
});
