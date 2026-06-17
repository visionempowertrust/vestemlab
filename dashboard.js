const STUDENTS_STORAGE_KEY = "veStemLabStudents.v1";
const SESSIONS_STORAGE_KEY = "veStemLabSessions.v1";
const $ = (selector) => document.querySelector(selector);

const students = loadArray(STUDENTS_STORAGE_KEY);
const sessions = loadArray(SESSIONS_STORAGE_KEY);
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
    (session.attendance || []).filter((student) => student.present).forEach((student) => {
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
        performance: performanceSummary(session, student)
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
  $("#dashboard-attendance-count").textContent = dashboardRows.reduce((sum, row) => sum + row.sessions.length, 0);

  if (!rows.length) {
    $("#dashboard-table").innerHTML = '<tr><td colspan="5" class="empty-table-cell">No student records match the current filters.</td></tr>';
    return;
  }

  $("#dashboard-table").innerHTML = rows.map((row) => `
    <tr>
      <td data-label="State">${escapeHtml(row.state || "Not set")}</td>
      <td data-label="School">${escapeHtml(row.school || "Not set")}</td>
      <td data-label="Student name"><strong>${escapeHtml(row.name)}</strong>${row.registered ? "" : ' <span class="badge">session entry</span>'}</td>
      <td data-label="Lab sessions attended">${row.sessions.length}</td>
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
      <p><strong>Lab sessions attended:</strong> ${row.sessions.length}</p>
    </div>
    ${row.sessions.length ? sessionDetailsTable(row.sessions) : '<p class="empty-state">No attended lab sessions recorded yet.</p>'}
  `;
  $("#student-details-dialog").showModal();
}

function sessionDetailsTable(studentSessions) {
  return `
    <div class="resource-table-wrap details-table-wrap">
      <table class="resource-table students-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Subject</th>
            <th scope="col">Activity</th>
            <th scope="col">Facilitator</th>
            <th scope="col">Performance</th>
          </tr>
        </thead>
        <tbody>
          ${studentSessions.sort((a, b) => b.date.localeCompare(a.date)).map((session) => `
            <tr>
              <td data-label="Date">${escapeHtml(session.date)}</td>
              <td data-label="Subject">${escapeHtml(session.subject)}</td>
              <td data-label="Activity">${escapeHtml(session.activityName)}</td>
              <td data-label="Facilitator">${escapeHtml(session.facilitator)}</td>
              <td data-label="Performance">${escapeHtml(session.performance)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
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

renderFilters();
renderDashboard();

$("#dashboard-search").addEventListener("input", renderDashboard);
$("#dashboard-state-filter").addEventListener("change", renderDashboard);
$("#dashboard-school-filter").addEventListener("change", renderDashboard);
$("#dashboard-table").addEventListener("click", handleTableClick);
document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});
