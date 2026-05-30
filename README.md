# CAMmonitor

A Windows system tray app that monitors and remediates a known bug in Windows 11 24H2/25H2 that causes your drive to fill up silently overnight.

## The Bug

Builds 26100–26200+ of Windows 11 contain a bug where `camsvc` (the Capability Access Manager service, which controls camera and microphone access) enters a runaway write loop. It grows a single database file at roughly 160 GB/day until your drive is full.

The file is:
```
C:\ProgramData\Microsoft\Windows\CapabilityAccessManager\CapabilityAccessManager.db-wal
```

**You likely have this bug if:**
- You're on Windows 11 24H2 or 25H2
- That file exists and is larger than a few hundred MB
- Your drive space is shrinking for no apparent reason

The fix is simple in concept: stop the service, delete the WAL file, restart the service. The complication is that `camsvc` holds an exclusive file lock while running, so this requires SYSTEM-level privileges to pull off without a reboot.

## What CAMmonitor Does

CAMmonitor sits in your system tray and watches that file.

- **Green icon** — WAL file is small or absent. Nothing to worry about.
- **Yellow icon** — WAL file is growing (over 100 MB). Worth keeping an eye on.
- **Red icon** — WAL file is large (over 1 GB). You should reset it.

Click the tray icon to open the panel. You'll see the current file size, a sparkline of the last hour of readings, and a **Reset Now** button. Clicking Reset Now stops `camsvc`, deletes the WAL file, and restarts `camsvc` — the whole sequence takes about 15 seconds and streams progress back to the panel.

You can also enable auto-remediation in settings, which triggers the reset automatically when the file crosses a threshold you choose.

## Why This Needs a SYSTEM Service

You may notice that setup installs a Windows service that runs as SYSTEM. This is the part that warrants an explanation.

**The monitoring requires no special privileges.** Reading a file's size doesn't need elevation. The tray app runs as your normal user account and never touches the service unless you trigger a remediation.

**The remediation requires SYSTEM.** Stopping `camsvc` and deleting the WAL file will fail from a regular admin account because `camsvc` holds a kernel-level file lock. Only a process running at SYSTEM level can release that lock. There is no workaround — this is a Windows security boundary.

**What the service actually does — nothing except when called:**

The service sits idle, listening on a local named pipe. When you click Reset Now, the tray app sends a single command. The service then:

1. Runs `sc stop camsvc`
2. Deletes `CapabilityAccessManager.db-wal` (and only that file)
3. Runs `sc start camsvc`
4. Verifies the service is running again
5. Reports the result back

That is the complete list of things it does. It does not touch the registry, does not make network calls, does not access other files, and does not run on any schedule of its own.

**You can read every line of it.** The full source is in `service/remediate.js` (~80 lines) and `service/service.js` (~50 lines).

## What It Will Never Do

- Delete `CapabilityAccessManager.db` — only the `-wal` file
- Make any network connection
- Collect or transmit any data about your system
- Run remediation without your knowledge (auto-remediation is off by default)
- Leave `camsvc` stopped — if the restart fails, it reports an error rather than leaving the service down

## Setup

**If you're installing a pre-built release:**

1. Run the installer `.exe` as Administrator.
2. Open an **Administrator** terminal in the install directory and run:
   ```powershell
   npm run install-service
   ```
3. CAMmonitor appears in your system tray. You're done.

To remove it completely:
```powershell
npm run uninstall-service
```
Then uninstall CAMmonitor from Add/Remove Programs.

**If you're building from source:**

```powershell
npm install
npm run dist
```

Then follow the pre-built steps above using the `.exe` from the `dist/` folder.

## Install / Uninstall Service

Both commands require an **Administrator** terminal.

```powershell
npm run install-service    # installs and starts the service (run once)
npm run uninstall-service  # stops the service, removes it, deletes settings and logs
```

Verify the service is running:
```powershell
sc query CAMmonitor
```

## Development

```powershell
npm install
npm run create-icons
npm start
```

## Tests

```powershell
npm test
```

## Logging

All activity is logged to `%APPDATA%\CAMmonitor\log.csv` — every poll, every threshold crossing, every remediation attempt with its result. Open it from the tray panel ("Open Log") or navigate there directly.

## Optional: handle64.exe

Install [Sysinternals handle64](https://learn.microsoft.com/en-us/sysinternals/downloads/handle) and add it to PATH for explicit file handle detection. Not required — CAMmonitor uses a timed retry loop by default.
