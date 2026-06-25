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
- On the title screen pick **MULTIPLAYER**, then choose your mode (below).
- One of you creates a room → share the 4-letter **code** → the other enters it → **START**.
- After a match, the host can hit **REMATCH** to replay with the same friend — no new code needed.

## Two online modes (title → MULTIPLAYER)
- **1v1 DUEL** — you vs **one** friend, live, best-of-3 rounds. No AI; the host must wait for the
  friend to join before START unlocks. This is the clean duel.
- **RUMBLE (online)** — up to **5** friends in one free-for-all; any empty seats are filled by AI,
  so 2 players is enough to start.
- (**RUMBLE same-screen** is also there for local vs AI — no server needed.)

> The link you share for online play must be the **relay URL** (Render), not the GitHub Pages link.
> Pages is static hosting and can't run the live connection — if you try online there, the game now
> tells you so instead of just hanging.
