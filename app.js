const STORAGE_KEY = "veStemLabData.v1";
const resourceCategories = [
  "Computational Thinking (CT)",
  "Basic Science",
  "Maths",
  "Biology",
  "Physics",
  "Chemistry",
  "Assistive Technologies Use",
  "Books",
  "Hardware assets"
];
const manualSubjects = [
  "Basic Science",
  "Maths",
  "Biology",
  "Physics",
  "Chemistry",
  "Assistive Technologies Use"
];

const seedResources = [
  { subject: "Assistive Technologies Use", name: "IRIS", image: "", video: "https://youtu.be/SCD1m5F9iDs", supplier: "Vembi Tech", uses: "Assistive technology resource for accessible reading and learning support." },
  { subject: "Assistive Technologies Use", name: "Annie", image: "", video: "", supplier: "Thinkerbell", uses: "Braille literacy and independent practice for early learners." },
  { subject: "Assistive Technologies Use", name: "Eklavya Keyboard", image: "", video: "", supplier: "Innovation hub", uses: "Keyboard access and digital literacy practice." },
  { subject: "Computational Thinking (CT)", name: "Tactile flowchart kit", image: "", video: "", supplier: "Vision Empower", uses: "Build and trace algorithms, sequences, loops, and conditionals through touch." },
  { subject: "Basic Science", name: "Observation tray", image: "", video: "", supplier: "Vision Empower", uses: "Organize materials for safe multisensory observation and comparison." },
  { subject: "Maths", name: "Tactile geometry set", image: "", video: "", supplier: "Vision Empower", uses: "Explore shapes, angles, symmetry, perimeter, and area accessibly." },
  { subject: "Biology", name: "Amoeba", image: "https://visionempowertrust.org/arc/wp-content/uploads/Amoeba.webp", video: "", supplier: "Labkafe", uses: "Tactile exploration of unicellular organisms and cell structure." },
  { subject: "Biology", name: "Animal cell", image: "https://visionempowertrust.org/arc/wp-content/uploads/Animal-Cell.jpeg", video: "", supplier: "Labkafe", uses: "Identify cell organelles through a touchable model." },
  { subject: "Biology", name: "DNA model", image: "https://visionempowertrust.org/arc/wp-content/uploads/DNA.webp", video: "", supplier: "Labkafe", uses: "Demonstrate double helix structure and base-pair arrangement." },
  { subject: "Biology", name: "Human brain", image: "https://visionempowertrust.org/arc/wp-content/uploads/Human-brain.webp", video: "", supplier: "Labkafe", uses: "Understand major brain regions with tactile orientation." },
  { subject: "Biology", name: "Human heart", image: "https://visionempowertrust.org/arc/wp-content/uploads/Human-Heart.webp", video: "", supplier: "Labkafe", uses: "Trace chambers, valves, and blood-flow pathways." },
  { subject: "Biology", name: "Human eye", image: "https://visionempowertrust.org/arc/wp-content/uploads/Human-eye.webp", video: "", supplier: "Labkafe", uses: "Study eye parts and connect them to vision concepts." },
  { subject: "Biology", name: "Human Skeleton system", image: "https://visionempowertrust.org/arc/wp-content/uploads/Human-Skeleton-system.webp", video: "", supplier: "BSW", uses: "Learn bone structure, joints, and body support." },
  { subject: "Biology", name: "Neuron model", image: "https://visionempowertrust.org/arc/wp-content/uploads/Neuron.jpeg", video: "https://youtu.be/vy0s6aEOEfg", supplier: "Labkafe", uses: "Explore neuron parts and signal transmission." },
  { subject: "Biology", name: "Plant cell", image: "https://visionempowertrust.org/arc/wp-content/uploads/Plant-Cell.jpeg", video: "", supplier: "Labkafe", uses: "Compare plant and animal cells through tactile features." },
  { subject: "Chemistry", name: "Analytical funnel", image: "https://visionempowertrust.org/arc/wp-content/uploads/Analytical-funnel.webp", video: "", supplier: "Labkafe", uses: "Pour liquids safely and discuss filtration setups." },
  { subject: "Chemistry", name: "Atomic model", image: "https://visionempowertrust.org/arc/wp-content/uploads/atomic-model.webp", video: "", supplier: "Labkafe", uses: "Represent atoms, shells, and bonding ideas in 3D." },
  { subject: "Chemistry", name: "Beaker 100 ml", image: "https://visionempowertrust.org/arc/wp-content/uploads/Beaker-100-ml.webp", video: "", supplier: "Labkafe", uses: "Measure, mix, and hold liquids during experiments." },
  { subject: "Chemistry", name: "Interactive Periodic table", image: "https://visionempowertrust.org/arc/wp-content/uploads/interactive-periodic-table.webp", video: "", supplier: "Labkafe", uses: "Navigate elements, groups, and periodic trends accessibly." },
  { subject: "Chemistry", name: "Measuring cylinder", image: "https://visionempowertrust.org/arc/wp-content/uploads/Measuring-cylinder.webp", video: "", supplier: "Labkafe", uses: "Practice volume measurement and meniscus concepts." },
  { subject: "Chemistry", name: "Microlit Lab Micropipette", image: "https://visionempowertrust.org/arc/wp-content/uploads/Microlit-Lab-Micropipette.webp", video: "https://youtu.be/KiNNHbiVVyQ", supplier: "Microlit", uses: "Transfer small liquid volumes with controlled precision." },
  { subject: "Physics", name: "Resonance Bar", image: "https://visionempowertrust.org/arc/wp-content/uploads/Resonance-Bar.webp", video: "https://youtu.be/UtpMtJAI8jM?si=Cn4l--VNiykBXC1b", supplier: "Kallingal Distributors", uses: "Demonstrate resonance and vibration behavior." },
  { subject: "Physics", name: "See Saw", image: "https://visionempowertrust.org/arc/wp-content/uploads/See-%E2%80%93-Saw.webp", video: "https://youtu.be/pJN4_7mADEU?si=8Vuuq6iUZOlxAAM4", supplier: "Kallingal Distributors", uses: "Explore levers, balance, torque, and fulcrum position." },
  { subject: "Physics", name: "Simple Pendulum", image: "https://visionempowertrust.org/arc/wp-content/uploads/Simple-Pendulum.webp", video: "", supplier: "Kallingal Distributors", uses: "Observe oscillation, period, length, and gravity effects." },
  { subject: "Physics", name: "Solar system", image: "https://visionempowertrust.org/arc/wp-content/uploads/solar-system.webp", video: "", supplier: "Bharath scientific world", uses: "Understand planetary order, scale, and orbital ideas." },
  { subject: "Physics", name: "Sprinkler", image: "https://visionempowertrust.org/arc/wp-content/uploads/Sprinkler.webp", video: "https://youtu.be/1gNJjv2-mYU?si=DDu0OUKBQBjP_9j4", supplier: "Kallingal Distributors", uses: "Connect rotation to fluid pressure and Newton's laws." },
  { subject: "Physics", name: "Static Inertia", image: "https://visionempowertrust.org/arc/wp-content/uploads/Static-Inertia.webp", video: "https://youtu.be/pdLY8E3y-gc?si=0Nt7Ij0SD8Fo-koD", supplier: "Kallingal Distributors", uses: "Demonstrate inertia and resistance to change in motion." },
  { subject: "Physics", name: "Thermal Expansion (Gas)", image: "https://visionempowertrust.org/arc/wp-content/uploads/Thermal-Expansion-Gas.webp", video: "https://youtu.be/R8plkCBPbBU?si=VLGEq_t7b4YsNs8-", supplier: "Kallingal Distributors", uses: "Observe gas expansion when heated." },
  { subject: "Physics", name: "Water Maintains Level", image: "", video: "https://youtu.be/nt4lMJDQbGM?si=d8eu4huhgDzM8N4Q", supplier: "Kallingal Distributors", uses: "Show communicating vessels and equal liquid levels." }
].map((resource) => ({
  id: makeId("res"),
  tags: [],
  ...resource
}));

