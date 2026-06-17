const STORAGE_KEY = "veStemLabData.v2";
const resourceCategories = [
  "Computational Thinking (CT)",
  "Basic Science",
  "Maths",
  "Biology",
  "Physics",
  "Chemistry",
  "Assistive Technologies",
  "Books",
  "Hardware assets"
];
const manualSubjects = [
  "Basic Science",
  "Maths",
  "Biology",
  "Physics",
  "Chemistry",
  "Assistive Technologies"
];

const fallbackResources = [
  { id: "res-fallback-1", subject: "Assistive Technologies", name: "Annie", image: "", video: "", supplier: "Thinkerbell", uses: "Braille literacy and independent practice for early learners.", tags: [] },
  { id: "res-fallback-2", subject: "Physics", name: "See Saw", image: "https://visionempowertrust.org/arc/wp-content/uploads/See-%E2%80%93-Saw.webp", video: "https://youtu.be/pJN4_7mADEU?si=8Vuuq6iUZOlxAAM4", supplier: "Kallingal Distributors", uses: "Explore levers, balance, torque, and fulcrum position.", tags: [] }
];
const registryResources = Array.isArray(window.ARC_RESOURCES) ? window.ARC_RESOURCES : fallbackResources;
const seedResources = registryResources.map((resource, index) => ({
  id: resource.id || makeId("res"),
  tags: [],
  ...resource,
  subject: normalizeResourceCategory(resource.subject),
  uses: resource.uses || defaultUses(resource.subject, resource.name),
  sortOrder: index
}));

let state = loadState();

const resourceList = document.querySelector("#resource-list");
const manualList = document.querySelector("#manual-list");
const resourceForm = document.querySelector("#resource-form");
const manualForm = document.querySelector("#manual-form");
const importForm = document.querySelector("#import-form");
const resourceDialog = document.querySelector("#resource-dialog");
const resourceDetailsDialog = document.querySelector("#resource-details-dialog");
const manualDialog = document.querySelector("#manual-dialog");
const manualDetailsDialog = document.querySelector("#manual-details-dialog");
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
    manuals: seedManuals(seedResources)
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

