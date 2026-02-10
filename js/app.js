// app.js — v1 (difficulty toggle + audio button)

const app = document.getElementById("app");

if (!window.GROUP_ID) {
  app.innerHTML = "<p>Error: GROUP_ID not defined.</p>";
  throw new Error("GROUP_ID not defined");
}

// These files live in the SAME folder as the group page
const csvPath = "sentences.csv";
const audioFiles = {
  intermediate: "intermediate.mp3",
  advanced: "advanced.mp3",
};

let allRows = [];
let currentLevel = "both"; // "both" | "advanced" | "intermediate"

// ---- UI skeleton ----
app.innerHTML = `
  <section class="controls">
    <div class="control-row">
      <label for="difficultySelect" class="control-label">Difficulty</label>
      <select id="difficultySelect">
        <option value="both">Both</option>
        <option value="advanced">Advanced</option>
        <option value="intermediate">Intermediate</option>
      </select>

      <button id="playBtn" type="button">Play</button>

      <a class="home-link" href="../../index.html">Home</a>

    </div>

    <div id="audioNote" class="audio-note"></div>

    <!-- Hidden native audio element; we control it via the button -->
    <audio id="audio" preload="none"></audio>
  </section>

  <section id="sentencesContainer">
    <p>Loading…</p>
  </section>

  <nav id="pager" class="pager">
    <button id="prevBtn" type="button" disabled>← Previous</button>
    <a class="pager-home" href="../../index.html">Home</a>
    <button id="nextBtn" type="button" disabled>Next →</button>
  </nav>

`;

const container = document.getElementById("sentencesContainer");
const difficultySelect = document.getElementById("difficultySelect");
const playBtn = document.getElementById("playBtn");
const audioNote = document.getElementById("audioNote");
const audio = document.getElementById("audio");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");



setupPager().catch(console.error);

async function setupPager() {
  // groups.json is at site root; from /groups/group-001/ we go up two levels
  const res = await fetch("../../groups.json");
  if (!res.ok) throw new Error("Could not load groups.json for pager");
  const groups = await res.json();

  const idx = groups.findIndex(g => g.id === window.GROUP_ID);
  if (idx === -1) return; // group not listed yet

  const prev = groups[idx - 1] || null;
  const next = groups[idx + 1] || null;

  if (prev) {
    prevBtn.disabled = false;
    prevBtn.addEventListener("click", () => {
      window.location.href = `../${prev.id}/`;
    });
  }

  if (next) {
    nextBtn.disabled = false;
    nextBtn.addEventListener("click", () => {
      window.location.href = `../${next.id}/`;
    });
  }
}


// ---- Load CSV ----
fetch(csvPath)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status} ${response.statusText} at ${csvPath}`);
    }
    return response.text();
  })
  .then((text) => {
    allRows = parseCSV(text);
    applyDifficulty(); // initial render
  })
  .catch((err) => {
    container.innerHTML = `
      <p><strong>Error loading sentences.</strong></p>
      <p style="color:#b00020;">${err.message}</p>
    `;
    console.error(err);
  });

// ---- Events ----
difficultySelect.addEventListener("change", () => {
  currentLevel = difficultySelect.value;
  // Stop audio when switching difficulty to avoid confusion
  if (!audio.paused) audio.pause();
  audio.currentTime = 0;
  playBtn.textContent = "Play";
  applyDifficulty();
});

playBtn.addEventListener("click", async () => {
  // Decide which audio file to use
  const src = audioSrcForLevel(currentLevel);

  if (!src) {
    // "both" has no single matching audio file
    // (You can change this behavior later if you want a combined audio.)
    alert('Audio is level-specific. Choose "Advanced" or "Intermediate" to play the matching audio.');
    return;
  }

  if (audio.getAttribute("data-src") !== src) {
    audio.src = src;
    audio.setAttribute("data-src", src);
    audio.load();
  }

  try {
    if (audio.paused) {
      await audio.play();
      playBtn.textContent = "Pause";
    } else {
      audio.pause();
      playBtn.textContent = "Play";
    }
  } catch (e) {
    console.error(e);
    alert("Audio couldn't play. Check that the MP3 file exists and the browser allows playback.");
  }
});

// When audio ends, reset button label
audio.addEventListener("ended", () => {
  playBtn.textContent = "Play";
});

// ---- Helpers ----
function audioSrcForLevel(level) {
  if (level === "advanced") return audioFiles.advanced;
  if (level === "intermediate") return audioFiles.intermediate;
  return ""; // both -> no single audio
}

function applyDifficulty() {
  // Update note about which audio is available
  if (currentLevel === "both") {
    audioNote.textContent = 'Audio is level-specific. Choose "Advanced" or "Intermediate" to play the matching audio.';
  } else {
    audioNote.textContent = `Audio loaded: ${audioSrcForLevel(currentLevel)}`;
  }

  const norm = (s) => (s || "").trim().toLowerCase();

  let rows;
  if (currentLevel === "both") {
    const intermediateRows = allRows.filter(r => norm(r.level) === "intermediate");
    const advancedRows = allRows.filter(r => norm(r.level) === "advanced");
    rows = [...intermediateRows, ...advancedRows];
  } else {
    rows = allRows.filter(r => norm(r.level) === currentLevel);
  }
  render(rows);

}

// Minimal CSV parser (works with our quoted fields)
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines.shift().split(",").map(h => h.trim());

  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
      const obj = {};
      headers.forEach((h, i) => {
        const raw = values[i] ?? "";
        obj[h] = raw.replace(/^"|"$/g, "");
      });
      return obj;
    });
}

function render(rows) {
  container.innerHTML = "";

  rows.forEach((row) => {
    const block = document.createElement("div");
    block.className = "sentence-block";

    const prompt = document.createElement("div");
    prompt.className = "prompt";
    prompt.textContent = row.prompt || "";

    const chinese = document.createElement("div");
    chinese.className = "chinese";
    chinese.textContent = row.chinese || "";

    block.appendChild(prompt);
    block.appendChild(chinese);
    container.appendChild(block);
  });

  if (rows.length === 0) {
    container.innerHTML = "<p>No sentences for this difficulty setting.</p>";
  }
}
