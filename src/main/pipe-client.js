const net = require('net');

const PIPE_PATH = '\\\\.\\pipe\\CAMmonitor';

let active = false;

function remediate(walSizeBefore, onProgress, onComplete) {
  if (active) return;
  active = true;
  let completed = false;

  const socket = net.createConnection(PIPE_PATH);
  let buffer = '';

  function complete(event) {
    if (completed) return;
    completed = true;
    active = false;
    onComplete(event);
  }

  socket.on('connect', () => {
    socket.write(JSON.stringify({ cmd: 'REMEDIATE', walSizeBefore }) + '\n');
  });

  socket.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      let event;
      try { event = JSON.parse(line); } catch (_) { continue; }
      onProgress(event);
      if (event.status === 'done' || event.status === 'error') {
        socket.end();
        complete(event);
      }
    }
  });

  socket.on('error', (e) => {
    complete({
      status: 'error',
      message: `Pipe connection failed: ${e.message}. Is the service installed and running?`,
    });
  });

  socket.on('close', () => { active = false; });
}

function isActive() { return active; }

function _resetActive() { active = false; }

module.exports = { remediate, isActive, _resetActive };
