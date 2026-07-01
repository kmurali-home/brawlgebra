#!/usr/bin/env node
// =====================================================================
//  MODULUS — online relay server (zero dependencies)
//  Serves the game over HTTP and relays the netplay over WebSocket on
//  the SAME port, so all five players just open one URL.
//
//  Run:    node netserver.js            (defaults to port 8080)
//          PORT=3000 node netserver.js
//  Deploy: any host that runs Node (Render / Railway / Fly / a VPS).
//          Players open  http(s)://<host>/  and enter a room code.
//
//  Model: host-authoritative. The first player in a room is the HOST and
//  runs the real simulation in their browser; the server just relays
//  their snapshots out to the guests and the guests' inputs back to the
//  host. Empty seats are filled by AI on the host. The server stays dumb
//  and stateless about gameplay — it only moves messages and tracks who
//  sits in which seat.
// =====================================================================
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;
const MAGIC = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const MIME = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css",
               ".json":"application/json", ".png":"image/png", ".svg":"image/svg+xml",
               ".ico":"image/x-icon" };

//---------------------------------------------------------------------- static
const httpServer = http.createServer((req, res) => {
  let url = decodeURIComponent((req.url || "/").split("?")[0]);
  if (url === "/" || url === "") url = "/index.html";
  if (url === "/health") { res.writeHead(200); return res.end("ok"); }
  const file = path.join(ROOT, path.normalize(url).replace(/^(\.\.[/\\])+/, ""));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end("forbidden"); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
});

//---------------------------------------------------------------------- ws frames
function sendFrame(sock, str) {
  if (sock.destroyed) return;
  const data = Buffer.from(str);
  const len = data.length;
  let header;
  if (len < 126) header = Buffer.from([0x81, len]);
  else if (len < 65536) { header = Buffer.alloc(4); header[0]=0x81; header[1]=126; header.writeUInt16BE(len,2); }
  else { header = Buffer.alloc(10); header[0]=0x81; header[1]=127; header.writeBigUInt64BE(BigInt(len),2); }
  try { sock.write(Buffer.concat([header, data])); } catch(e){}
}
function closeSock(sock){ try { sock.end(); } catch(e){} }

//---------------------------------------------------------------------- rooms
// rooms: code -> { clients: Set, byId: Map(id->client), started: bool }
const rooms = new Map();
let nextId = 1;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
function makeCode(){
  let c; do { c = Array.from({length:4},()=>CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]).join("");
  } while (rooms.has(c));
  return c;
}
function roster(room){
  return [...room.clients]
    .sort((a,b)=>a.seat-b.seat)
    .map(c=>({ seat:c.seat, name:c.name, charIdx:c.charIdx, host:c.host, ready:c.ready }));
}
function broadcast(room, obj, except){
  const s = JSON.stringify(obj);
  for (const c of room.clients) if (c !== except) sendFrame(c.sock, s);
}
function hostOf(room){ for (const c of room.clients) if (c.host) return c; return null; }
function freeSeat(room){
  const taken = new Set([...room.clients].map(c=>c.seat));
  for (let s=0; s<5; s++) if (!taken.has(s)) return s;
  return -1;
}
function pushRoster(room){ broadcast(room, { t:"roster", roster: roster(room), started: room.started }); }

function leaveRoom(client){
  const room = client.room;
  if (!room) return;
  room.clients.delete(client);
  client.room = null;
  if (room.clients.size === 0) { rooms.delete(room.code); return; }
  // if the host left, promote the lowest-seat survivor and bounce everyone to the lobby
  if (client.host) {
    const next = [...room.clients].sort((a,b)=>a.seat-b.seat)[0];
    next.host = true;
    room.started = false;
    broadcast(room, { t:"hostleft" });
  } else {
    broadcast(room, { t:"left", seat: client.seat });
  }
  pushRoster(room);
}

