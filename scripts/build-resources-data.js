const fs = require("fs");
const path = require("path");

const workspace = path.resolve(__dirname, "..");
const source = "C:/Users/meera/Downloads/1-ARC-Materials-Registry-2026-06-16.json";
const dataDir = path.join(workspace, "data");
const registryTarget = path.join(dataDir, "arc-materials-registry-2026-06-16.json");
const resourcesTarget = path.join(dataDir, "resources-data.js");

fs.mkdirSync(dataDir, { recursive: true });

const sourceText = fs.readFileSync(source, "utf8");
fs.writeFileSync(registryTarget, sourceText);

const raw = JSON.parse(sourceText);

const strip = (value = "") => String(value)
  .replace(/<[^>]*>/g, "")
  .replace(/&nbsp;/g, " ")
  .replace(/&#038;/g, "&")
  .trim();

const href = (value = "") => {
  const match = String(value).match(/href="([^"]+)"/);
  return match ? match[1].replace(/&#038;/g, "&") : "";
};

const normalize = (value = "") => {
  const clean = strip(value);
  const lower = clean.toLowerCase();
  if (!clean) return "Basic Science";
  if (lower === "at" || lower.includes("assistive")) return "Assistive Technologies";
  if (lower === "ct and stem" || lower === "ct" || lower.includes("computational")) return "Computational Thinking (CT)";
  if (lower === "math" || lower === "maths" || lower.includes("mathematics")) return "Maths";
  if (lower.includes("basic science")) return "Basic Science";
  return clean;
};

const defaultUses = (subject, name) => {
  const lower = `${subject} ${name}`.toLowerCase();
  if (lower.includes("computational") || lower.includes("ct")) return "Accessible computational thinking resource for algorithms, patterns, decomposition, or logic.";
  if (lower.includes("math") || lower.includes("geometry") || lower.includes("graph")) return "Accessible maths resource for tactile number, geometry, measurement, or reasoning practice.";
  if (lower.includes("book")) return "Reference material for accessible reading and concept reinforcement.";
  if (lower.includes("biology")) return "Accessible model or material for tactile biology exploration.";
  if (lower.includes("chemistry")) return "Accessible chemistry material for measurement, observation, or experiment setup.";
  if (lower.includes("physics")) return "Accessible physics apparatus for hands-on concept demonstration.";
  if (lower.includes("assistive")) return "Assistive technology resource for accessible STEM participation.";
  return "Accessible STEM lab resource for hands-on learning.";
};

const rows = raw.data.slice(1);
const items = rows.map((row, index) => {
  const subject = normalize(row[0]);
  const name = strip(row[1]);
  return {
    id: `res-${String(index + 1).padStart(3, "0")}`,
    subject,
    name,
    image: href(row[2]),
    video: href(row[3]),
    supplier: strip(row[4]).replace(/^-$/, ""),
    uses: defaultUses(subject, name),
    tags: []
  };
}).filter((item) => item.name);

fs.writeFileSync(resourcesTarget, `window.ARC_RESOURCES = ${JSON.stringify(items, null, 2)};\n`);

console.log(JSON.stringify({
  sourceRows: rows.length,
  resources: items.length,
  categories: [...new Set(items.map((item) => item.subject))].sort()
}, null, 2));
