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

function loadArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
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
    manuals: Array.from({ length: 12 + (Array.isArray(window.NCERT_ACTIVITIES) ? window.NCERT_ACTIVITIES.length : 0) })
  };
}

function renderDashboard() {
  $("#dashboard-resource-count").textContent = labData.resources.length;
  $("#dashboard-manual-count").textContent = labData.manuals.length;
  $("#dashboard-student-count").textContent = students.length;
  $("#dashboard-session-count").textContent = sessions.length;
  renderUsage();
  renderParticipationFilters();
  renderParticipation();
}

function renderUsage() {
  const sorted = [...sessions].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  $("#usage-record-count").textContent = `${sorted.length} session${sorted.length === 1 ? "" : "s"}`;
  if (!sorted.length) {
    $("#usage-table").innerHTML = '<tr><td colspan="5" class="empty-table-cell">No STEM lab sessions recorded yet.</td></tr>';
    return;
  }
  $("#usage-table").innerHTML = sorted.map((session) => `
    <tr>
      <td data-label="Date">${escapeHtml(formatDate(session.date))}</td>
      <td data-label="State">${escapeHtml(session.state || "Not set")}</td>
      <td data-label="School">${escapeHtml(session.school || "Not set")}</td>
      <td data-label="Facilitator">${escapeHtml(session.facilitator || "Not set")}</td>
      <td data-label="More Details"><button type="button" data-session-details="${escapeAttr(session.id)}">Details</button></td>
    </tr>
  `).join("");
}

function openSessionDetails(id) {
  const session = sessions.find((item) => item.id === id);
  if (!session) return;
  const attendance = session.attendance || [];
  const presentCount = attendance.filter((student) => student.present).length;
  $("#session-details-title").textContent = session.activityName || "Session details";
  $("#session-details-content").innerHTML = `
    <div class="manual-details-summary">
      <p><strong>Date:</strong> ${escapeHtml(formatDate(session.date))}</p>
      <p><strong>State:</strong> ${escapeHtml(session.state || "Not set")}</p>
      <p><strong>School:</strong> ${escapeHtml(session.school || "Not set")}</p>
      <p><strong>Facilitator:</strong> ${escapeHtml(session.facilitator || "Not set")}</p>
      <p><strong>Subject:</strong> ${escapeHtml(session.subject || "Not set")}</p>
      <p><strong>Attendance:</strong> ${presentCount}/${attendance.length} present</p>
    </div>
    ${sessionStudentsTable(session)}
  `;
  $("#session-details-dialog").showModal();
}

function sessionStudentsTable(session) {
  const attendance = session.attendance || [];
  if (!attendance.length) return '<p class="empty-state">No students were recorded for this session.</p>';
  return `
    <div class="resource-table-wrap details-table-wrap">
      <table class="resource-table students-table">
        <thead><tr><th>Student</th><th>Grade</th><th>Attendance</th><th>Performance</th></tr></thead>
        <tbody>${attendance.map((student) => `
          <tr>
            <td data-label="Student"><strong>${escapeHtml(student.name || "Unnamed student")}</strong></td>
            <td data-label="Grade">${escapeHtml(student.grade || studentGrade(student, session) || "Not set")}</td>
            <td data-label="Attendance"><span class="attendance-status ${student.present ? "is-present" : "is-absent"}">${student.present ? "Present" : "Absent"}</span></td>
            <td data-label="Performance">${escapeHtml(student.present ? performanceSummary(session, student) : "Not assessed")}</td>
          </tr>`).join("")}</tbody>
      </table>
    </div>`;
}

function renderParticipationFilters() {
  const participants = participationStudents();
  const currentState = $("#participation-state").value;
  const currentSchool = $("#participation-school").value;
  const currentGrade = $("#participation-grade").value;
  const currentStudent = $("#participation-student").value;
  const states = unique(participants.map((student) => student.state));
  setSelectOptions($("#participation-state"), [{ value: "", label: "Select state" }, ...states], currentState);

  const state = $("#participation-state").value;
  const schools = unique(participants.filter((student) => !state || student.state === state).map((student) => student.school));
  setSelectOptions($("#participation-school"), [{ value: "", label: "Select school" }, ...schools], currentSchool);

  const school = $("#participation-school").value;
  const grades = unique(participants.filter((student) => (!state || student.state === state) && (!school || student.school === school))
    .map((student) => String(student.grade || ""))).sort((a, b) => Number(a) - Number(b));
  setSelectOptions($("#participation-grade"), [{ value: "", label: "Select grade" }, ...grades], currentGrade);

  const grade = $("#participation-grade").value;
  const matchingStudents = participants.filter((student) =>
    (!state || student.state === state) && (!school || student.school === school) && (!grade || String(student.grade) === grade));
  const studentOptions = matchingStudents.map((student) => ({ value: participantKey(student), label: student.name }));
  setSelectOptions($("#participation-student"), [{ value: "", label: "Select student" }, ...studentOptions], currentStudent);
}

