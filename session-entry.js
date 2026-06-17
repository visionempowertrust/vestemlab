const LAB_DATA_STORAGE_KEY = "veStemLabData.v3";
const STUDENTS_STORAGE_KEY = "veStemLabStudents.v1";
const SESSIONS_STORAGE_KEY = "veStemLabSessions.v1";
const locations = window.INDIA_LOCATIONS || {};
const states = window.INDIA_STATES || Object.keys(locations).sort((a, b) => a.localeCompare(b));
const fallbackSubjects = ["Basic Science", "Maths", "Biology", "Physics", "Chemistry", "Assistive Technologies"];
const rubricCriteria = [
  { key: "materialHandling", label: "Material handling" },
  { key: "safety", label: "Safety" },
  { key: "participation", label: "Participation" },
  { key: "observationInference", label: "Observation and inference" }
];
const rubricLevels = [
  { value: "4", label: "4 - Independent" },
  { value: "3", label: "3 - With prompts" },
  { value: "2", label: "2 - Needs support" },
  { value: "1", label: "1 - Not yet" }
];
const $ = (selector) => document.querySelector(selector);

let students = loadArray(STUDENTS_STORAGE_KEY);
let sessions = loadArray(SESSIONS_STORAGE_KEY);
let attendance = [];
const manuals = loadManuals();

function loadArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

function loadManuals() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LAB_DATA_STORAGE_KEY) || "{}");
    if (Array.isArray(parsed.manuals) && parsed.manuals.length) {
      return parsed.manuals;
    }
  } catch {
    localStorage.removeItem(LAB_DATA_STORAGE_KEY);
  }
  return (window.NCERT_ACTIVITIES || []).map((activity) => ({
    id: activity.id,
    subject: activity.subject || "Maths",
    name: activity.name,
    concepts: activity.concepts || "TIK: mathematics"
  }));
}

function setOptions(select, options, selectedValue = "") {
  select.innerHTML = options.map((option) => {
    const value = typeof option === "string" ? option : option.value;
    const label = typeof option === "string" ? option : option.label;
    const selected = value === selectedValue ? " selected" : "";
    return `<option value="${escapeAttr(value)}"${selected}>${escapeHtml(label)}</option>`;
  }).join("");
}

function renderStateOptions(selectedValue = "") {
  setOptions($("#session-state"), states, selectedValue || states[0] || "");
}

function renderSubjectOptions(selectedValue = "") {
  const subjects = [...new Set([...fallbackSubjects, ...manuals.map((manual) => manual.subject).filter(Boolean)])].sort();
  const subjectsWithActivities = new Set(manuals.map((manual) => manual.subject).filter(Boolean));
  const defaultSubject = subjects.find((subject) => subjectsWithActivities.has(subject)) || subjects[0] || "";
  setOptions($("#session-subject"), subjects, selectedValue || defaultSubject);
  renderActivityOptions();
}

function renderActivityOptions(selectedValue = "") {
  const subject = $("#session-subject").value;
  const activities = manuals
    .filter((manual) => manual.subject === subject)
    .sort((a, b) => a.name.localeCompare(b.name));
  setOptions(
    $("#session-activity"),
    activities.map((manual) => ({ value: manual.id, label: manual.name })),
    selectedValue || activities[0]?.id || ""
  );
  if (!activities.length) {
    $("#session-activity").innerHTML = '<option value="">No activities available for this subject</option>';
  }
  syncConceptRubrics();
  renderAttendanceTable();
}

function renderSchoolOptions() {
  const schools = [...new Set(students.map((student) => student.school).filter(Boolean))].sort();
  $("#school-options").innerHTML = schools.map((school) => `<option value="${escapeAttr(school)}"></option>`).join("");
}

function renderStudentOptions() {
  const matchingStudents = matchingRoster();
  $("#student-options").innerHTML = matchingStudents
    .map((student) => `<option value="${escapeAttr(student.name)}">${escapeHtml(student.school)}${student.grade ? `, Grade ${escapeHtml(student.grade)}` : ""}</option>`)
    .join("");
}

function matchingRoster() {
  const state = $("#session-state").value;
  const school = $("#session-school").value.trim().toLowerCase();
  return students.filter((student) => (
    (!state || student.state === state) &&
    (!school || (student.school || "").toLowerCase() === school)
  ));
}

