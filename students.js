const STUDENTS_STORAGE_KEY = "veStemLabStudents.v1";
const SCHOOLS_STORAGE_KEY = "veStemLabSchools.v1";
const locations = window.INDIA_LOCATIONS || {};
const states = window.INDIA_STATES || Object.keys(locations).sort((a, b) => a.localeCompare(b));
const yesNo = ["Yes", "No"];
const brailleLevels = ["Letters", "Words", "Sentences"];
const $ = (selector) => document.querySelector(selector);

let registeredStudents = loadStudents();
let registeredSchools = loadSchools();

function setOptions(select, options, selectedValue = "") {
  select.innerHTML = options.map((option) => {
    const selected = option === selectedValue ? " selected" : "";
    return `<option value="${escapeAttr(option)}"${selected}>${escapeHtml(option)}</option>`;
  }).join("");
}

function renderStateOptions(selectedValue = "") {
  setOptions($("#student-state"), states, selectedValue || states[0] || "");
  renderDistrictOptions();
}

function renderDistrictOptions(selectedValue = "") {
  const state = $("#student-state").value;
  const districts = locations[state] || [];
  setOptions($("#student-district"), districts, selectedValue || districts[0] || "");
  renderSchoolOptions();
}

function renderSchoolOptions(selectedValue = "") {
  const state = $("#student-state").value;
  const district = $("#student-district").value;
  const names = [...new Set([
    ...registeredSchools.filter((school) => school.state === state && school.district === district).map((school) => school.name),
    ...registeredStudents.filter((student) => student.state === state && student.district === district).map((student) => student.school)
  ].filter(Boolean))].sort();
  setOptions($("#student-school"), names, selectedValue || names[0] || "");
  if (!names.length) $("#student-school").innerHTML = '<option value="">Register a school first</option>';
}

function renderStaticOptions() {
  setOptions($("#student-grade"), Array.from({ length: 12 }, (_, index) => String(index + 1)));
  [
    "#other-physical-disabilities",
    "#cognitive-disabilities",
    "#is-braille-literate",
    "#knows-taylor-frame",
    "#knows-nemeth",
    "#knows-using-computer",
    "#knows-maths-on-computer"
  ].forEach((selector) => setOptions($(selector), yesNo, "No"));
  setOptions($("#braille-reading-level"), brailleLevels);
  setOptions($("#braille-writing-level"), brailleLevels);
}

function loadStudents() {
  try {
    const stored = localStorage.getItem(STUDENTS_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(STUDENTS_STORAGE_KEY);
    return [];
  }
}

function loadSchools() {
  try { const parsed = JSON.parse(localStorage.getItem(SCHOOLS_STORAGE_KEY) || "[]"); return Array.isArray(parsed) ? parsed : []; }
  catch { return []; }
}

function persistStudents() {
  localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(registeredStudents));
}