function handleMessage(client, raw){
  let m; try { m = JSON.parse(raw); } catch(e){ return; }
  client.lastSeen = Date.now();
  switch (m.t) {
    case "create": {
      leaveRoom(client);
      const code = makeCode();
      const room = { code, clients: new Set(), started: false };
      rooms.set(code, room);
      client.room = room; client.seat = 0; client.host = true;
      client.name = (m.name||"P1").slice(0,12); client.charIdx = m.charIdx||0; client.ready = true;
      room.clients.add(client);
      sendFrame(client.sock, JSON.stringify({ t:"joined", room: code, seat: 0, host: true }));
      pushRoster(room);
      break;
    }
    case "join": {
      const room = rooms.get((m.room||"").toUpperCase());
      if (!room) { sendFrame(client.sock, JSON.stringify({ t:"error", msg:"No room "+(m.room||"") })); break; }
      if (room.started) { sendFrame(client.sock, JSON.stringify({ t:"error", msg:"Match already started" })); break; }
      const seat = freeSeat(room);
      if (seat < 0) { sendFrame(client.sock, JSON.stringify({ t:"error", msg:"Room full" })); break; }
      leaveRoom(client);
      client.room = room; client.seat = seat; client.host = false;
      client.name = (m.name||("P"+(seat+1))).slice(0,12); client.charIdx = m.charIdx||0; client.ready = false;   // a joining guest must press READY before the host can start
      room.clients.add(client);
      sendFrame(client.sock, JSON.stringify({ t:"joined", room: room.code, seat, host: false }));
      pushRoster(room);
      break;
    }
    case "char": {
      if (!client.room) break;
      client.charIdx = m.charIdx|0;
      if (!client.host) client.ready = false;   // changing fighter un-readies you (host is always ready)
      pushRoster(client.room);
      break;
    }
    case "ready": {
      if (!client.room) break;
      client.ready = !!m.r;
      pushRoster(client.room);
      break;
    }
    case "start": {
      const room = client.room;
      if (!room || !client.host) break;
      // duel needs exactly two humans; refuse a lonely start so nobody drops into an empty duel
      if (m.gm === "duel" && room.clients.size < 2) {
        sendFrame(client.sock, JSON.stringify({ t:"error", msg:"Waiting for your friend to join" }));
        break;
      }
      room.started = true;
      broadcast(room, { t:"start", seed: crypto.randomInt(1e9), stage: m.stage|0,
                        gm: m.gm || "rumble", wu: m.wu?1:0, seats: roster(room) });
      break;
    }
    case "wu": { // warm-up solve result, guest -> host
      const room = client.room; if (!room) break;
      const host = hostOf(room);
      if (host && host !== client) sendFrame(host.sock, JSON.stringify({ t:"wu", seat: client.seat, fr: m.fr|0 }));
      break;
    }
    case "rematch": { // host re-opens the room for another match without anyone re-entering a code
      const room = client.room;
      if (!room || !client.host) break;
      room.started = false;
      for (const c of room.clients) if (!c.host) c.ready = false;   // each guest must re-ready for the next set
      broadcast(room, { t:"rematch" });
      pushRoster(room);
      break;
    }
    case "input": { // guest -> host only
      const room = client.room; if (!room) break;
      const host = hostOf(room);
      if (host && host !== client) sendFrame(host.sock, JSON.stringify({ t:"input", seat: client.seat, d: m.d }));
      break;
    }
    case "snap": { // host -> all guests
      const room = client.room; if (!room || !client.host) break;
      broadcast(room, { t:"snap", d: m.d }, client);
      break;
    }
    case "ev": { // host one-off event -> all guests
      const room = client.room; if (!room || !client.host) break;
      broadcast(room, { t:"ev", d: m.d }, client);
      break;
    }
    case "ping": sendFrame(client.sock, JSON.stringify({ t:"pong" })); break;
  }
}

//---------------------------------------------------------------------- upgrade
httpServer.on("upgrade", (req, sock) => {
  const key = req.headers["sec-websocket-key"];
  if (!key) { closeSock(sock); return; }
  const acceptKey = crypto.createHash("sha1").update(key + MAGIC).digest("base64");
  sock.write(
    "HTTP/1.1 101 Switching Protocols\r\n" +
    "Upgrade: websocket\r\nConnection: Upgrade\r\n" +
    "Sec-WebSocket-Accept: " + acceptKey + "\r\n\r\n");
  sock.setNoDelay(true);

  const client = { id: nextId++, sock, room: null, seat: -1, host: false,
                   name: "", charIdx: 0, ready: false, lastSeen: Date.now() };
  let buf = Buffer.alloc(0);

  sock.on("data", (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      if (buf.length < 2) break;
      const opcode = buf[0] & 0x0f;
      const masked = buf[1] & 0x80;
      let len = buf[1] & 0x7f, off = 2;
      if (len === 126) { if (buf.length < 4) break; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) break; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      let mask;
      if (masked) { if (buf.length < off + 4) break; mask = buf.slice(off, off + 4); off += 4; }
      if (buf.length < off + len) break;
      let payload = buf.slice(off, off + len);
      if (masked) { const o = Buffer.alloc(len); for (let i=0;i<len;i++) o[i] = payload[i] ^ mask[i & 3]; payload = o; }
      buf = buf.slice(off + len);
      if (opcode === 0x8) { closeSock(sock); return; }          // close
      else if (opcode === 0x1) handleMessage(client, payload.toString()); // text
      // pings/binary/continuation ignored — protocol is small single-frame JSON
    }
  });
  const done = () => leaveRoom(client);
  sock.on("close", done);
  sock.on("error", done);
  sock.on("end", done);
});

// reap clients that went silent (closed laptops, dropped wifi)
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values())
    for (const c of room.clients)
      if (now - c.lastSeen > 35000) closeSock(c.sock);
}, 10000);

httpServer.listen(PORT, () => {
  console.log("MODULUS relay live on http://localhost:" + PORT + "  (open this URL to play)");
});
