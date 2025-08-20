const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jsonrepair = require("jsonrepair");

const app = express();
app.use(cors());
app.use(bodyParser.json());

function deepParseJson(json) {
  let depth = 0;
  const maxDepth = 5;

  while (typeof json === "string" && depth < maxDepth) {
    try {
      json = JSON.parse(json);
      depth++;
    } catch {
      break;
    }
  }

  return json;
}

app.post("/api/format", (req, res) => {
  const { input } = req.body;

  try {
    // Step 1: Repair broken JSON syntax
    const repaired = jsonrepair(input);

    // Step 2: Parse once
    let parsed = JSON.parse(repaired);

    // Step 3: Deep parse if it's stringified again
    parsed = deepParseJson(parsed);

    // Step 4: Format output
    const pretty = JSON.stringify(parsed, null, 2);

    res.json({ success: true, output: pretty });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: `Failed to parse JSON: ${err.message}`,
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
