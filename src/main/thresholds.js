let warningFired = false;

function check(bytes, settings) {
  const aboveWarning = bytes > settings.warningThresholdBytes;
  const aboveAutoRemediate = bytes > settings.autoRemediateThresholdBytes;

  const warn = aboveWarning && !warningFired;
  if (warn) warningFired = true;
  if (!aboveWarning) warningFired = false;

  const autoRemediate = aboveAutoRemediate && settings.autoRemediateEnabled;

  return { warn, autoRemediate };
}

function reset() {
  warningFired = false;
}

module.exports = { check, reset };