function setSelectOptions(select, options, selectedValue = "") {
  select.innerHTML = options.map((option) => {
    const item = typeof option === "string" ? { value: option, label: option } : option;
    return `<option value="${escapeAttr(item.value)}"${item.value === selectedValue ? " selected" : ""}>${escapeHtml(item.label)}</option>`;
  }).join("");
  if (![...select.options].some((option) => option.value === selectedValue)) select.value = "";
}

function renderParticipation() {
  const selectedKey = $("#participation-student").value;
  const selectedStudent = participationStudents().find((student) => participantKey(student) === selectedKey);
  if (!selectedStudent) {
    renderParticipationEmpty("Select a state, school, grade, and student to view participation.");
    return;
  }
  const dateFrom = $("#participation-date-from").value;
  const dateTo = $("#participation-date-to").value;
  const records = participationRecords(selectedStudent).filter((record) =>
    (!dateFrom || record.date >= dateFrom) && (!dateTo || record.date <= dateTo));
  $("#participation-record-count").textContent = `${records.length} session${records.length === 1 ? "" : "s"}`;
  if (!records.length) {
    $("#participation-table").innerHTML = '<tr><td colspan="5" class="empty-table-cell">No attended sessions match this student and date range.</td></tr>';
  } else {
    $("#participation-table").innerHTML = records.map((record) => `
      <tr>
        <td data-label="Date">${escapeHtml(formatDate(record.date))}</td>
        <td data-label="Subject">${escapeHtml(record.subject || "Not set")}</td>
        <td data-label="Activity"><strong>${escapeHtml(record.activityName || "Not set")}</strong></td>
        <td data-label="Facilitator">${escapeHtml(record.facilitator || "Not set")}</td>
        <td data-label="Performance">${escapeHtml(performanceSummary(record.session, record.attendance))}</td>
      </tr>`).join("");
  }
  $("#trend-summary-text").textContent = longitudinalSummary(selectedStudent, records);
}

function participationStudents() {
  const map = new Map(students.map((student) => [participantKey(student), student]));
  sessions.forEach((session) => (session.attendance || []).forEach((attendance) => {
    const student = {
      id: attendance.id || "",
      name: attendance.name || "Unnamed student",
      grade: attendance.grade || "",
      state: session.state || "",
      school: session.school || ""
    };
    const existing = [...map.values()].find((item) => attendanceMatchesStudent(attendance, item, session));
    if (!existing) map.set(participantKey(student), student);
  }));
  return [...map.values()];
}

function renderParticipationEmpty(message) {
  $("#participation-record-count").textContent = "0 sessions";
  $("#participation-table").innerHTML = `<tr><td colspan="5" class="empty-table-cell">${escapeHtml(message)}</td></tr>`;
  $("#trend-summary-text").textContent = "Select a student to generate a longitudinal performance summary.";
}

function participationRecords(student) {
  return sessions.flatMap((session) => {
    const attendance = (session.attendance || []).find((entry) => entry.present && attendanceMatchesStudent(entry, student, session));
    return attendance ? [{
      date: session.date || "",
      subject: session.subject,
      activityName: session.activityName,
      facilitator: session.facilitator,
      session,
      attendance
    }] : [];
  }).sort((a, b) => b.date.localeCompare(a.date));
}

function attendanceMatchesStudent(attendance, student, session) {
  if (attendance.id && student.id && attendance.id === student.id) return true;
  return normalize(attendance.name) === normalize(student.name) &&
    normalize(session.state) === normalize(student.state) && normalize(session.school) === normalize(student.school);
}