function addAttendanceStudent(student) {
  const name = typeof student === "string" ? student.trim() : student.name;
  if (!name) return;
  const existing = attendance.some((item) => item.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    toast("Student already added");
    return;
  }
  attendance.push({
    id: typeof student === "string" ? makeId("att") : student.id,
    name,
    grade: typeof student === "string" ? "" : student.grade,
    present: true,
    rubric: defaultRubric(),
    conceptRubric: defaultConceptRubric()
  });
  renderAttendanceTable();
}

function addSelectedStudent() {
  const name = $("#student-picker").value.trim();
  const match = matchingRoster().find((student) => student.name.toLowerCase() === name.toLowerCase());
  addAttendanceStudent(match || name);
  $("#student-picker").value = "";
}

function addSchoolRoster() {
  const roster = matchingRoster();
  if (!roster.length) {
    toast("No registered students match this state and school");
    return;
  }
  roster.forEach(addAttendanceStudent);
  toast("Roster added");
}

function renderAttendanceTable() {
  $("#attendance-count").textContent = `${attendance.length} student${attendance.length === 1 ? "" : "s"}`;
  if (!attendance.length) {
    $("#attendance-table").innerHTML = '<tr><td colspan="5" class="empty-table-cell">No students added for attendance yet.</td></tr>';
    return;
  }
  $("#attendance-table").innerHTML = attendance.map((student) => `
    <tr>
      <td data-label="Student name"><strong>${escapeHtml(student.name)}</strong></td>
      <td data-label="Grade">${escapeHtml(student.grade || "Not set")}</td>
      <td data-label="Attendance">
        <label class="inline-check">
          <input type="checkbox" data-attendance-present="${escapeAttr(student.id)}" ${student.present ? "checked" : ""}>
          Present
        </label>
      </td>
      <td data-label="Performance rubric">
        <div class="rubric-grid">
          <h4>General lab skills</h4>
          ${rubricCriteria.map((criterion) => rubricSelect(student, criterion)).join("")}
          ${conceptRubricBlock(student)}
        </div>
      </td>
      <td data-label="Actions">
        <button class="danger" type="button" data-remove-attendance="${escapeAttr(student.id)}">Remove</button>
      </td>
    </tr>
  `).join("");
}

function conceptRubricBlock(student) {
  const criteria = selectedConceptCriteria();
  if (!criteria.length) return "";
  const rubric = { ...defaultConceptRubric(), ...(student.conceptRubric || {}) };
  return `
    <h4>Activity concepts</h4>
    ${criteria.map((criterion) => `
      <label>
        ${escapeHtml(criterion.label)}
        <select data-concept-student="${escapeAttr(student.id)}" data-concept-key="${escapeAttr(criterion.key)}">
          ${rubricLevels.map((level) => `<option value="${level.value}" ${level.value === String(rubric[criterion.key] || "3") ? "selected" : ""}>${escapeHtml(level.label)}</option>`).join("")}
        </select>
      </label>
    `).join("")}
  `;
}

function rubricSelect(student, criterion) {
  const value = String(student.rubric?.[criterion.key] || "3");
  return `
    <label>
      ${escapeHtml(criterion.label)}
      <select data-rubric-student="${escapeAttr(student.id)}" data-rubric-key="${escapeAttr(criterion.key)}">
        ${rubricLevels.map((level) => `<option value="${level.value}" ${level.value === value ? "selected" : ""}>${escapeHtml(level.label)}</option>`).join("")}
      </select>
    </label>
  `;
}

function defaultRubric() {
  return Object.fromEntries(rubricCriteria.map((criterion) => [criterion.key, "3"]));
}

function defaultConceptRubric(criteria = selectedConceptCriteria()) {
  return Object.fromEntries(criteria.map((criterion) => [criterion.key, "3"]));
}

function selectedActivity() {
  return manuals.find((manual) => manual.id === $("#session-activity").value);
}

function selectedConceptCriteria(activity = selectedActivity()) {
  const concepts = extractConcepts(activity);
  return concepts.map((concept) => ({
    key: concept.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    label: concept
  }));
}