let state = loadState();

const resourceList = document.querySelector("#resource-list");
const manualList = document.querySelector("#manual-list");
const resourceForm = document.querySelector("#resource-form");
const manualForm = document.querySelector("#manual-form");
const importForm = document.querySelector("#import-form");
const resourceDialog = document.querySelector("#resource-dialog");
const manualDialog = document.querySelector("#manual-dialog");
const importDialog = document.querySelector("#import-dialog");

document.querySelectorAll("[data-view-button]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.viewButton));
});

document.querySelector("[data-open-resource-form]").addEventListener("click", () => openResourceForm());
document.querySelector("[data-open-manual-form]").addEventListener("click", () => openManualForm());
document.querySelector("[data-open-import]").addEventListener("click", () => importDialog.showModal());
document.querySelector("[data-reset-seed]").addEventListener("click", resetSeed);
document.querySelector("#resource-search").addEventListener("input", render);
document.querySelector("#subject-filter").addEventListener("change", render);
document.querySelector("#media-filter").addEventListener("change", render);
document.querySelector("#manual-search").addEventListener("input", render);
document.querySelector("#concept-filter").addEventListener("input", render);
document.querySelector("#manual-subject-filter").addEventListener("change", render);
document.querySelector("#manual-subject").addEventListener("change", () => {
  renderManualResourcePicker([], manualForm.elements.subject.value);
});
document.querySelector("#json-import").addEventListener("change", importJson);

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});