function longitudinalSummary(student, records) {
  if (!records.length) return `No attended sessions are available for ${student.name} in the selected date range.`;
  const chronological = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const rated = chronological.map((record) => ({ ...record, score: overallScore(record.session, record.attendance) }))
    .filter((record) => record.score !== null);
  const period = `${formatDate(chronological[0].date)} to ${formatDate(chronological[chronological.length - 1].date)}`;
  if (!rated.length) return `${student.name} attended ${records.length} session${records.length === 1 ? "" : "s"} from ${period}. Performance ratings have not yet been recorded, so a trend cannot be determined.`;

  const average = mean(rated.map((record) => record.score));
  let trend = "A longitudinal trend needs at least two rated sessions.";
  if (rated.length > 1) {
    const change = rated[rated.length - 1].score - rated[0].score;
    const direction = change >= 0.35 ? "improving" : change <= -0.35 ? "declining" : "stable";
    trend = `Performance is ${direction}: the overall score moved from ${rated[0].score.toFixed(1)}/4 to ${rated[rated.length - 1].score.toFixed(1)}/4.`;
  }
  const criteria = criterionAverages(rated);
  const strength = criteria[0];
  const support = criteria.length > 1 ? criteria[criteria.length - 1] : null;
  const insights = [
    `${student.name} attended ${records.length} session${records.length === 1 ? "" : "s"} from ${period}, with an average rated performance of ${average.toFixed(1)}/4.`,
    trend,
    strength ? `The strongest recorded area is ${strength.label} (${strength.average.toFixed(1)}/4).` : "",
    support && support.label !== strength?.label ? `${support.label} is the clearest area for continued support (${support.average.toFixed(1)}/4).` : ""
  ];
  return insights.filter(Boolean).join(" ");
}

function criterionAverages(records) {
  const values = new Map();
  records.forEach(({ session, attendance }) => {
    Object.entries(generalRubricLabels).forEach(([key, label]) => addCriterion(values, label, attendance.rubric?.[key]));
    (session.conceptCriteria || []).forEach((criterion) => addCriterion(values, criterion.label, attendance.conceptRubric?.[criterion.key]));
  });
  return [...values.entries()].map(([label, scores]) => ({ label, average: mean(scores) }))
    .sort((a, b) => b.average - a.average);
}

function addCriterion(map, label, rawScore) {
  const score = Number(rawScore);
  if (!Number.isFinite(score) || score < 1) return;
  if (!map.has(label)) map.set(label, []);
  map.get(label).push(score);
}

function overallScore(session, attendance) {
  const values = [
    ...Object.values(attendance.rubric || {}),
    ...(session.conceptCriteria || []).map((criterion) => attendance.conceptRubric?.[criterion.key])
  ].map(Number).filter((value) => Number.isFinite(value) && value > 0);
  return values.length ? mean(values) : null;
}

function performanceSummary(session, attendance) {
  const general = rubricAverage(attendance.rubric, Object.keys(generalRubricLabels));
  const concept = rubricAverage(attendance.conceptRubric, (session.conceptCriteria || []).map((criterion) => criterion.key));
  const parts = [];
  if (general !== null) parts.push(`General ${general.toFixed(1)}/4`);
  if (concept !== null) parts.push(`Concept ${concept.toFixed(1)}/4`);
  return parts.length ? parts.join("; ") : "Not rated";
}

function rubricAverage(rubric, keys) {
  const values = keys.map((key) => Number(rubric?.[key])).filter((value) => Number.isFinite(value) && value > 0);
  return values.length ? mean(values) : null;
}

function studentGrade(attendance, session) {
  return students.find((student) => attendanceMatchesStudent(attendance, student, session))?.grade || "";
}

function participantKey(student) {
  return student.id || [student.name, student.state, student.school].map(normalize).join("::");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function formatDate(value) {
  if (!value) return "Date not set";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function handleParticipationFilter(event) {
  if (["participation-state", "participation-school", "participation-grade"].includes(event.target.id)) {
    if (event.target.id === "participation-state") {
      $("#participation-school").value = "";
      $("#participation-grade").value = "";
    }
    if (event.target.id === "participation-school") $("#participation-grade").value = "";
    $("#participation-student").value = "";
    renderParticipationFilters();
  }
  renderParticipation();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
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
  if (studentResult.status === "fulfilled") students = studentResult.value;
  if (sessionResult.status === "fulfilled") sessions = sessionResult.value;
  if (labResult.status === "fulfilled") labData = labResult.value;
  localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  renderDashboard();
  $("#dashboard-status").textContent = studentResult.status === "fulfilled" ? "Ready" : "Browser data";
}

renderDashboard();
initializeDashboard();

$("#open-usage").addEventListener("click", () => {
  $("#stem-usage").open = true;
  $("#stem-usage").scrollIntoView({ behavior: "smooth", block: "start" });
});
$("#usage-table").addEventListener("click", (event) => {
  const button = event.target.closest("[data-session-details]");
  if (button) openSessionDetails(button.dataset.sessionDetails);
});
$(".participation-filters").addEventListener("change", handleParticipationFilter);
$(".participation-filters").addEventListener("input", (event) => {
  if (event.target.type === "date") renderParticipation();
});
document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
