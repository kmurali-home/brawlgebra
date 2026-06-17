# Playing BRAWLGEBRA online with a friend

The GitHub Pages link (`https://kmurali-home.github.io/brawlgebra/`) is **solo only** —
it's static hosting, so it can't run the live connection netplay needs. Online play needs
the little relay server (`netserver.js`) running on a host that supports WebSockets.

## 1. Host the relay (one-time, ~5 min, free)

**Render (easiest, click-only):**
1. Go to <https://render.com> and sign up (free).
2. **New +  →  Blueprint**, connect your GitHub and pick the **`brawlgebra`** repo.
   (Render reads `render.yaml` and configures everything.)
3. Click **Apply**. In ~1–2 minutes you get a URL like `https://brawlgebra-relay.onrender.com`.
   - No Blueprint? Use **New +  →  Web Service**, pick the repo, set **Start Command** to
     `node netserver.js`, leave build empty, Free plan, Create.

> Free tier spins the server down when idle, so the **first** visit after a quiet spell
> takes ~30–60s to wake. Fine for casual play. (Railway / Fly.io / a tiny VPS work too —
> any Node host; the server reads `PORT` from the environment.)

## 2. Play

- You and your friend both open the **Render URL** (not the Pages link).
- The relay serves the game itself, so the **online** options will connect automatically.
- One of you creates a room → share the 4-letter **code** → the other enters it → start.

## Today vs. the 1v1 build
- **Today:** online is **RUMBLE** — a 5-player free-for-all (empty seats are AI). You + your
  friend both join the same room and you're both in the brawl. Internet play, but not a clean duel.
- **Coming:** a proper **1v1 ONLINE** mode (you vs. your friend, no AI). That's a code change in
  `index.html` (host-authoritative 2-player standard fight) — built on top of this same relay.