function seedManuals(resources) {
  const pick = (...needles) => resources
    .filter((resource) => needles.some((needle) => resource.name.toLowerCase().includes(needle.toLowerCase())))
    .map((resource) => resource.id);

  return [
    {
      id: "manual-lever-balance",
      subject: "Physics",
      name: "Balance and levers with a see saw",
      objective: "Explore how distance from the fulcrum changes balance.",
      resourceIds: pick("See Saw", "Lever System"),
      otherResources: "Equal weights, tactile markers, and a stable table surface.",
      steps: "Place equal weights on both sides of the see saw. Move one weight closer to the fulcrum. Move the other weight farther away. Compare how each position changes balance.",
      observations: "The side farther from the fulcrum can go down even when the weights are equal.",
      inferences: "A lever balances based on both weight and distance from the fulcrum.",
      concepts: "TIK: lever, fulcrum, force, distance, torque"
    },
    {
      id: "manual-pendulum-motion",
      subject: "Physics",
      name: "Counting swings with a simple pendulum",
      objective: "Observe periodic motion and compare swing time for different lengths.",
      resourceIds: pick("Simple Pendulum"),
      otherResources: "Stopwatch or talking timer.",
      steps: "Set the pendulum to a short length and count ten swings. Repeat with a longer length. Keep the release angle small each time.",
      observations: "The longer pendulum takes more time for the same number of swings.",
      inferences: "The time period of a pendulum depends mainly on its length.",
      concepts: "TIK: periodic motion, time period, length, fair test"
    },
    {
      id: "manual-circuit-path",
      subject: "Physics",
      name: "Tracing a closed electric circuit",
      objective: "Identify the path needed for current to flow in a simple circuit.",
      resourceIds: pick("Circuit board", "Electrical bell model", "Conductivity"),
      otherResources: "Battery cells and connecting wires if not included in the kit.",
      steps: "Trace each connection by touch. Close the circuit and observe the output. Open one connection and observe what changes.",
      observations: "The output works only when the path is complete.",
      inferences: "Electric current needs a closed conducting path.",
      concepts: "TIK: circuit, conductor, open circuit, closed circuit"
    },
    {
      id: "manual-cell-comparison",
      subject: "Biology",
      name: "Comparing plant and animal cells",
      objective: "Compare the tactile features of plant and animal cells.",
      resourceIds: pick("Plant cell", "Animal cell"),
      otherResources: "Braille labels or tactile sticky markers.",
      steps: "Explore the outline of each model. Locate the nucleus and other major parts. Compare the outer boundary and internal structures.",
      observations: "The plant cell has a more regular outer boundary and distinct features that differ from the animal cell.",
      inferences: "Plant and animal cells share some parts but also have structures that support different functions.",
      concepts: "TIK: cell, organelle, cell wall, nucleus, comparison"
    },
    {
      id: "manual-heart-flow",
      subject: "Biology",
      name: "Tracing blood flow through the heart",
      objective: "Understand the main chambers and direction of blood flow in the heart.",
      resourceIds: pick("Human heart"),
      otherResources: "Tactile arrows or pipe cleaners for marking direction.",
      steps: "Identify the chambers by touch. Place tactile arrows to show the route through the heart. Explain the path aloud in order.",
      observations: "The heart has separate spaces and one-way routes for blood movement.",
      inferences: "The heart pumps blood in an organized path through chambers and vessels.",
      concepts: "TIK: chamber, valve, blood flow, circulation, sequence"
    },
    {
      id: "manual-eye-parts",
      subject: "Biology",
      name: "Identifying parts of the human eye",
      objective: "Recognize the major parts of the eye and connect each part to its function.",
      resourceIds: pick("Human eye"),
      otherResources: "Braille labels for cornea, lens, retina, and optic nerve.",
      steps: "Explore the model from front to back. Label each major part. Discuss how light travels through the parts.",
      observations: "The eye has curved, layered parts arranged in a clear order.",
      inferences: "Each part of the eye has a role in focusing light and sending information to the brain.",
      concepts: "TIK: lens, retina, optic nerve, light, function"
    },
    {
      id: "manual-measuring-volume",
      subject: "Chemistry",
      name: "Measuring liquid volume",
      objective: "Practice choosing and using common lab containers for volume measurement.",
      resourceIds: pick("Measuring cylinder", "Beaker 100 ml", "Beaker 250 ml", "Analytical funnel"),
      otherResources: "Water and a tray to catch spills.",
      steps: "Explore the shape of each container. Pour water into the beaker. Transfer it to the measuring cylinder. Compare approximate and measured volume.",
      observations: "A beaker is useful for holding liquid, while the measuring cylinder gives a clearer volume reading.",
      inferences: "Different lab containers are designed for different levels of measurement accuracy.",
      concepts: "TIK: volume, measurement, apparatus, accuracy"
    },
    {
      id: "manual-atomic-structure",
      subject: "Chemistry",
      name: "Building an atom model",
      objective: "Use a tactile model to identify nucleus, electrons, and shells.",
      resourceIds: pick("Atomic model", "Interactive Periodic table"),
      otherResources: "Small tactile counters for protons, neutrons, and electrons.",
      steps: "Explore the atomic model. Identify the center and outer shells. Use the periodic table to choose an element and represent its particles.",
      observations: "Particles are arranged in a central nucleus and outer regions.",
      inferences: "Atoms have internal structure, and different elements have different particle counts.",
      concepts: "TIK: atom, nucleus, electron, shell, element"
    },
    {
      id: "manual-geometry-shapes",
      subject: "Maths",
      name: "Exploring tactile geometry",
      objective: "Identify shapes and compare sides, corners, and symmetry.",
      resourceIds: pick("Tactile Mathematics Primer", "Encyclopedia of Geometry", "DIY Kit for graphs"),
      otherResources: "String, tactile graph sheet, or raised-line drawing board.",
      steps: "Choose two shapes from the tactile material. Count sides and corners. Fold or trace a line of symmetry where possible. Compare the shapes.",
      observations: "Shapes can be identified by the number of sides, corners, and symmetry lines.",
      inferences: "Geometry properties help classify and describe shapes.",
      concepts: "TIK: shape, side, corner, symmetry, classification"
    },
    {
      id: "manual-graph-reading",
      subject: "Maths",
      name: "Reading a tactile graph",
      objective: "Interpret a simple raised-line graph using axes and plotted points.",
      resourceIds: pick("DIY Kit for graphs", "Tactile Mathematics Primer"),
      otherResources: "Small tactile stickers for marking data points.",
      steps: "Find the x-axis and y-axis. Mark three points. Trace the line or pattern between the points and describe the trend.",
      observations: "The position of each point depends on two values.",
      inferences: "Graphs show relationships between quantities in a compact form.",
      concepts: "TIK: axis, point, value, trend, coordinate"
    },
    {
      id: "manual-assistive-reading",
      subject: "Assistive Technologies",
      name: "Independent reading with assistive technology",
      objective: "Use assistive technology to access written or digital information.",
      resourceIds: pick("Annie", "IRIS", "Uread", "Tactograph"),
      otherResources: "A short grade-level reading passage.",
      steps: "Explore the controls of the device. Load or select the reading material. Read a short section and summarize it aloud.",
      observations: "The learner can access text through braille, audio, or tactile support depending on the tool.",
      inferences: "Assistive technology supports independent access to STEM information.",
      concepts: "TIK: access, independence, braille, audio, digital literacy"
    },
    {
      id: "manual-day-night",
      subject: "Basic Science",
      name: "Modeling day and night",
      objective: "Understand how rotation creates day and night.",
      resourceIds: pick("Day And Night Demonstrator", "Solar system"),
      otherResources: "A lamp or safe light source if the kit needs one.",
      steps: "Identify the Earth model and light source. Rotate the Earth slowly. Notice which side faces the light and which side is away from it.",
      observations: "One side receives light while the opposite side remains away from the light.",
      inferences: "Day and night happen because Earth rotates.",
      concepts: "TIK: rotation, light, shadow, day, night"
    }
  ];
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
    ? resourceTable(resources)
    : `<div class="empty-state">No resources match the current filters.</div>`;

  resourceList.querySelectorAll("[data-edit-resource]").forEach((button) => {
    button.addEventListener("click", () => openResourceForm(button.dataset.editResource));
  });
  resourceList.querySelectorAll("[data-show-resource]").forEach((button) => {
    button.addEventListener("click", () => openResourceDetails(button.dataset.showResource));
  });
}

