const LAB_DATA_STORAGE_KEY = "veStemLabData.v3";
const STUDENTS_STORAGE_KEY = "veStemLabStudents.v1";
const SESSIONS_STORAGE_KEY = "veStemLabSessions.v1";
const SCHOOLS_STORAGE_KEY = "veStemLabSchools.v1";
const FACILITATORS_STORAGE_KEY = "veStemLabFacilitators.v1";
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
let schools = loadArray(SCHOOLS_STORAGE_KEY);
let facilitators = loadArray(FACILITATORS_STORAGE_KEY);
let attendance = [];
let manuals = loadManuals();

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

function renderSchoolOptions(selectedValue = "") {
  const state = $("#session-state").value;
  const schoolNames = [...new Set([
    ...schools.filter((school) => !state || school.state === state).map((school) => school.name),
    ...students.filter((student) => !state || student.state === state).map((student) => student.school)
  ].filter(Boolean))].sort();
  setOptions($("#session-school"), schoolNames, selectedValue || schoolNames[0] || "");
  if (!schoolNames.length) $("#session-school").innerHTML = '<option value="">No registered schools</option>';
}

function renderFacilitatorOptions(selectedValue = "") {
  const state = $("#session-state").value;
  const names = [...new Set([
    ...facilitators.filter((item) => !state || item.state === state).map((item) => `${item.firstName} ${item.lastName}`.trim()),
    ...sessions.filter((session) => !state || session.state === state).map((session) => session.facilitator)
  ].filter(Boolean))].sort();
  setOptions($("#session-facilitator"), names, selectedValue || names[0] || "");
  if (!names.length) $("#session-facilitator").innerHTML = '<option value="">No registered facilitators</option>';
}

function renderGradeOptions(selectedValue = "") {
  const grades = [...new Set(students.map((student) => String(student.grade)).filter(Boolean))].sort((a, b) => Number(a) - Number(b));
  setOptions($("#session-grade-filter"), [{ value: "all", label: "All grades" }, ...grades], selectedValue || "all");
}

function matchingRoster() {
  const state = $("#session-state").value;
  const school = $("#session-school").value.trim().toLowerCase();
  const grade = $("#session-grade-filter").value;
  return students.filter((student) => (
    (!state || student.state === state) &&
    (!school || (student.school || "").toLowerCase() === school) &&
    (grade === "all" || String(student.grade) === grade)
  ));
}

function syncAttendanceRoster() {
  const existing = new Map(attendance.map((student) => [student.id, student]));
  attendance = matchingRoster().map((student) => existing.get(student.id) || {
    id: student.id,
    name: student.name,
    grade: student.grade,
    present: false,
    rubric: defaultRubric(),
    conceptRubric: defaultConceptRubric()
  });
  renderAttendanceTable();
}

