# CAMmonitor

Windows system tray app that monitors and remediates the `CapabilityAccessManager.db-wal` runaway write bug in Windows 11 24H2/25H2 (builds 26100–26200+).

## The Bug

`camsvc` enters a write loop, growing `C:\ProgramData\Microsoft\Windows\CapabilityAccessManager\CapabilityAccessManager.db-wal` at ~160 GB/day. The fix is to stop the service, delete only the WAL file, and restart — but this requires SYSTEM privileges and a stopped service.

## Setup

1. Run `npm install` then `npm run dist` to produce the installer `.exe`.
2. Run the installer as Administrator — it registers the CAMmonitor SYSTEM service.
3. CAMmonitor appears in the system tray: green = healthy, yellow = growing, red = large.

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

## Manual Service Install

```powershell
# Run PowerShell as Administrator
node service/installer.js install

# Verify
sc query CAMmonitor

# Uninstall
node service/installer.js uninstall
```

## Safety

- CAMmonitor **never deletes** `CapabilityAccessManager.db` — only the `-wal` file.
- All operations are logged to `%APPDATA%\CAMmonitor\log.csv`.
- Auto-remediation and scheduled remediation are **off by default** and require explicit opt-in.
- Remediation is idempotent — safe to run when the WAL does not exist.

## Optional: handle64.exe

Install [Sysinternals handle64](https://learn.microsoft.com/en-us/sysinternals/downloads/handle) and add it to PATH for explicit handle detection. Not required — CAMmonitor uses a retry loop by default.