function extractConcepts(activity) {
  const text = `${activity?.concepts || ""}, ${activity?.name || ""}`;
  const explicit = (activity?.concepts || "")
    .replace(/^TIK:\s*/i, "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item && !/^mathematics$/i.test(item));
  const inferred = [
    ["addition", /\b(add|addition|sum)\b/i],
    ["subtraction", /\b(subtract|subtraction|difference)\b/i],
    ["multiplication", /\b(multiply|multiplication|multiples)\b/i],
    ["division and factors", /\b(divide|division|factor)\b/i],
    ["geometry", /\b(shape|geometry|cube|cuboid|2-d|3-d|tangram|net)\b/i],
    ["data handling", /\b(data|graph|display|interpret)\b/i],
    ["patterns", /\b(pattern|pyramid|puzzle|cross number)\b/i],
    ["measurement", /\b(measure|volume|length|time)\b/i],
    ["scientific reasoning", /\b(observe|infer|fair test|compare)\b/i]
  ].filter(([, pattern]) => pattern.test(text)).map(([concept]) => concept);
  return [...new Set([...explicit, ...inferred])].slice(0, 4);
}

function syncConceptRubrics() {
  const defaults = defaultConceptRubric();
  attendance = attendance.map((student) => ({
    ...student,
    conceptRubric: { ...defaults, ...(student.conceptRubric || {}) }
  }));
}

function collectSession() {
  const activity = selectedActivity();
  const conceptCriteria = selectedConceptCriteria(activity);
  return {
    id: $("#session-id").value || makeId("session"),
    facilitator: $("#session-facilitator").value.trim(),
    date: $("#session-date").value,
    state: $("#session-state").value,
    school: $("#session-school").value.trim(),
    subject: $("#session-subject").value,
    activityId: $("#session-activity").value,
    activityName: activity?.name || $("#session-activity").selectedOptions[0]?.textContent || "",
    conceptCriteria,
    attendance: attendance.map((student) => ({
      ...student,
      rubric: { ...defaultRubric(), ...(student.rubric || {}) },
      conceptRubric: { ...defaultConceptRubric(conceptCriteria), ...(student.conceptRubric || {}) }
    }))
  };
}

function saveSession(event) {
  event.preventDefault();
  const session = collectSession();
  if (!session.facilitator || !session.date || !session.school || !session.activityId) {
    toast("Facilitator, date, school/centre, subject, and activity are required");
    return;
  }
  if (!session.attendance.length) {
    toast("Add at least one student for attendance");
    return;
  }
  const index = sessions.findIndex((item) => item.id === session.id);
  if (index >= 0) sessions[index] = session;
  else sessions.push(session);
  persistSessions();
  resetSessionForm();
  renderSessionsTable();
  setStatus("Saved");
  toast("Session saved");
}

function persistSessions() {
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
}

function renderSessionsTable() {
  $("#sessions-count").textContent = `${sessions.length} session${sessions.length === 1 ? "" : "s"}`;
  if (!sessions.length) {
    $("#sessions-table").innerHTML = '<tr><td colspan="9" class="empty-table-cell">No lab sessions saved yet.</td></tr>';
    return;
  }
  $("#sessions-table").innerHTML = [...sessions].sort((a, b) => b.date.localeCompare(a.date)).map((session) => {
    const present = session.attendance.filter((student) => student.present).length;
    const score = sessionRubricAverage(session, "rubric", rubricCriteria);
    const conceptScore = sessionRubricAverage(session, "conceptRubric", session.conceptCriteria || []);
    return `
      <tr>
        <td data-label="Date">${escapeHtml(session.date)}</td>
        <td data-label="State">${escapeHtml(session.state)}</td>
        <td data-label="School/Centre">${escapeHtml(session.school)}</td>
        <td data-label="Subject">${escapeHtml(session.subject)}</td>
        <td data-label="Activity"><strong>${escapeHtml(session.activityName)}</strong></td>
        <td data-label="Facilitator">${escapeHtml(session.facilitator)}</td>
        <td data-label="Attendance">${present}/${session.attendance.length} present</td>
        <td data-label="Performance">${performanceSummary(score, conceptScore)}</td>
        <td data-label="Actions">
          <div class="student-actions">
            <button type="button" data-edit-session="${escapeAttr(session.id)}">Edit</button>
            <button class="danger" type="button" data-delete-session="${escapeAttr(session.id)}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function editSession(id) {
  const session = sessions.find((item) => item.id === id);
  if (!session) return;
  $("#session-id").value = session.id;
  $("#session-facilitator").value = session.facilitator;
  $("#session-date").value = session.date;
  $("#session-state").value = session.state;
  $("#session-school").value = session.school;
  renderSubjectOptions(session.subject);
  renderActivityOptions(session.activityId);
  attendance = session.attendance.map((student) => ({
    ...student,
    rubric: { ...defaultRubric(), ...(student.rubric || {}) },
    conceptRubric: { ...defaultConceptRubric(session.conceptCriteria || selectedConceptCriteria()), ...(student.conceptRubric || {}) }
  }));
  renderStudentOptions();
  renderAttendanceTable();
  setStatus("Editing");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteSession(id) {
  const session = sessions.find((item) => item.id === id);
  if (!session || !confirm(`Delete the ${session.date} session for ${session.school}?`)) return;
  sessions = sessions.filter((item) => item.id !== id);
  persistSessions();
  renderSessionsTable();
  setStatus("Deleted");
  toast("Session deleted");
}

function resetSessionForm() {
  $("#session-entry-form").reset();
  $("#session-id").value = "";
  $("#session-date").valueAsDate = new Date();
  renderStateOptions();
  renderSubjectOptions();
  attendance = [];
  renderStudentOptions();
  renderAttendanceTable();
  setStatus("Ready");
}

function handleAttendanceClick(event) {
  const present = event.target.closest("[data-attendance-present]");
  const rubric = event.target.closest("[data-rubric-student]");
  const conceptRubric = event.target.closest("[data-concept-student]");
  const remove = event.target.closest("[data-remove-attendance]");
  if (present) {
    const student = attendance.find((item) => item.id === present.dataset.attendancePresent);
    if (student) student.present = present.checked;
  }
  if (rubric) {
    const student = attendance.find((item) => item.id === rubric.dataset.rubricStudent);
    if (student) {
      student.rubric = { ...defaultRubric(), ...(student.rubric || {}) };
      student.rubric[rubric.dataset.rubricKey] = rubric.value;
    }
  }
  if (conceptRubric) {
    const student = attendance.find((item) => item.id === conceptRubric.dataset.conceptStudent);
    if (student) {
      student.conceptRubric = { ...defaultConceptRubric(), ...(student.conceptRubric || {}) };
      student.conceptRubric[conceptRubric.dataset.conceptKey] = conceptRubric.value;
    }
  }
  if (remove) {
    attendance = attendance.filter((item) => item.id !== remove.dataset.removeAttendance);
    renderAttendanceTable();
  }
}

function sessionRubricAverage(session, rubricKey, criteria) {
  const scores = session.attendance.flatMap((student) => {
    const rubric = student[rubricKey] || {};
    return criteria.map((criterion) => Number(rubric[criterion.key])).filter(Boolean);
  });
  if (!scores.length) return "";
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return average.toFixed(1);
}

function performanceSummary(generalScore, conceptScore) {
  const parts = [];
  if (generalScore) parts.push(`General ${generalScore}/4`);
  if (conceptScore) parts.push(`Concept ${conceptScore}/4`);
  return parts.length ? parts.join("; ") : "Not rated";
}

function handleSessionsClick(event) {
  const editButton = event.target.closest("[data-edit-session]");
  const deleteButton = event.target.closest("[data-delete-session]");
  if (editButton) editSession(editButton.dataset.editSession);
  if (deleteButton) deleteSession(deleteButton.dataset.deleteSession);
}

function setStatus(message) {
  $("#session-status").textContent = message;
}

function toast(message) {
  const toastEl = $("#toast");
  toastEl.textContent = message;
  clearTimeout(toastEl.timeout);
  toastEl.timeout = setTimeout(() => {
    toastEl.textContent = "";
  }, 2600);
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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

renderStateOptions();
renderSubjectOptions();
renderSchoolOptions();
resetSessionForm();
renderSessionsTable();

$("#session-state").addEventListener("change", renderStudentOptions);
$("#session-school").addEventListener("input", renderStudentOptions);
$("#session-subject").addEventListener("change", () => renderActivityOptions());
$("#session-activity").addEventListener("change", () => {
  syncConceptRubrics();
  renderAttendanceTable();
});
$("#add-attendance-student").addEventListener("click", addSelectedStudent);
$("#add-school-roster").addEventListener("click", addSchoolRoster);
$("#attendance-table").addEventListener("change", handleAttendanceClick);
$("#attendance-table").addEventListener("click", handleAttendanceClick);
$("#sessions-table").addEventListener("click", handleSessionsClick);
$("#reset-session-form").addEventListener("click", resetSessionForm);
$("#session-entry-form").addEventListener("submit", saveSession);