function resourceTable(resources) {
  return `
    <div class="resource-table-wrap">
      <table class="resource-table">
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Item name</th>
            <th scope="col">Uses</th>
            <th scope="col">Supplier</th>
            <th scope="col">More Actions</th>
          </tr>
        </thead>
        <tbody>
          ${resources.map(resourceRow).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function resourceRow(resource) {
  return `
    <tr id="resource-${resource.id}">
      <td data-label="Category">${escapeHtml(resource.subject || "Uncategorized")}</td>
      <td data-label="Item name"><strong>${escapeHtml(resource.name)}</strong></td>
      <td data-label="Uses">${escapeHtml(resource.uses || "Uses not documented yet.")}</td>
      <td data-label="Supplier">${escapeHtml(resource.supplier || "Supplier not listed")}</td>
      <td data-label="More Actions">
        <div class="table-actions">
          <button type="button" data-show-resource="${resource.id}">Details</button>
          <button type="button" data-edit-resource="${resource.id}">Edit</button>
        </div>
      </td>
    </tr>
  `;
}

function openResourceDetails(id) {
  const resource = state.resources.find((item) => item.id === id);
  if (!resource) return;
  const tags = [resource.subject, ...(resource.tags || [])].filter(Boolean);
  document.querySelector("#resource-details-title").textContent = resource.name;
  document.querySelector("#resource-details-content").innerHTML = `
    <div class="resource-detail-grid">
      <div class="resource-detail-media">
        ${resource.image ? `<img src="${escapeAttribute(resource.image)}" alt="${escapeAttribute(resource.name)}">` : `<div class="placeholder">No image available</div>`}
      </div>
      <div class="resource-detail-copy">
        <p><strong>Category:</strong> ${escapeHtml(resource.subject || "Uncategorized")}</p>
        <p><strong>Item name:</strong> ${escapeHtml(resource.name)}</p>
        <p><strong>Uses:</strong> ${escapeHtml(resource.uses || "Uses not documented yet.")}</p>
        <p><strong>Supplier:</strong> ${escapeHtml(resource.supplier || "Supplier not listed")}</p>
        <div class="badge-row">${tags.map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join("")}</div>
        <div class="card-actions">
          ${resource.video ? `<a href="${escapeAttribute(resource.video)}" target="_blank" rel="noreferrer">Video</a>` : ""}
          ${resource.image ? `<a href="${escapeAttribute(resource.image)}" target="_blank" rel="noreferrer">Open image</a>` : ""}
          <button type="button" data-edit-resource-from-details="${resource.id}">Edit</button>
        </div>
      </div>
    </div>
  `;
  const editButton = document.querySelector("[data-edit-resource-from-details]");
  if (editButton) {
    editButton.addEventListener("click", () => {
      resourceDetailsDialog.close();
      openResourceForm(editButton.dataset.editResourceFromDetails);
    });
  }
  resourceDetailsDialog.showModal();
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
  manualList.querySelectorAll("[data-show-manual]").forEach((button) => {
    button.addEventListener("click", () => openManualDetails(button.dataset.showManual));
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

function manualCard(manual) {
  const resources = resourcesForManual(manual);
  return `
    <article class="manual-card">
      <div class="manual-dashboard-row">
        <div>
          <p class="eyebrow manual-subject-label">${escapeHtml(manual.subject || "Subject not set")}</p>
          <h3>${escapeHtml(manual.name)}</h3>
          <p class="meta">${resources.length} linked resource${resources.length === 1 ? "" : "s"}</p>
        </div>
        <button class="primary" type="button" data-show-manual="${manual.id}">More Details</button>
      </div>
      <div class="card-actions">
        <button type="button" data-edit-manual="${manual.id}">Edit</button>
        <button class="danger" type="button" data-delete-manual="${manual.id}">Delete</button>
      </div>
    </article>
  `;
}

function openManualDetails(id) {
  const manual = state.manuals.find((item) => item.id === id);
  if (!manual) return;
  const resources = resourcesForManual(manual);
  document.querySelector("#manual-details-title").textContent = manual.name;
  document.querySelector("#manual-details-content").innerHTML = `
    <div class="manual-details-summary">
      <p><strong>Subject:</strong> ${escapeHtml(manual.subject || "Subject not set")}</p>
      <p><strong>Topic:</strong> ${escapeHtml(manual.name)}</p>
    </div>
    ${manualSection("Objective: What we have to do?", manual.objective)}
    ${manualResourcesSection(resources, manual.otherResources)}
    ${manualSection("Steps: How do we proceed?", manual.steps)}
    ${manualSection("Observations: What do we observe?", manual.observations)}
    ${manualSection("Inferences: What do we conclude?", manual.inferences)}
    ${manualSection("Concepts: (TIK)", manual.concepts)}
  `;
  document.querySelectorAll("#manual-details-content [data-resource-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      manualDetailsDialog.close();
      focusResource(link.dataset.resourceLink);
    });
  });
  manualDetailsDialog.showModal();
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

function parseRegistryJson(registry) {
  return registry.data.slice(1).map((row, index) => {
    const subject = normalizeResourceCategory(htmlToText(row[0]));
    const name = htmlToText(row[1]);
    return {
      id: `res-import-${Date.now()}-${index}`,
      subject,
      name,
      image: firstHref(row[2]),
      video: firstHref(row[3]),
      supplier: htmlToText(row[4]).replace(/^-$/, ""),
      uses: defaultUses(subject, name),
      tags: []
    };
  }).filter((resource) => resource.name);
}

function htmlToText(value = "") {
  const doc = new DOMParser().parseFromString(String(value), "text/html");
  return doc.body.textContent.trim();
}

function firstHref(value = "") {
  const doc = new DOMParser().parseFromString(String(value), "text/html");
  return doc.querySelector("a")?.href || "";
}

function importJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (Array.isArray(parsed.resources)) mergeResources(parsed.resources);
      if (Array.isArray(parsed.data)) mergeResources(parseRegistryJson(parsed));
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
  const resourceName = (resource.name || "").toLowerCase();
  const text = `${resourceSubject} ${resourceName} ${resourceTags}`;
  if (manualSubject === "Assistive Technologies") {
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
  if (lower === "at" || lower.includes("assistive")) return "Assistive Technologies";
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
