# CAMmonitor

Windows system tray app that monitors and remediates the `CapabilityAccessManager.db-wal` runaway write bug in Windows 11 24H2/25H2 (builds 26100–26200+).

## The Bug

`camsvc` (Capability Access Manager) enters a write loop, growing `C:\ProgramData\Microsoft\Windows\CapabilityAccessManager\CapabilityAccessManager.db-wal` at ~160 GB/day. Left unchecked it will fill your drive.

The fix is straightforward: stop the service, delete only the WAL file, restart the service. The complication is that this requires SYSTEM-level privileges — the same level Windows itself runs at — because `camsvc` holds an exclusive lock on the file while running.

## Why This Needs a SYSTEM Service

You may notice that setup asks you to install a Windows service that runs as SYSTEM. This is the part that warrants an explanation.

**The monitoring (tray app) requires no special privileges.** Reading a file's size doesn't need elevation. The tray app runs as your normal user account and never touches the service unless you trigger a remediation.

**The remediation requires SYSTEM.** `sc stop camsvc` and the subsequent file delete will fail from a regular admin account because `camsvc` holds a kernel-level file lock. Only a process running at SYSTEM level can release that lock and delete the file. There is no workaround — this is a Windows security boundary.

**What the service actually does — nothing except when called:**

The service sits idle, listening on a local named pipe (`\\.\pipe\CAMmonitor`). When you click "Reset Now" (or auto-remediation triggers), the tray app sends a single command over that pipe. The service then:

1. Runs `sc stop camsvc`
2. Deletes `CapabilityAccessManager.db-wal` (and only that file)
3. Runs `sc start camsvc`
4. Verifies the service is running again
5. Reports the result back

That is the complete list of things it does. It does not touch the registry, does not make network calls, does not access other files, and does not run on any schedule of its own.

**You can read every line of it.** The full source is in `service/remediate.js` (~80 lines) and `service/service.js` (~40 lines).

## Setup

1. Clone this repo and run `npm install`.
2. Run `npm run dist` to build the installer `.exe`, then run it as Administrator.
3. Open an **Administrator** terminal in the install directory and run:
   ```powershell
   npm run install-service
   ```
4. CAMmonitor appears in the system tray. Green = healthy, yellow = growing (>100 MB), red = large (>1 GB).

To remove it entirely, open an Administrator terminal and run:
```powershell
npm run uninstall-service
```
Then uninstall CAMmonitor from Add/Remove Programs.

## What It Will Never Do

- Delete `CapabilityAccessManager.db` — only the `-wal` file
- Make any network connection
- Collect or transmit any data about your system
- Run remediation without your knowledge (auto-remediation is off by default)
- Leave `camsvc` stopped — if the service fails to restart, it reports an error and stops

## Development

```
npm install
npm run create-icons
npm start
```

## Tests

```
npm test
```

## Build Installer

```
npm run dist
```

Replace placeholder icons in `assets/` with proper 16x16 designs before distributing.

## Install / Uninstall

Both scripts must be run from an **Administrator** PowerShell or terminal.

**Install the service (once, after first run):**

```powershell
npm run install-service
```

**Verify it's running:**

```powershell
sc query CAMmonitor
```

**Full uninstall:**

```powershell
npm run uninstall-service
```

This removes the Windows service and deletes `%APPDATA%\CAMmonitor\` (your settings and logs). Then remove the app itself via Add/Remove Programs.

## Logging

All activity is logged to `%APPDATA%\CAMmonitor\log.csv`. Every poll, every threshold crossing, every remediation attempt — start, result, and any errors. Open it from the tray popup ("Open Log") or navigate there directly.

## Optional: handle64.exe

Install [Sysinternals handle64](https://learn.microsoft.com/en-us/sysinternals/downloads/handle) and add it to PATH for explicit handle detection. Not required — CAMmonitor uses a timed retry loop by default.
