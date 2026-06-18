const STUDENTS_STORAGE_KEY = "veStemLabStudents.v1";
const SESSIONS_STORAGE_KEY = "veStemLabSessions.v1";
const LAB_DATA_STORAGE_KEY = "veStemLabData.v3";
const $ = (selector) => document.querySelector(selector);
const generalRubricLabels = {
  materialHandling: "Material handling",
  safety: "Safety",
  participation: "Participation",
  observationInference: "Observation and inference"
};
const rubricLevelLabels = {
  "4": "Independent",
  "3": "With prompts",
  "2": "Needs support",
  "1": "Not yet"
};

let students = loadArray(STUDENTS_STORAGE_KEY);
let sessions = loadArray(SESSIONS_STORAGE_KEY);
let labData = loadLabSummary();
let dashboardRows = buildDashboardRows();

function loadArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

function loadLabSummary() {
  try {
    const stored = JSON.parse(localStorage.getItem(LAB_DATA_STORAGE_KEY) || "{}");
    if (Array.isArray(stored.resources) && Array.isArray(stored.manuals)) return stored;
  } catch {
    // Fall through to bundled catalogue data.
  }
  return {
    resources: Array.isArray(window.ARC_RESOURCES) ? window.ARC_RESOURCES : [],
    // The catalogue seeds 12 portal activities in addition to the NCERT imports.
    manuals: Array.from({ length: 12 + (Array.isArray(window.NCERT_ACTIVITIES) ? window.NCERT_ACTIVITIES.length : 0) })
  };
}

function buildDashboardRows() {
  const map = new Map();
  students.forEach((student) => {
    const key = studentKey(student.name, student.state, student.school);
    map.set(key, {
      id: key,
      state: student.state || "",
      school: student.school || "",
      name: student.name || "",
      registered: true,
      sessions: []
    });
  });

  sessions.forEach((session) => {
    (session.attendance || []).forEach((student) => {
      const key = studentKey(student.name, session.state, session.school);
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          state: session.state || "",
          school: session.school || "",
          name: student.name || "",
          registered: false,
          sessions: []
        });
      }
      map.get(key).sessions.push({
        date: session.date,
        subject: session.subject,
        activityName: session.activityName,
        facilitator: session.facilitator,
        present: Boolean(student.present),
        performance: performanceSummary(session, student),
        rubric: student.rubric || {},
        conceptRubric: student.conceptRubric || {},
        conceptCriteria: session.conceptCriteria || []
      });
    });
  });

  return [...map.values()].sort((a, b) => (
    a.state.localeCompare(b.state) ||
    a.school.localeCompare(b.school) ||
    a.name.localeCompare(b.name)
  ));
}

function renderFilters() {
  const states = [...new Set(dashboardRows.map((row) => row.state).filter(Boolean))].sort();
  const schools = [...new Set(dashboardRows.map((row) => row.school).filter(Boolean))].sort();
  setOptions($("#dashboard-state-filter"), ["All states", ...states]);
  setOptions($("#dashboard-school-filter"), ["All schools", ...schools]);
}

function setOptions(select, options) {
  select.innerHTML = options.map((option) => `<option>${escapeHtml(option)}</option>`).join("");
}

function renderDashboard() {
  const query = $("#dashboard-search").value.trim().toLowerCase();
  const state = $("#dashboard-state-filter").value;
  const school = $("#dashboard-school-filter").value;
  const rows = dashboardRows.filter((row) => {
    const text = `${row.state} ${row.school} ${row.name}`.toLowerCase();
    return (!query || text.includes(query)) &&
      (state === "All states" || row.state === state) &&
      (school === "All schools" || row.school === school);
  });

  $("#dashboard-row-count").textContent = `${rows.length} record${rows.length === 1 ? "" : "s"}`;
  $("#dashboard-student-count").textContent = dashboardRows.length;
  $("#dashboard-session-count").textContent = sessions.length;
  $("#dashboard-resource-count").textContent = labData.resources.length;
  $("#dashboard-manual-count").textContent = labData.manuals.length;

  if (!rows.length) {
    $("#dashboard-table").innerHTML = '<tr><td colspan="5" class="empty-table-cell">No student records match the current filters.</td></tr>';
    return;
  }

  $("#dashboard-table").innerHTML = rows.map((row) => `
    <tr>
      <td data-label="State">${escapeHtml(row.state || "Not set")}</td>
      <td data-label="School">${escapeHtml(row.school || "Not set")}</td>
      <td data-label="Student name"><strong>${escapeHtml(row.name)}</strong>${row.registered ? "" : ' <span class="badge">session entry</span>'}</td>
      <td data-label="Lab sessions attended">${attendedCount(row)}</td>
      <td data-label="More Details">
        <button type="button" data-student-details="${escapeAttr(row.id)}">Details</button>
      </td>
    </tr>
  `).join("");
}

