const SCHOOLS_KEY = "veStemLabSchools.v1";
const FACILITATORS_KEY = "veStemLabFacilitators.v1";
const locations = window.INDIA_LOCATIONS || {};
const states = window.INDIA_STATES || Object.keys(locations).sort((a, b) => a.localeCompare(b));
const $ = (selector) => document.querySelector(selector);
let schools = loadArray(SCHOOLS_KEY);
let facilitators = loadArray(FACILITATORS_KEY);

function loadArray(key) {
  try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function persist() {
  localStorage.setItem(SCHOOLS_KEY, JSON.stringify(schools));
  localStorage.setItem(FACILITATORS_KEY, JSON.stringify(facilitators));
}
function setOptions(select, options, selected = "") {
  select.innerHTML = options.map((value) => `<option${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`).join("");
}
function renderSchoolState(selected = "") { setOptions($("#school-state"), states, selected || states[0]); renderSchoolDistrict(); }
function renderSchoolDistrict(selected = "") {
  const districts = locations[$("#school-state").value] || [];
  setOptions($("#school-district"), districts, selected || districts[0]);
}
function renderFacilitatorState(selected = "") { setOptions($("#facilitator-state"), states, selected || states[0]); }
function renderView() {
  const type = $("#registration-type").value;
  $("#schools-registration").hidden = type !== "schools";
  $("#facilitators-registration").hidden = type !== "facilitators";
  $("#students-registration").hidden = type !== "students";
  history.replaceState(null, "", `#${type}`);
}
function renderSchools() {
  $("#schools-count").textContent = `${schools.length} school${schools.length === 1 ? "" : "s"}`;
  $("#schools-table").innerHTML = schools.length ? schools.map((school) => `<tr>
    <td data-label="State">${escapeHtml(school.state)}</td><td data-label="District">${escapeHtml(school.district)}</td>
    <td data-label="School name"><strong>${escapeHtml(school.name)}</strong></td><td data-label="Address">${escapeHtml(school.address || "Not set")}</td>
    <td data-label="School type">${escapeHtml(school.schoolType)}</td><td data-label="Actions"><div class="student-actions">
    <button type="button" data-edit-school="${escapeAttr(school.id)}">Edit</button><button class="danger" type="button" data-delete-school="${escapeAttr(school.id)}">Delete</button>
    </div></td></tr>`).join("") : '<tr><td colspan="6" class="empty-table-cell">No schools registered yet.</td></tr>';
}
function renderFacilitators() {
  $("#facilitators-count").textContent = `${facilitators.length} facilitator${facilitators.length === 1 ? "" : "s"}`;
  $("#facilitators-table").innerHTML = facilitators.length ? facilitators.map((item) => `<tr>
    <td data-label="State">${escapeHtml(item.state)}</td><td data-label="Name"><strong>${escapeHtml(`${item.firstName} ${item.lastName}`)}</strong></td>
    <td data-label="Contact">${escapeHtml(item.email)}<br>${escapeHtml(item.phone)}${item.alternatePhone ? `<br>${escapeHtml(item.alternatePhone)}` : ""}</td>
    <td data-label="Designation">${escapeHtml(item.designation || "Not set")}</td><td data-label="Qualification">${escapeHtml(item.qualification || "Not set")}</td>
    <td data-label="Educator roles">Special Educator: ${escapeHtml(item.isSpecialEducator)}<br>Educator: ${escapeHtml(item.isEducator)}</td>
    <td data-label="Actions"><div class="student-actions"><button type="button" data-edit-facilitator="${escapeAttr(item.id)}">Edit</button>
    <button class="danger" type="button" data-delete-facilitator="${escapeAttr(item.id)}">Delete</button></div></td></tr>`).join("") : '<tr><td colspan="7" class="empty-table-cell">No facilitators registered yet.</td></tr>';
}
async function saveSchool(event) {
  event.preventDefault();
  const item = { id: $("#school-id").value || makeId("school"), state: $("#school-state").value, district: $("#school-district").value,
    name: $("#school-name").value.trim(), address: $("#school-address").value.trim(), schoolType: $("#school-type").value };
  const index = schools.findIndex((school) => school.id === item.id); if (index >= 0) schools[index] = item; else schools.push(item);
  persist(); renderSchools(); resetSchool(); await saveRemote("saveSchool", item, "School");
}
async function saveFacilitator(event) {
  event.preventDefault();
  const item = { id: $("#facilitator-id").value || makeId("facilitator"), state: $("#facilitator-state").value,
    firstName: $("#facilitator-first-name").value.trim(), lastName: $("#facilitator-last-name").value.trim(), email: $("#facilitator-email").value.trim(),
    phone: $("#facilitator-phone").value.trim(), alternatePhone: $("#facilitator-alternate-phone").value.trim(), designation: $("#facilitator-designation").value.trim(),
    qualification: $("#facilitator-qualification").value.trim(), isSpecialEducator: $("#facilitator-special-educator").value, isEducator: $("#facilitator-educator").value };
  const index = facilitators.findIndex((entry) => entry.id === item.id); if (index >= 0) facilitators[index] = item; else facilitators.push(item);
  persist(); renderFacilitators(); resetFacilitator(); await saveRemote("saveFacilitator", item, "Facilitator");
}
async function saveRemote(method, item, label) {
  try { if (window.StemLabStore?.isEnabled()) await window.StemLabStore[method](item); setStatus("Database connected"); toast(`${label} saved`); }
  catch (error) { console.error(`${label} database save failed`, error); setStatus("Browser data"); toast(`${label} saved in this browser. Run the updated schema for shared data.`); }
}
function editSchool(id) {
  const item = schools.find((school) => school.id === id); if (!item) return; $("#school-id").value = item.id; renderSchoolState(item.state); renderSchoolDistrict(item.district);
  $("#school-name").value = item.name; $("#school-address").value = item.address; $("#school-type").value = item.schoolType; $("#save-school").textContent = "Update school"; window.scrollTo({ top: 0, behavior: "smooth" });
}
function editFacilitator(id) {
  const item = facilitators.find((entry) => entry.id === id); if (!item) return; $("#facilitator-id").value = item.id; renderFacilitatorState(item.state);
  ["firstName","lastName","email","phone","alternatePhone","designation","qualification"].forEach((key) => $(`#facilitator-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`).value = item[key]);
  $("#facilitator-special-educator").value = item.isSpecialEducator; $("#facilitator-educator").value = item.isEducator; $("#save-facilitator").textContent = "Update facilitator"; window.scrollTo({ top: 0, behavior: "smooth" });
}
async function deleteSchool(id) { const item = schools.find((school) => school.id === id); if (!item || !confirm(`Delete ${item.name}?`)) return; schools = schools.filter((school) => school.id !== id); persist(); renderSchools(); await deleteRemote("deleteSchool", id, "School"); }
async function deleteFacilitator(id) { const item = facilitators.find((entry) => entry.id === id); if (!item || !confirm(`Delete ${item.firstName} ${item.lastName}?`)) return; facilitators = facilitators.filter((entry) => entry.id !== id); persist(); renderFacilitators(); await deleteRemote("deleteFacilitator", id, "Facilitator"); }
async function deleteRemote(method, id, label) { try { if (window.StemLabStore?.isEnabled()) await window.StemLabStore[method](id); toast(`${label} deleted`); } catch (error) { console.error(`${label} database delete failed`, error); toast(`${label} deleted in this browser only.`); } }
function resetSchool() { $("#school-form").reset(); $("#school-id").value = ""; renderSchoolState(); $("#save-school").textContent = "Add school"; }
function resetFacilitator() { $("#facilitator-form").reset(); $("#facilitator-id").value = ""; renderFacilitatorState(); $("#save-facilitator").textContent = "Add facilitator"; }
async function initialize() {
  if (!window.StemLabStore?.isEnabled()) return; setStatus("Loading");
  const [schoolResult, facilitatorResult] = await Promise.allSettled([window.StemLabStore.loadSchools(), window.StemLabStore.loadFacilitators()]);
  if (schoolResult.status === "fulfilled") schools = schoolResult.value;
  if (facilitatorResult.status === "fulfilled") facilitators = facilitatorResult.value;
  persist(); renderSchools(); renderFacilitators();
  setStatus(schoolResult.status === "fulfilled" && facilitatorResult.status === "fulfilled" ? "Database connected" : "Browser data");
  if (schoolResult.status === "rejected" || facilitatorResult.status === "rejected") toast("Run the updated supabase-schema.sql to enable shared registrations.");
}
function setStatus(value) { $("#registration-status").textContent = value; }
function toast(value) { const element = $("#toast"); element.textContent = value; clearTimeout(element.timer); element.timer = setTimeout(() => element.textContent = "", 3000); }
function makeId(prefix) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
function escapeHtml(value) { return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function escapeAttr(value) { return escapeHtml(value).replace(/\n/g, " "); }

renderSchoolState(); renderFacilitatorState(); renderSchools(); renderFacilitators();
const initialType = ["#facilitators", "#students"].includes(location.hash) ? location.hash.slice(1) : "schools"; $("#registration-type").value = initialType; renderView(); initialize();
$("#registration-type").addEventListener("change", renderView); $("#school-state").addEventListener("change", () => renderSchoolDistrict());
$("#school-form").addEventListener("submit", saveSchool); $("#facilitator-form").addEventListener("submit", saveFacilitator);
$("#clear-school").addEventListener("click", resetSchool); $("#clear-facilitator").addEventListener("click", resetFacilitator);
$("#schools-table").addEventListener("click", (event) => { const edit = event.target.closest("[data-edit-school]"); const remove = event.target.closest("[data-delete-school]"); if (edit) editSchool(edit.dataset.editSchool); if (remove) deleteSchool(remove.dataset.deleteSchool); });
$("#facilitators-table").addEventListener("click", (event) => { const edit = event.target.closest("[data-edit-facilitator]"); const remove = event.target.closest("[data-delete-facilitator]"); if (edit) editFacilitator(edit.dataset.editFacilitator); if (remove) deleteFacilitator(remove.dataset.deleteFacilitator); });
