// app.js — minimal v0

// Where content will be rendered
const app = document.getElementById("app");

// Basic safety check
if (!window.GROUP_ID) {
  app.innerHTML = "<p>Error: GROUP_ID not defined.</p>";
  throw new Error("GROUP_ID not defined");
}

// Path to this group's CSV
const csvPath = `sentences.csv`;

// Load CSV
fetch(csvPath)
  .then(response => response.text())
  .then(text => {
    const rows = parseCSV(text);
    render(rows);
  })
  .catch(err => {
    app.innerHTML = "<p>Error loading sentences.</p>";
    console.error(err);
  });

// Very simple CSV parser (good enough for our controlled files)
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines.shift().split(",");

  return lines.map(line => {
    const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i]
        ? values[i].replace(/^"|"$/g, "")
        : "";
    });
    return obj;
  });
}

// Render prompt + Chinese
function render(rows) {
  app.innerHTML = "";

  rows.forEach(row => {
    const block = document.createElement("div");
    block.className = "sentence-block";

    const prompt = document.createElement("div");
    prompt.className = "prompt";
    prompt.textContent = row.prompt;

    const chinese = document.createElement("div");
    chinese.className = "chinese";
    chinese.textContent = row.chinese;

    block.appendChild(prompt);
    block.appendChild(chinese);
    app.appendChild(block);
  });
}