function renderAttendanceTable() {
  $("#attendance-count").textContent = `${attendance.length} student${attendance.length === 1 ? "" : "s"}`;
  if (!attendance.length) {
    $("#attendance-table").innerHTML = '<tr><td colspan="4" class="empty-table-cell">No registered students match these filters.</td></tr>';
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

async function saveSession(event) {
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
  try {
    if (window.StemLabStore?.isEnabled()) await window.StemLabStore.saveSession(session);
  } catch (error) {
    console.error("Session database save failed", error);
    toast("Saved in this browser; database save failed.");
  }
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
  $("#session-date").value = session.date;
  $("#session-state").value = session.state;
  renderFacilitatorOptions(session.facilitator);
  $("#session-school").value = session.school;
  renderSubjectOptions(session.subject);
  renderActivityOptions(session.activityId);
  attendance = session.attendance.map((student) => ({
    ...student,
    rubric: { ...defaultRubric(), ...(student.rubric || {}) },
    conceptRubric: { ...defaultConceptRubric(session.conceptCriteria || selectedConceptCriteria()), ...(student.conceptRubric || {}) }
  }));
  renderSchoolOptions(session.school);
  renderGradeOptions();
  renderAttendanceTable();
  setStatus("Editing");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteSession(id) {
  const session = sessions.find((item) => item.id === id);
  if (!session || !confirm(`Delete the ${session.date} session for ${session.school}?`)) return;
  sessions = sessions.filter((item) => item.id !== id);
  persistSessions();
  try {
    if (window.StemLabStore?.isEnabled()) await window.StemLabStore.deleteSession(id);
  } catch (error) {
    console.error("Session database delete failed", error);
    toast("Deleted in this browser; database delete failed.");
  }
  renderSessionsTable();
  setStatus("Deleted");
  toast("Session deleted");
}

function resetSessionForm() {
  $("#session-entry-form").reset();
  $("#session-id").value = "";
  $("#session-date").valueAsDate = new Date();
  renderStateOptions();
  renderFacilitatorOptions();
  renderSchoolOptions();
  renderGradeOptions();
  renderSubjectOptions();
  attendance = [];
  syncAttendanceRoster();
  setStatus("Ready");
}

function handleAttendanceClick(event) {
  const present = event.target.closest("[data-attendance-present]");
  const rubric = event.target.closest("[data-rubric-student]");
  const conceptRubric = event.target.closest("[data-concept-student]");
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

async function initializeSessionData() {
  if (!window.StemLabStore?.isEnabled()) return;
  setStatus("Loading");
  const [studentResult, sessionResult, labResult, schoolResult, facilitatorResult] = await Promise.allSettled([
    window.StemLabStore.loadRegisteredStudents(),
    window.StemLabStore.ensureSessions(sessions),
    window.StemLabStore.loadLabData(),
    window.StemLabStore.loadSchools(),
    window.StemLabStore.loadFacilitators()
  ]);
  if (studentResult.status === "fulfilled") students = studentResult.value;
  if (sessionResult.status === "fulfilled") sessions = sessionResult.value;
  if (labResult.status === "fulfilled" && labResult.value.manuals.length) manuals = labResult.value.manuals;
  if (schoolResult.status === "fulfilled") schools = schoolResult.value;
  if (facilitatorResult.status === "fulfilled") facilitators = facilitatorResult.value;
  try {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
    localStorage.setItem(SCHOOLS_STORAGE_KEY, JSON.stringify(schools));
    localStorage.setItem(FACILITATORS_STORAGE_KEY, JSON.stringify(facilitators));
    persistSessions();
    renderStateOptions(students[0]?.state || "");
    renderFacilitatorOptions();
    renderSchoolOptions();
    renderGradeOptions();
    renderSubjectOptions();
    syncAttendanceRoster();
    renderSessionsTable();
    setStatus(studentResult.status === "fulfilled" ? "Ready" : "Browser data");
    if (studentResult.status === "rejected") throw studentResult.reason;
    if (sessionResult.status === "rejected" || labResult.status === "rejected") {
      toast("Students loaded. Run supabase-schema.sql to enable shared STEM Lab data.");
    }
  } catch (error) {
    console.error("Session database load failed", error);
    setStatus("Browser data");
    toast("Could not load shared students from Supabase.");
  }
}

renderStateOptions();
renderSubjectOptions();
renderFacilitatorOptions();
renderSchoolOptions();
renderGradeOptions();
resetSessionForm();
renderSessionsTable();
initializeSessionData();

$("#session-state").addEventListener("change", () => { renderFacilitatorOptions(); renderSchoolOptions(); syncAttendanceRoster(); });
$("#session-school").addEventListener("change", syncAttendanceRoster);
$("#session-grade-filter").addEventListener("change", syncAttendanceRoster);
$("#session-subject").addEventListener("change", () => renderActivityOptions());
$("#session-activity").addEventListener("change", () => {
  syncConceptRubrics();
  renderAttendanceTable();
});
$("#attendance-table").addEventListener("change", handleAttendanceClick);
$("#attendance-table").addEventListener("click", handleAttendanceClick);
$("#sessions-table").addEventListener("click", handleSessionsClick);
$("#reset-session-form").addEventListener("click", resetSessionForm);
$("#session-entry-form").addEventListener("submit", saveSession);
