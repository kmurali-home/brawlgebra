# Shipping Brawlgebra on Steam

This is the practical path from the single-file game to a paid Steam build.
The desktop wrapper is **[Tauri v2](https://tauri.app)** — it packages `index.html`
inside the OS's native webview, so the binaries are ~5–12 MB (not the ~150 MB an
Electron build would be) and start instantly.

`index.html` stays the **one source of truth**. A tiny prep step
(`scripts/prep-dist.js`) copies it into `dist/` right before every build, so you
never hand-edit a packaged copy.

---

## 0. What you need (one-time)

| Thing | Why | Cost |
|---|---|---|
| **Rust toolchain** (`rustup`) | Tauri compiles a small native shell in Rust | free |
| **Node 18+** | already used by this project | free |
| **A GitHub repo** | to run the multi-OS build pipeline (below) | free |
| **Steamworks account** + **Steam Direct fee** | required to publish anything | **$100 per app** (recoupable) |

Install Rust locally (only needed for building on *your* machine):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# then restart your shell, or:  source "$HOME/.cargo/env"
```

macOS also needs the Xcode Command Line Tools (`xcode-select --install`) — already
present on this machine.

---

## 1. Build on your own machine (Mac → `.app` / `.dmg`)

```bash
cd mental-kombat
npm install            # installs the Tauri CLI (first time only)
npm run desktop:dev    # hot dev window — verify it runs
npm run desktop:build  # produces the installer
```

Output lands in `src-tauri/target/release/bundle/`:

- **macOS:** `dmg/Brawlgebra_1.0.0_aarch64.dmg` and `macos/Brawlgebra.app`
- **Windows** (when built on Windows): `nsis/Brawlgebra_1.0.0_x64-setup.exe` + `msi/…msi`
- **Linux** (when built on Linux): `deb/`, `rpm/`, `appimage/`

> You can only build a given OS's binary **on that OS** (you can't make the
> Windows `.exe` from a Mac). That's what the CI pipeline in step 2 is for —
> and since most of Steam is on Windows, you'll want it.

To re-skin the app icon, drop a 1024×1024 PNG at `assets/app-icon.png` and run
`npm run desktop:icon` (regenerates every platform size, including `.ico`/`.icns`).

---

## 2. Build all three OSes at once (GitHub Actions)

`.github/workflows/release.yml` builds **Windows + macOS (universal) + Linux** and
attaches the installers to a draft GitHub Release.

```bash
# from the repo root (the mental-kombat folder)
git init && git add . && git commit -m "Brawlgebra desktop build"
git remote add origin git@github.com:<you>/brawlgebra.git
git push -u origin main

git tag v1.0.0
git push origin v1.0.0      # ← this triggers the build
```

When it finishes, grab the installers from the draft Release. These are the files
you feed to Steam.

> If your repo root is the *parent* folder instead of `mental-kombat/`, add
> `projectPath: mental-kombat` under the `tauri-action` `with:` block.

---

## 3. Upload to Steam (SteamPipe)

1. Pay the **$100 Steam Direct** fee and create the app in
   [Steamworks](https://partner.steamgames.com/).
2. Install the **Steamworks SDK** and use the **SteamPipe** `steamcmd` /
   ContentBuilder tool.
3. Make one **depot per OS** (Windows depot, macOS depot, Linux depot) and point
   each at the matching build output from step 1/2.
4. Set the launch options per depot (the executable name, e.g. `Brawlgebra.exe`).
5. Upload a build, set it live on a branch, then publish the store page.

Steam's own docs: *Steamworks → SteamPipe → Uploading Builds*.

---

## Before you charge $5 — honest caveats

These are working/limited in the desktop build and affect the store page:

- **Fully offline & working:** The Tower, Versus, local 2-player, Gauntlet, the
  5-way Rumble (vs AI), and the whole Story mode. This is the bulk of the game and
  needs no server.
- **Online Rumble needs a host.** `netserver.js` is a relay you must run somewhere
  (Render/Railway/Fly/a VPS) and the client must point at its URL. Until that's
  hosted, label online as **"LAN / self-hosted"** on the store page rather than
  implying free matchmaking — Steam reviews punish overstated multiplayer.
- **No gamepad support yet.** Couch/party buyers filter for the controller badge;
  this is the next-biggest value add after this wrapper.
- **Signing/notarization.** Unsigned builds run but throw OS warnings. For a clean
  install, code-sign Windows (cert) and notarize macOS (Apple Developer acct,
  $99/yr). Optional for a first release; expected for polish.

See `MEMORY` / the value audit for the full $5-readiness checklist.