function renderStudentsTable() {
  $("#students-count").textContent = `${registeredStudents.length} student${registeredStudents.length === 1 ? "" : "s"}`;
  if (!registeredStudents.length) {
    $("#registered-students-table").innerHTML = '<tr><td colspan="10" class="empty-table-cell">No students registered yet.</td></tr>';
    return;
  }
  $("#registered-students-table").innerHTML = registeredStudents.map((student) => `
    <tr>
      <td data-label="State">${escapeHtml(student.state)}</td>
      <td data-label="District">${escapeHtml(student.district)}</td>
      <td data-label="School">${escapeHtml(student.school)}</td>
      <td data-label="Name"><strong>${escapeHtml(student.name)}</strong></td>
      <td data-label="Gender">${escapeHtml(student.gender)}</td>
      <td data-label="Grade">${escapeHtml(student.grade)}</td>
      <td data-label="Vision level">${escapeHtml(student.visionLevel)}</td>
      <td data-label="Braille">${escapeHtml(student.isBrailleLiterate)}; read ${escapeHtml(student.brailleReadingLevel)}; write ${escapeHtml(student.brailleWritingLevel)}</td>
      <td data-label="Computer">${escapeHtml(student.knowsUsingComputer)}; maths ${escapeHtml(student.knowsMathsOnComputer)}</td>
      <td data-label="Actions">
        <div class="student-actions">
          <button type="button" data-edit-student="${escapeAttr(student.id)}">Edit</button>
          <button class="danger" type="button" data-delete-student="${escapeAttr(student.id)}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function collectForm() {
  return {
    id: $("#student-id").value || makeId("student"),
    state: $("#student-state").value,
    district: $("#student-district").value,
    school: $("#student-school").value.trim(),
    name: $("#student-name").value.trim(),
    gender: $("#student-gender").value,
    grade: Number($("#student-grade").value),
    boardOfEducation: $("#board-of-education").value.trim(),
    visionLevel: $("#vision-level").value,
    regionalLanguage: $("#regional-language").value.trim(),
    otherPhysicalDisabilities: $("#other-physical-disabilities").value,
    cognitiveDisabilities: $("#cognitive-disabilities").value,
    isBrailleLiterate: $("#is-braille-literate").value,
    brailleReadingLevel: $("#braille-reading-level").value,
    brailleWritingLevel: $("#braille-writing-level").value,
    knowsTaylorFrame: $("#knows-taylor-frame").value,
    knowsNemeth: $("#knows-nemeth").value,
    knowsUsingComputer: $("#knows-using-computer").value,
    knowsMathsOnComputer: $("#knows-maths-on-computer").value
  };
}

async function saveStudent(event) {
  event.preventDefault();
  const student = collectForm();
  if (!student.name || !student.school) {
    toast("Student name and school are required.");
    return;
  }
  try {
    if (window.StemLabStore?.isEnabled()) {
      const saved = await window.StemLabStore.saveRegisteredStudent(student);
      student.id = saved.id;
    }
  } catch (error) {
    console.error("Student database save failed", error);
    toast("Saved in this browser; database save failed.");
  }
  const index = registeredStudents.findIndex((item) => item.id === student.id || (
    item.name === student.name && item.state === student.state && item.school === student.school
  ));
  if (index >= 0) {
    registeredStudents[index] = student;
  } else {
    registeredStudents.push(student);
  }
  persistStudents();
  resetForm();
  renderStudentsTable();
  setStatus("Saved");
  toast("Student saved");
}

function editStudent(studentId) {
  const student = registeredStudents.find((item) => item.id === studentId);
  if (!student) return;
  $("#student-id").value = student.id;
  renderStateOptions(student.state);
  renderDistrictOptions(student.district);
  renderSchoolOptions(student.school);
  $("#student-name").value = student.name;
  $("#student-gender").value = student.gender;
  $("#student-grade").value = String(student.grade);
  $("#board-of-education").value = student.boardOfEducation || "";
  $("#vision-level").value = student.visionLevel;
  $("#regional-language").value = student.regionalLanguage || "";
  $("#other-physical-disabilities").value = student.otherPhysicalDisabilities;
  $("#cognitive-disabilities").value = student.cognitiveDisabilities;
  $("#is-braille-literate").value = student.isBrailleLiterate;
  $("#braille-reading-level").value = student.brailleReadingLevel;
  $("#braille-writing-level").value = student.brailleWritingLevel;
  $("#knows-taylor-frame").value = student.knowsTaylorFrame;
  $("#knows-nemeth").value = student.knowsNemeth;
  $("#knows-using-computer").value = student.knowsUsingComputer;
  $("#knows-maths-on-computer").value = student.knowsMathsOnComputer;
  $("#save-student").textContent = "Update student";
  setStatus("Editing");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteStudent(studentId) {
  const student = registeredStudents.find((item) => item.id === studentId);
  if (!student || !confirm(`Delete ${student.name} from registered students?`)) return;
  registeredStudents = registeredStudents.filter((item) => item.id !== studentId);
  persistStudents();
  try {
    if (window.StemLabStore?.isEnabled()) await window.StemLabStore.deleteRegisteredStudent(studentId);
  } catch (error) {
    console.error("Student database delete failed", error);
    toast("Deleted in this browser; database delete failed.");
  }
  renderStudentsTable();
  setStatus("Deleted");
  toast("Student deleted");
}

function resetForm() {
  $("#student-registration-form").reset();
  $("#student-id").value = "";
  renderStateOptions();
  $("#save-student").textContent = "Add student";
  setStatus("Ready");
}

function handleTableClick(event) {
  const editButton = event.target.closest("[data-edit-student]");
  const deleteButton = event.target.closest("[data-delete-student]");
  if (editButton) editStudent(editButton.dataset.editStudent);
  if (deleteButton) deleteStudent(deleteButton.dataset.deleteStudent);
}

function setStatus(message) {
  $("#students-status").textContent = message;
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

async function initializeStudents() {
  if (!window.StemLabStore?.isEnabled()) return;
  setStatus("Loading");
  const [studentResult, schoolResult] = await Promise.allSettled([
    window.StemLabStore.loadRegisteredStudents(),
    window.StemLabStore.loadSchools()
  ]);
  try {
    if (studentResult.status === "fulfilled") registeredStudents = studentResult.value;
    if (schoolResult.status === "fulfilled") registeredSchools = schoolResult.value;
    persistStudents();
    localStorage.setItem(SCHOOLS_STORAGE_KEY, JSON.stringify(registeredSchools));
    const firstStudent = registeredStudents[0];
    renderStateOptions(firstStudent?.state || "");
    if (firstStudent) {
      renderDistrictOptions(firstStudent.district);
      renderSchoolOptions(firstStudent.school);
    }
    renderStudentsTable();
    setStatus(studentResult.status === "fulfilled" ? "Database connected" : "Browser data");
    if (studentResult.status === "rejected") throw studentResult.reason;
    if (schoolResult.status === "rejected") toast("Students loaded. Run the updated schema to use registered school dropdowns.");
  } catch (error) {
    console.error("Student database load failed", error);
    setStatus("Browser data");
    toast("Could not load shared students from Supabase.");
  }
}

renderStaticOptions();
renderStateOptions();
renderStudentsTable();
initializeStudents();

$("#student-state").addEventListener("change", () => renderDistrictOptions());
$("#student-district").addEventListener("change", () => renderSchoolOptions());
$("#student-registration-form").addEventListener("submit", saveStudent);
$("#reset-student-form").addEventListener("click", resetForm);
$("#registered-students-table").addEventListener("click", handleTableClick);
