# BRAWLGEBRA — art assets

Drop PNG files in **this folder** (next to `index.html` → `assets/`). The game loads them
automatically on launch. **If a file is missing, the game uses its built-in procedural look —
nothing breaks.** So you can add art one stage at a time.

After adding/replacing a file: **reload the page** (the game reads assets at startup).

---

## 1. Stage backdrops (highest impact — do these first)

One painted background per stage. Filenames are exact:

| File | Stage (in game) | Theme / mood | Accent |
|------|-----------------|--------------|--------|
| `bg_pit.png`     | THE CHASM          | a deep night gorge with a spiked chasm below; addition / "+" | green |
| `bg_frost.png`   | THE FROST SPIRE    | a tall icy pagoda fortress at cold dusk; subtraction / "−"   | cyan |
| `bg_schism.png`  | THE SCHISM LIBRARY | a vast arcane reading-hall with a glowing rune portal; division / "÷" | violet |
| `bg_forge.png`   | THE OVERFLOW FORGE | a molten desert forge at burning sunset; multiplication / "×" | red/orange |
| `bg_void.png`    | THE EQUALS         | a stark cosmic balance-beam sanctum in the void; the "=" | amber |
| `bg_proving.png` | THE PROVING DECK   | a clean tournament arena deck at night (neutral, no hazard)  | grey |

**Specs**
- **Aspect:** 16:9. **Size:** 1920×1080 ideal (min 1280×720). PNG (or swap the loader to .jpg).
- **Cover-fit:** the image is scaled to fill the screen and drifts slightly with the camera
  (parallax), so leave a little safe margin all around — don't put critical detail at the extreme edges.
- **Keep these zones uncluttered / darker** (UI and gameplay sit on top):
  - **Top strip** (health bars + timer) and **top-left** (fighter name, move costs).
  - **Bottom-center** (the big math card) and the **bottom HUD strip**.
  - The **lower third** is where fighters stand — keep it readable, mid-to-dark value.
- **Value/contrast:** overall darker/mid so the white HUD text and the lit fighters pop. Bright
  focal elements (a sun, a portal) read best in the **upper third, off-center**.
- **Style:** painterly / stylized game art, cohesive across the six (same hand). Match each accent color.

**Example generation prompt (swap the bracketed part per stage):**
> "Stylized 2D fighting-game stage background, 16:9, [a molten desert forge at burning orange
> sunset, dunes and distant smokestacks], dramatic rim light, painterly, dark readable lower
> third, no characters, no text, cinematic."

---

## 2. Title logo (optional, easy win)

| File | Use |
|------|-----|
| `title.png` | a transparent-background BRAWLGEBRA wordmark/logo for the title screen |

- Transparent PNG, ~1200×400, centered artwork. (Wiring it onto the title screen is a 2-line
  follow-up once you have it — ask me.)

---

## 3. Character art — PHASE 2 (bigger lift, NOT wired yet)

The fighters are currently drawn by code (procedural skeleton + shading), which is why they look
"stylized stick-figure" rather than AAA. Replacing them with real art means **sprite sheets**:
each fighter needs frames for idle / walk / punch / kick / special / hit / KO, at minimum — that's
dozens of frames per character × 5+ characters, plus an animation system to play them.

That's a real project. If you want to go there, the cheapest first step is a single **key-art
portrait** per fighter for the select / VS screens (static, high-impact, low frame count). Tell me
and I'll add a `assets/char_<id>.png` portrait hook (ids: initiate, addison, lessing, krishna,
maximilian, solomon). Full in-fight sprite animation is the larger phase after that.

---

### How the loader works (for reference)
`index.html` → `loadAssets()` requests `assets/bg_<id>.png` for every stage + `assets/title.png`.
Each is optional; on `404`/decode-fail it silently keeps the procedural render. Background images
replace the procedural **sky** layer; the midground silhouettes + ground still draw on top.