document.querySelectorAll("[data-export]").forEach((button) => {
  button.addEventListener("click", () => exportJson(button.dataset.export));
});

resourceForm.addEventListener("submit", saveResource);
manualForm.addEventListener("submit", saveManual);
importForm.addEventListener("submit", importArcHtml);

render();

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed.resources) && Array.isArray(parsed.manuals)) {
        return migrateState(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return {
    resources: seedResources,
    manuals: [
      {
        id: makeId("man"),
        name: "Exploring balance with a see saw",
        subject: "Physics",
        objective: "Understand how distance from the fulcrum changes balance.",
        resourceIds: seedResources.filter((item) => item.name === "See Saw").map((item) => item.id),
        otherResources: "Equal weights, string, and a stable table surface.",
        steps: "Place equal weights on both sides. Move one weight closer to the fulcrum. Move the other weight farther away. Compare the balance after each change.",
        observations: "The side farther from the fulcrum can go down even with the same weight.",
        inferences: "Balance depends on both weight and distance from the fulcrum.",
        concepts: "TIK: lever, fulcrum, torque, balance"
      }
    ]
  };
}

function migrateState(parsed) {
  return {
    resources: parsed.resources.map((resource) => ({
      ...resource,
      subject: normalizeResourceCategory(resource.subject)
    })),
    manuals: parsed.manuals.map((manual) => ({
      subject: "Basic Science",
      otherResources: "",
      ...manual
    }))
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  renderSubjectOptions();
  renderManualSubjectOptions();
  renderResources();
  renderManuals();
  renderStats();
}

function renderSubjectOptions() {
      const subjects = uniqueSubjects();
  const filter = document.querySelector("#subject-filter");
  const current = filter.value;
  filter.innerHTML = `<option value="all">All categories</option>${subjects.map((subject) => `<option>${escapeHtml(subject)}</option>`).join("")}`;
  filter.value = subjects.includes(current) ? current : "all";

  document.querySelector("#subject-options").innerHTML = subjects.map((subject) => `<option value="${escapeHtml(subject)}"></option>`).join("");
  renderManualResourcePicker([], manualForm.elements.subject?.value);
}

function renderManualSubjectOptions() {
  const filter = document.querySelector("#manual-subject-filter");
  const currentFilter = filter.value;
  filter.innerHTML = `<option value="all">All manual subjects</option>${manualSubjects.map((subject) => `<option>${escapeHtml(subject)}</option>`).join("")}`;
  filter.value = manualSubjects.includes(currentFilter) ? currentFilter : "all";

  const editor = document.querySelector("#manual-subject");
  const currentEditor = editor.value;
  editor.innerHTML = manualSubjects.map((subject) => `<option>${escapeHtml(subject)}</option>`).join("");
  editor.value = manualSubjects.includes(currentEditor) ? currentEditor : manualSubjects[0];
}

function renderManualResourcePicker(selectedIds = [], manualSubject = manualSubjects[0]) {
  const picker = document.querySelector("#manual-resource-picker");
  const selectedSet = new Set(selectedIds);
  const resources = sortedResources().filter((resource) => (
    selectedSet.has(resource.id) || resourceMatchesManualSubject(resource, manualSubject)
  ));
  picker.innerHTML = resources
    .map((resource) => `<option value="${resource.id}" ${selectedIds.includes(resource.id) ? "selected" : ""}>${escapeHtml(resource.name)} (${escapeHtml(resource.subject)})</option>`)
    .join("");
  if (!resources.length) {
    picker.innerHTML = `<option disabled>No matching accessible resources yet</option>`;
  }
}

function renderResources() {
  const query = document.querySelector("#resource-search").value.trim().toLowerCase();
  const subject = document.querySelector("#subject-filter").value;
  const media = document.querySelector("#media-filter").value;
  const resources = sortedResources().filter((resource) => {
    const text = `${resource.name} ${resource.subject} ${resource.uses} ${resource.supplier} ${(resource.tags || []).join(" ")}`.toLowerCase();
    const matchesQuery = !query || text.includes(query);
    const matchesSubject = subject === "all" || resource.subject === subject;
    const matchesMedia =
      media === "all" ||
      (media === "image" && resource.image) ||
      (media === "video" && resource.video) ||
      (media === "both" && resource.image && resource.video);
    return matchesQuery && matchesSubject && matchesMedia;
  });

  resourceList.innerHTML = resources.length
    ? resources.map(resourceCard).join("")
    : `<div class="empty-state">No resources match the current filters.</div>`;

  resourceList.querySelectorAll("[data-edit-resource]").forEach((button) => {
    button.addEventListener("click", () => openResourceForm(button.dataset.editResource));
  });
  resourceList.querySelectorAll("[data-delete-resource]").forEach((button) => {
    button.addEventListener("click", () => deleteResource(button.dataset.deleteResource));
  });
  resourceList.querySelectorAll("[data-toggle-resource-details]").forEach((button) => {
    button.addEventListener("click", () => toggleResourceDetails(button));
  });
}

function resourceCard(resource) {
  const tags = [resource.subject, ...(resource.tags || [])].filter(Boolean);
  const detailsId = `resource-details-${resource.id}`;
  return `
    <article class="resource-card" id="resource-${resource.id}">
      <div class="resource-media">
        ${resource.image ? `<img src="${escapeAttribute(resource.image)}" alt="${escapeAttribute(resource.name)}">` : `<div class="placeholder">No picture yet</div>`}
      </div>
      <div class="card-body">
        <dl class="resource-facts">
          <div>
            <dt>Category</dt>
            <dd>${escapeHtml(resource.subject || "Uncategorized")}</dd>
          </div>
          <div>
            <dt>Item Name</dt>
            <dd><h3>${escapeHtml(resource.name)}</h3></dd>
          </div>
          <div>
            <dt>Uses</dt>
            <dd>${escapeHtml(resource.uses || "Uses not documented yet.")}</dd>
          </div>
        </dl>
        <div class="resource-details">
          <button type="button" class="details-toggle" data-toggle-resource-details aria-expanded="false" aria-controls="${detailsId}">Show Details</button>
          <div class="details-body" id="${detailsId}" hidden>
            <p><strong>Supplier:</strong> ${escapeHtml(resource.supplier || "Supplier not listed")}</p>
            <div class="badge-row">${tags.map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join("")}</div>
            <div class="card-actions">
              ${resource.video ? `<a href="${escapeAttribute(resource.video)}" target="_blank" rel="noreferrer">Video</a>` : ""}
              ${resource.image ? `<a href="${escapeAttribute(resource.image)}" target="_blank" rel="noreferrer">Open image</a>` : ""}
              <button type="button" data-edit-resource="${resource.id}">Edit</button>
              <button class="danger" type="button" data-delete-resource="${resource.id}">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

function toggleResourceDetails(button) {
  const target = document.getElementById(button.getAttribute("aria-controls"));
  if (!target) return;
  const expanded = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!expanded));
  button.textContent = expanded ? "Show Details" : "Hide Details";
  target.hidden = expanded;
}

function renderManuals() {
  const query = document.querySelector("#manual-search").value.trim().toLowerCase();
  const concept = document.querySelector("#concept-filter").value.trim().toLowerCase();
  const subject = document.querySelector("#manual-subject-filter").value;
  const manuals = [...state.manuals]
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((manual) => {
      const resources = resourcesForManual(manual).map((resource) => resource.name).join(" ");
      const text = `${manual.name} ${manual.subject} ${manual.objective} ${manual.otherResources} ${manual.steps} ${manual.observations} ${manual.inferences} ${manual.concepts} ${resources}`.toLowerCase();
      return (!query || text.includes(query)) &&
        (!concept || (manual.concepts || "").toLowerCase().includes(concept)) &&
        (subject === "all" || manual.subject === subject);
    });

  manualList.innerHTML = manuals.length
    ? manuals.map(manualCard).join("")
    : `<div class="empty-state">No manuals yet. Add a manual to document an activity or experiment.</div>`;

  manualList.querySelectorAll("[data-edit-manual]").forEach((button) => {
    button.addEventListener("click", () => openManualForm(button.dataset.editManual));
  });
  manualList.querySelectorAll("[data-delete-manual]").forEach((button) => {
    button.addEventListener("click", () => deleteManual(button.dataset.deleteManual));
  });
  manualList.querySelectorAll("[data-resource-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      focusResource(link.dataset.resourceLink);
    });
  });
}

function manualCard(manual) {
  const resources = resourcesForManual(manual);
  return `
    <article class="manual-card">
      <div>
        <h3>${escapeHtml(manual.name)}</h3>
        <p class="meta">${escapeHtml(manual.subject || "Subject not set")} · ${resources.length} linked resource${resources.length === 1 ? "" : "s"}</p>
      </div>
      ${manualSection("Objective: What we have to do?", manual.objective)}
      ${manualResourcesSection(resources, manual.otherResources)}
      ${manualSection("Steps: How do we proceed?", manual.steps)}
      ${manualSection("Observations: What do we observe?", manual.observations)}
      ${manualSection("Inferences: What do we conclude?", manual.inferences)}
      ${manualSection("Concepts: (TIK)", manual.concepts)}
      <div class="card-actions">
        <button type="button" data-edit-manual="${manual.id}">Edit</button>
        <button class="danger" type="button" data-delete-manual="${manual.id}">Delete</button>
      </div>
    </article>
  `;
}

function manualResourcesSection(resources, otherResources) {
  const linkedResources = resources.length
    ? `<ul class="resource-links">${resources.map((resource) => `<li><a href="#resource-${resource.id}" data-resource-link="${resource.id}">${escapeHtml(resource.name)}</a></li>`).join("")}</ul>`
    : `<p>No accessible catalogue resources selected.</p>`;
  const other = otherResources ? `<p><strong>Other resources:</strong> ${escapeHtml(otherResources)}</p>` : "";
  return `
    <section class="manual-section">
      <h4>Resources: What do we need?</h4>
      ${linkedResources}
      ${other}
    </section>
  `;
}

function manualSection(title, value) {
  return `
    <section class="manual-section">
      <h4>${escapeHtml(title)}</h4>
      <p>${escapeHtml(value || "Not documented yet.")}</p>
    </section>
  `;
}

function renderStats() {
  document.querySelector("#resource-count").textContent = state.resources.length;
  document.querySelector("#subject-count").textContent = uniqueSubjects().length;
  const used = new Set(state.manuals.flatMap((manual) => manual.resourceIds || []));
  document.querySelector("#manual-linked-count").textContent = used.size;
}

function openResourceForm(id) {
  const resource = state.resources.find((item) => item.id === id);
  resourceForm.reset();
  resourceForm.elements.id.value = resource?.id || "";
  resourceForm.elements.name.value = resource?.name || "";
  resourceForm.elements.subject.value = resource?.subject || "";
  resourceForm.elements.image.value = resource?.image || "";
  resourceForm.elements.video.value = resource?.video || "";
  resourceForm.elements.uses.value = resource?.uses || "";
  resourceForm.elements.supplier.value = resource?.supplier || "";
  resourceForm.elements.tags.value = (resource?.tags || []).join(", ");
  document.querySelector("#resource-dialog-title").textContent = resource ? "Edit resource" : "Add resource";
  resourceDialog.showModal();
}

function saveResource(event) {
  event.preventDefault();
  const form = new FormData(resourceForm);
  const id = form.get("id") || makeId("res");
  const resource = {
    id,
    name: form.get("name").trim(),
    subject: normalizeResourceCategory(form.get("subject")),
    image: form.get("image").trim(),
    video: form.get("video").trim(),
    uses: form.get("uses").trim(),
    supplier: form.get("supplier").trim(),
    tags: form.get("tags").split(",").map((tag) => tag.trim()).filter(Boolean)
  };
  const index = state.resources.findIndex((item) => item.id === id);
  if (index >= 0) state.resources[index] = resource;
  else state.resources.push(resource);
  persist();
  resourceDialog.close();
  toast("Resource saved");
  render();
}

function deleteResource(id) {
  const resource = state.resources.find((item) => item.id === id);
  if (!resource || !confirm(`Delete ${resource.name}? Manuals will keep running, but this resource link will be removed.`)) return;
  state.resources = state.resources.filter((item) => item.id !== id);
  state.manuals = state.manuals.map((manual) => ({
    ...manual,
    resourceIds: (manual.resourceIds || []).filter((resourceId) => resourceId !== id)
  }));
  persist();
  toast("Resource deleted");
  render();
}

function openManualForm(id) {
  const manual = state.manuals.find((item) => item.id === id);
  manualForm.reset();
  manualForm.elements.id.value = manual?.id || "";
  manualForm.elements.name.value = manual?.name || "";
  manualForm.elements.subject.value = manual?.subject || "Basic Science";
  manualForm.elements.objective.value = manual?.objective || "";
  manualForm.elements.otherResources.value = manual?.otherResources || "";
  manualForm.elements.steps.value = manual?.steps || "";
  manualForm.elements.observations.value = manual?.observations || "";
  manualForm.elements.inferences.value = manual?.inferences || "";
  manualForm.elements.concepts.value = manual?.concepts || "";
  renderManualResourcePicker(manual?.resourceIds || [], manualForm.elements.subject.value);
  document.querySelector("#manual-dialog-title").textContent = manual ? "Edit manual" : "Add manual";
  manualDialog.showModal();
}

function saveManual(event) {
  event.preventDefault();
  const form = new FormData(manualForm);
  const id = form.get("id") || makeId("man");
  const resourceIds = [...manualForm.elements.resourceIds.selectedOptions].map((option) => option.value);
  const manual = {
    id,
    name: form.get("name").trim(),
    subject: form.get("subject"),
    objective: form.get("objective").trim(),
    resourceIds,
    otherResources: form.get("otherResources").trim(),
    steps: form.get("steps").trim(),
    observations: form.get("observations").trim(),
    inferences: form.get("inferences").trim(),
    concepts: form.get("concepts").trim()
  };
  const index = state.manuals.findIndex((item) => item.id === id);
  if (index >= 0) state.manuals[index] = manual;
  else state.manuals.push(manual);
  persist();
  manualDialog.close();
  toast("Manual saved");
  render();
}

function deleteManual(id) {
  const manual = state.manuals.find((item) => item.id === id);
  if (!manual || !confirm(`Delete ${manual.name}?`)) return;
  state.manuals = state.manuals.filter((item) => item.id !== id);
  persist();
  toast("Manual deleted");
  render();
}

function importArcHtml(event) {
  event.preventDefault();
  const html = new FormData(importForm).get("html");
  const resources = parseArcTable(html);
  if (!resources.length) {
    toast("No ARC rows found");
    return;
  }

  mergeResources(resources);
  persist();
  importDialog.close();
  importForm.reset();
  toast(`${resources.length} resources imported`);
  render();
}

function parseArcTable(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return [...doc.querySelectorAll("tr")]
    .map((row) => {
      const cells = [...row.querySelectorAll("td")];
      if (cells.length < 5) return null;
      const image = cells[2].querySelector("a")?.href || "";
      const video = cells[3].querySelector("a")?.href || "";
      const name = cells[1].textContent.trim();
      if (!name) return null;
      return {
        id: makeId("res"),
        subject: normalizeResourceCategory(cells[0].textContent.trim()),
        name,
        image,
        video,
        supplier: cells[4].textContent.trim(),
        uses: defaultUses(cells[0].textContent.trim(), name),
        tags: []
      };
    })
    .filter(Boolean);
}

function importJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (Array.isArray(parsed.resources)) mergeResources(parsed.resources);
      if (Array.isArray(parsed.manuals)) state.manuals = dedupeByName([...state.manuals, ...parsed.manuals], "manual");
      if (Array.isArray(parsed) && parsed.every((item) => item.name)) mergeResources(parsed);
      persist();
      toast("JSON imported");
      render();
    } catch {
      toast("Could not read JSON");
    } finally {
      event.target.value = "";
    }
  });
  reader.readAsText(file);
}

function exportJson(type) {
  const payload = type === "resources" ? { resources: state.resources } : { manuals: state.manuals };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `ve-stem-lab-${type}.json`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
  toast(`${type} exported`);
}

function resetSeed() {
  if (!confirm("Reload starter seed resources? Existing resources with the same name and subject will be updated.")) return;
  mergeResources(seedResources.map((resource) => ({ ...resource, id: makeId("res") })));
  persist();
  toast("Starter seed loaded");
  render();
}

function mergeResources(resources) {
  const normalized = resources.map((resource) => ({
    id: resource.id || makeId("res"),
    subject: normalizeResourceCategory(resource.subject || "Basic Science"),
    name: resource.name || "Untitled resource",
    image: resource.image || "",
    video: resource.video || "",
    supplier: resource.supplier || "",
    uses: resource.uses || defaultUses(resource.subject, resource.name),
    tags: Array.isArray(resource.tags) ? resource.tags : []
  }));
  state.resources = dedupeByName([...state.resources, ...normalized], "resource");
}

function dedupeByName(items, prefix) {
  const map = new Map();
  items.forEach((item) => {
    const key = `${(item.subject || "").toLowerCase()}::${(item.name || "").toLowerCase()}`;
    map.set(key, { ...item, id: item.id || makeId(prefix) });
  });
  return [...map.values()];
}

function setView(view) {
  document.querySelectorAll("[data-view-button]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewButton === view);
  });
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("is-active", section.id === `${view}-view`);
  });
}

function focusResource(id) {
  setView("resources");
  document.querySelector("#resource-search").value = "";
  document.querySelector("#subject-filter").value = "all";
  document.querySelector("#media-filter").value = "all";
  renderResources();
  const card = document.querySelector(`#resource-${CSS.escape(id)}`);
  if (!card) return;
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.classList.add("is-highlighted");
  setTimeout(() => card.classList.remove("is-highlighted"), 2200);
}

function sortedResources() {
  return [...state.resources].sort((a, b) => a.subject.localeCompare(b.subject) || a.name.localeCompare(b.name));
}

function uniqueSubjects() {
  return [...new Set([...resourceCategories, ...state.resources.map((resource) => normalizeResourceCategory(resource.subject)).filter(Boolean)])].sort();
}

function resourceMatchesManualSubject(resource, manualSubject) {
  const resourceSubject = normalizeResourceCategory(resource.subject || "").toLowerCase();
  const resourceTags = (resource.tags || []).join(" ").toLowerCase();
  const text = `${resourceSubject} ${resourceTags}`;
  if (manualSubject === "Assistive Technologies Use") {
    return text.includes("assistive");
  }
  if (manualSubject === "Maths") {
    return text.includes("math");
  }
  if (manualSubject === "Basic Science") {
    return ["biology", "physics", "chemistry", "basic science", "computational thinking"].some((subject) => text.includes(subject));
  }
  return resourceSubject === manualSubject.toLowerCase();
}

function normalizeResourceCategory(subject = "") {
  const value = String(subject).trim();
  const lower = value.toLowerCase();
  if (!value) return "Basic Science";
  if (lower === "at" || lower.includes("assistive")) return "Assistive Technologies Use";
  if (lower === "ct and stem" || lower.includes("computational") || lower === "ct") return "Computational Thinking (CT)";
  if (lower === "math" || lower === "maths" || lower.includes("mathematics")) return "Maths";
  if (lower.includes("basic science")) return "Basic Science";
  const canonical = resourceCategories.find((category) => category.toLowerCase() === lower);
  return canonical || value;
}

function resourcesForManual(manual) {
  const ids = new Set(manual.resourceIds || []);
  return state.resources.filter((resource) => ids.has(resource.id));
}

function defaultUses(subject = "", name = "") {
  const lower = `${subject} ${name}`.toLowerCase();
  if (lower.includes("computational") || lower.includes("ct")) return "Accessible computational thinking resource for algorithms, patterns, decomposition, or logic.";
  if (lower.includes("math")) return "Accessible maths resource for tactile number, geometry, measurement, or reasoning practice.";
  if (lower.includes("basic science")) return "Accessible basic science material for observation, comparison, and hands-on inquiry.";
  if (lower.includes("biology")) return "Accessible model or material for tactile biology exploration.";
  if (lower.includes("chemistry")) return "Accessible chemistry material for measurement, observation, or experiment setup.";
  if (lower.includes("physics")) return "Accessible physics apparatus for hands-on concept demonstration.";
  if (lower.includes("book")) return "Reference material for accessible reading and concept reinforcement.";
  if (lower.includes("at")) return "Assistive technology resource for accessible STEM participation.";
  return "Accessible STEM lab resource for hands-on learning.";
}

function makeId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function toast(message) {
  const target = document.querySelector("#toast");
  target.textContent = message;
  clearTimeout(toast.timeout);
  toast.timeout = setTimeout(() => {
    target.textContent = "";
  }, 3000);
}
