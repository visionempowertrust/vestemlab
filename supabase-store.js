(function () {
  const config = window.STEMLAB_SUPABASE_CONFIG || {};
  const client = config.enabled && config.url && config.publishableKey && window.supabase
    ? window.supabase.createClient(config.url, config.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
    : null;

  function isEnabled() {
    return Boolean(client);
  }

  async function loadLabData() {
    const [resourcesResult, manualsResult] = await Promise.all([
      client.from("stemlab_resources").select("*").order("sort_order", { ascending: true }),
      client.from("stemlab_manuals").select("*").order("name", { ascending: true })
    ]);
    throwFirst(resourcesResult.error, manualsResult.error);
    return {
      resources: (resourcesResult.data || []).map(fromResourceRow),
      manuals: (manualsResult.data || []).map(fromManualRow)
    };
  }

  async function ensureLabSeed(resources, manuals) {
    const current = await loadLabData();
    const resourceIds = new Set(current.resources.map((item) => item.id));
    const manualIds = new Set(current.manuals.map((item) => item.id));
    const missingResources = resources.filter((item) => !resourceIds.has(item.id));
    const missingManuals = manuals.filter((item) => !manualIds.has(item.id));
    if (missingResources.length) {
      const { error } = await client.from("stemlab_resources").insert(missingResources.map(toResourceRow));
      if (error) throw error;
    }
    if (missingManuals.length) {
      const { error } = await client.from("stemlab_manuals").insert(missingManuals.map(toManualRow));
      if (error) throw error;
    }
    return loadLabData();
  }

  async function saveResource(resource) {
    const { error } = await client.from("stemlab_resources").upsert(toResourceRow(resource));
    if (error) throw error;
  }

  async function deleteResource(id) {
    const { error } = await client.from("stemlab_resources").delete().eq("id", id);
    if (error) throw error;
  }

  async function saveManual(manual) {
    const { error } = await client.from("stemlab_manuals").upsert(toManualRow(manual));
    if (error) throw error;
  }

  async function deleteManual(id) {
    const { error } = await client.from("stemlab_manuals").delete().eq("id", id);
    if (error) throw error;
  }

  async function loadRegisteredStudents() {
    const { data, error } = await client.from("registered_students").select("*")
      .order("state", { ascending: true }).order("school", { ascending: true }).order("name", { ascending: true });
    if (error) throw error;
    return (data || []).map(fromStudentRow);
  }

  async function ensureRegisteredStudents(localStudents) {
    const remote = await loadRegisteredStudents();
    const keys = new Set(remote.map(studentKey));
    for (const student of localStudents) {
      if (!keys.has(studentKey(student))) await saveRegisteredStudent({ ...student, id: "" });
    }
    return loadRegisteredStudents();
  }

  async function saveRegisteredStudent(student) {
    const row = toStudentRow(student);
    const query = row.id
      ? client.from("registered_students").upsert(row).select("*").single()
      : client.from("registered_students").insert(row).select("*").single();
    const { data, error } = await query;
    if (error) throw error;
    return fromStudentRow(data);
  }

  async function deleteRegisteredStudent(id) {
    const { error } = await client.from("registered_students").delete().eq("id", id);
    if (error) throw error;
  }

  async function loadSessions() {
    const { data, error } = await client.from("stemlab_sessions").select("*").order("session_date", { ascending: false });
    if (error) throw error;
    return (data || []).map(fromSessionRow);
  }

  async function ensureSessions(localSessions) {
    const remote = await loadSessions();
    const ids = new Set(remote.map((item) => item.id));
    const missing = localSessions.filter((item) => !ids.has(item.id));
    if (missing.length) {
      const { error } = await client.from("stemlab_sessions").insert(missing.map(toSessionRow));
      if (error) throw error;
    }
    return loadSessions();
  }

  async function saveSession(session) {
    const { error } = await client.from("stemlab_sessions").upsert(toSessionRow(session));
    if (error) throw error;
  }

  async function deleteSession(id) {
    const { error } = await client.from("stemlab_sessions").delete().eq("id", id);
    if (error) throw error;
  }

  async function loadSchools() {
    const { data, error } = await client.from("stemlab_schools").select("*")
      .order("state", { ascending: true }).order("school_name", { ascending: true });
    if (error) throw error;
    return (data || []).map(fromSchoolRow);
  }

  async function saveSchool(school) {
    const { error } = await client.from("stemlab_schools").upsert(toSchoolRow(school));
    if (error) throw error;
  }

  async function deleteSchool(id) {
    const { error } = await client.from("stemlab_schools").delete().eq("id", id);
    if (error) throw error;
  }

  async function loadFacilitators() {
    const { data, error } = await client.from("stemlab_facilitators").select("*")
      .order("state", { ascending: true }).order("first_name", { ascending: true });
    if (error) throw error;
    return (data || []).map(fromFacilitatorRow);
  }

  async function saveFacilitator(facilitator) {
    const { error } = await client.from("stemlab_facilitators").upsert(toFacilitatorRow(facilitator));
    if (error) throw error;
  }

  async function deleteFacilitator(id) {
    const { error } = await client.from("stemlab_facilitators").delete().eq("id", id);
    if (error) throw error;
  }

  function toResourceRow(item) {
    return { id: item.id, subject: item.subject, name: item.name, image: item.image || null, video: item.video || null,
      supplier: item.supplier || null, uses: item.uses || null, tags: item.tags || [], sort_order: item.sortOrder || 0 };
  }
  function fromResourceRow(row) {
    return { id: row.id, subject: row.subject, name: row.name, image: row.image || "", video: row.video || "",
      supplier: row.supplier || "", uses: row.uses || "", tags: row.tags || [], sortOrder: row.sort_order || 0 };
  }
  function toManualRow(item) {
    return { id: item.id, subject: item.subject, name: item.name, objective: item.objective || null,
      resource_ids: item.resourceIds || [], other_resources: item.otherResources || null, steps: item.steps || null,
      observations: item.observations || null, inferences: item.inferences || null, concepts: item.concepts || null };
  }
  function fromManualRow(row) {
    return { id: row.id, subject: row.subject, name: row.name, objective: row.objective || "",
      resourceIds: row.resource_ids || [], otherResources: row.other_resources || "", steps: row.steps || "",
      observations: row.observations || "", inferences: row.inferences || "", concepts: row.concepts || "" };
  }
  function toStudentRow(item) {
    const row = { state: item.state, district: item.district, school: item.school, name: item.name, gender: item.gender,
      grade: Number(item.grade), board_of_education: item.boardOfEducation || null, vision_level: item.visionLevel,
      regional_language: item.regionalLanguage || null, other_physical_disabilities: item.otherPhysicalDisabilities,
      cognitive_disabilities: item.cognitiveDisabilities, is_braille_literate: item.isBrailleLiterate,
      braille_reading_level: item.brailleReadingLevel, braille_writing_level: item.brailleWritingLevel,
      knows_taylor_frame: item.knowsTaylorFrame, knows_nemeth: item.knowsNemeth,
      knows_using_computer: item.knowsUsingComputer, knows_maths_on_computer: item.knowsMathsOnComputer };
    if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(item.id || "")) row.id = item.id;
    return row;
  }
  function fromStudentRow(row) {
    return { id: row.id, state: row.state || "", district: row.district || "", school: row.school || "", name: row.name || "",
      gender: row.gender || "", grade: row.grade || "", boardOfEducation: row.board_of_education || "",
      visionLevel: row.vision_level || "", regionalLanguage: row.regional_language || "",
      otherPhysicalDisabilities: row.other_physical_disabilities || "", cognitiveDisabilities: row.cognitive_disabilities || "",
      isBrailleLiterate: row.is_braille_literate || "", brailleReadingLevel: row.braille_reading_level || "",
      brailleWritingLevel: row.braille_writing_level || "", knowsTaylorFrame: row.knows_taylor_frame || "",
      knowsNemeth: row.knows_nemeth || "", knowsUsingComputer: row.knows_using_computer || "",
      knowsMathsOnComputer: row.knows_maths_on_computer || "" };
  }
  function toSessionRow(item) {
    return { id: item.id, facilitator: item.facilitator, session_date: item.date, state: item.state, school: item.school,
      subject: item.subject, activity_id: item.activityId, activity_name: item.activityName,
      concept_criteria: item.conceptCriteria || [], attendance: item.attendance || [] };
  }
  function fromSessionRow(row) {
    return { id: row.id, facilitator: row.facilitator || "", date: row.session_date, state: row.state || "", school: row.school || "",
      subject: row.subject || "", activityId: row.activity_id || "", activityName: row.activity_name || "",
      conceptCriteria: row.concept_criteria || [], attendance: row.attendance || [] };
  }
  function toSchoolRow(item) {
    return { id: item.id, state: item.state, district: item.district, school_name: item.name,
      address: item.address || null, school_type: item.schoolType };
  }
  function fromSchoolRow(row) {
    return { id: row.id, state: row.state || "", district: row.district || "", name: row.school_name || "",
      address: row.address || "", schoolType: row.school_type || "" };
  }
  function toFacilitatorRow(item) {
    return { id: item.id, state: item.state, first_name: item.firstName, last_name: item.lastName,
      email: item.email, phone: item.phone, alternate_phone: item.alternatePhone || null,
      designation: item.designation || null, qualification: item.qualification || null,
      is_special_educator: item.isSpecialEducator === "Yes", is_educator: item.isEducator === "Yes" };
  }
  function fromFacilitatorRow(row) {
    return { id: row.id, state: row.state || "", firstName: row.first_name || "", lastName: row.last_name || "",
      email: row.email || "", phone: row.phone || "", alternatePhone: row.alternate_phone || "",
      designation: row.designation || "", qualification: row.qualification || "",
      isSpecialEducator: row.is_special_educator ? "Yes" : "No", isEducator: row.is_educator ? "Yes" : "No" };
  }
  function studentKey(item) {
    return [item.name, item.state, item.school].map((value) => String(value || "").trim().toLowerCase()).join("::");
  }
  function throwFirst(...errors) {
    const error = errors.find(Boolean);
    if (error) throw error;
  }

  window.StemLabStore = { isEnabled, loadLabData, ensureLabSeed, saveResource, deleteResource, saveManual, deleteManual,
    loadRegisteredStudents, ensureRegisteredStudents, saveRegisteredStudent, deleteRegisteredStudent,
    loadSessions, ensureSessions, saveSession, deleteSession,
    loadSchools, saveSchool, deleteSchool, loadFacilitators, saveFacilitator, deleteFacilitator };
})();
