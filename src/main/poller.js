const fs = require('fs');

function createPoller(walPath, intervalMs, onSize) {
  let timer = null;

  function tick() {
    let bytes = 0;
    try {
      bytes = fs.statSync(walPath).size;
    } catch (e) {
      if (e.code !== 'ENOENT') {
        process.stderr.write(`[poller] stat failed: ${e.message}\n`);
      }
    }
    onSize(bytes);
  }

  function start() {
    if (timer) return;
    timer = setInterval(tick, intervalMs);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  return { start, stop };
}

module.exports = { createPoller };
