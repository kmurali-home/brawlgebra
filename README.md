# MODULUS

A math-powered fighting game. Solving arithmetic is your only source of **aura**;
every attack spends it. Five characters, a story Tower, Gauntlet survival, local 2-player,
a 5-way Rumble, and **online 5-player Rumble**.

## Play solo / local (no server needed)
Just open `index.html` in a browser. Everything except *online* works straight from the file.

## Play online (5 players, each on their own computer)
Online needs a tiny relay server (zero dependencies, pure Node). It serves the game **and**
relays the netplay on one port, so players only need a URL.

### Run it locally
```bash
node netserver.js            # defaults to http://localhost:8080
# or: PORT=3000 node netserver.js
```
Open the printed URL. To play with people on your network, share your LAN IP
(`http://<your-ip>:8080`). For friends over the internet, either deploy (below) or
expose your local server with a tunnel, e.g. `npx localtunnel --port 8080` or `ngrok http 8080`.

### Deploy it (so friends just open a link)
Any host that runs Node works — Render, Railway, Fly, Glitch, a VPS:
- **Build:** none
- **Start command:** `node netserver.js` (or `npm start`)
- The platform's `PORT` env var is picked up automatically.

Then everyone opens `https://<your-app>/`, chooses **ONLINE RUMBLE**, and:
1. One player picks **CREATE ROOM** → gets a 4-letter code.
2. The others pick **JOIN WITH CODE** and type it.
3. Any empty seats are filled by **AI**.
4. The host hits **START**.

### How online works (architecture)
- **Host-authoritative.** The player who created the room runs the real simulation in
  their browser and broadcasts ~30 snapshots/sec. Guests render the interpolated snapshots
  and stream their inputs back. Empty seats are AI on the host.
- **Math is client-authoritative** (each player solves locally and reports the result);
  **physics & combat are host-authoritative.** A math-to-dodge party brawler tolerates
  latency far better than a twitch fighter, so this stays fun over normal connections.
- The relay (`netserver.js`) is stateless about gameplay — it only moves messages and
  tracks who sits in which seat. ~250 lines, no `npm install`.

Tip: the host should keep their tab focused while hosting (a fully backgrounded tab gets
throttled by the browser and stops simulating).