function openStudentDetails(id) {
  const row = dashboardRows.find((item) => item.id === id);
  if (!row) return;
  $("#student-details-title").textContent = row.name;
  $("#student-details-content").innerHTML = `
    <div class="manual-details-summary">
      <p><strong>State:</strong> ${escapeHtml(row.state || "Not set")}</p>
      <p><strong>School:</strong> ${escapeHtml(row.school || "Not set")}</p>
      <p><strong>Lab sessions attended:</strong> ${attendedCount(row)}</p>
      <p><strong>Lab sessions recorded:</strong> ${row.sessions.length}</p>
    </div>
    ${row.sessions.length ? sessionHistory(row.sessions) : '<p class="empty-state">No lab session history recorded yet.</p>'}
  `;
  $("#student-details-dialog").showModal();
}

function sessionHistory(studentSessions) {
  return `
    <section class="student-history" aria-labelledby="student-history-heading">
      <h4 id="student-history-heading">Lab session history</h4>
      ${[...studentSessions].sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((session) => `
        <article class="history-entry">
          <div class="history-entry-head">
            <div>
              <strong>${escapeHtml(session.activityName || "Activity not set")}</strong>
              <span>${escapeHtml(formatDate(session.date))} · ${escapeHtml(session.subject || "Subject not set")}</span>
            </div>
            <span class="attendance-status ${session.present ? "is-present" : "is-absent"}">${session.present ? "Present" : "Absent"}</span>
          </div>
          <p class="history-facilitator"><strong>Facilitator:</strong> ${escapeHtml(session.facilitator || "Not set")}</p>
          ${session.present ? learningDetails(session) : '<p class="history-note">No learning assessment recorded because the student was absent.</p>'}
        </article>
      `).join("")}
    </section>
  `;
}

function learningDetails(session) {
  const generalRatings = Object.entries(generalRubricLabels)
    .filter(([key]) => session.rubric?.[key])
    .map(([key, label]) => ratingItem(label, session.rubric[key]));
  const conceptRatings = (session.conceptCriteria || [])
    .filter((criterion) => session.conceptRubric?.[criterion.key])
    .map((criterion) => ratingItem(criterion.label, session.conceptRubric[criterion.key]));

  if (!generalRatings.length && !conceptRatings.length) {
    return '<p class="history-note">Attendance recorded; learning assessment not yet rated.</p>';
  }

  return `
    <div class="learning-history">
      ${generalRatings.length ? `<div><h5>General lab skills</h5><dl>${generalRatings.join("")}</dl></div>` : ""}
      ${conceptRatings.length ? `<div><h5>Activity concepts</h5><dl>${conceptRatings.join("")}</dl></div>` : ""}
    </div>
  `;
}

function ratingItem(label, score) {
  const level = rubricLevelLabels[String(score)] || "Rated";
  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(score)}/4 · ${escapeHtml(level)}</dd></div>`;
}

function attendedCount(row) {
  return row.sessions.filter((session) => session.present).length;
}

function formatDate(value) {
  if (!value) return "Date not set";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function performanceSummary(session, student) {
  const general = averageScore(student.rubric);
  const concept = averageScore(student.conceptRubric, session.conceptCriteria);
  const parts = [];
  if (general) parts.push(`General ${general}/4`);
  if (concept) parts.push(`Concept ${concept}/4`);
  return parts.length ? parts.join("; ") : "Not rated";
}

function averageScore(scores, criteria = []) {
  const keys = criteria.length ? criteria.map((criterion) => criterion.key) : Object.keys(scores || {});
  const values = keys.map((key) => Number(scores?.[key])).filter(Boolean);
  if (!values.length) return "";
  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
}

function studentKey(name, state, school) {
  return [name, state, school].map((value) => String(value || "").trim().toLowerCase()).join("::");
}

function handleTableClick(event) {
  const detailsButton = event.target.closest("[data-student-details]");
  if (detailsButton) openStudentDetails(detailsButton.dataset.studentDetails);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/\n/g, " ");
}

async function initializeDashboard() {
  if (!window.StemLabStore?.isEnabled()) return;
  $("#dashboard-status").textContent = "Loading";
  const [studentResult, sessionResult, labResult] = await Promise.allSettled([
    window.StemLabStore.loadRegisteredStudents(),
    window.StemLabStore.ensureSessions(sessions),
    window.StemLabStore.loadLabData()
  ]);
  try {
    if (studentResult.status === "fulfilled") students = studentResult.value;
    if (sessionResult.status === "fulfilled") sessions = sessionResult.value;
    if (labResult.status === "fulfilled") labData = labResult.value;
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    dashboardRows = buildDashboardRows();
    renderFilters();
    renderDashboard();
    $("#dashboard-status").textContent = studentResult.status === "fulfilled" ? "Ready" : "Browser data";
    if (studentResult.status === "rejected") throw studentResult.reason;
  } catch (error) {
    console.error("Dashboard database load failed", error);
    $("#dashboard-status").textContent = "Browser data";
  }
}

renderFilters();
renderDashboard();
initializeDashboard();

$("#dashboard-search").addEventListener("input", renderDashboard);
$("#dashboard-state-filter").addEventListener("change", renderDashboard);
$("#dashboard-school-filter").addEventListener("change", renderDashboard);
$("#dashboard-table").addEventListener("click", handleTableClick);
document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});
