// ============================================================
// WorkHub Pro - React Migration
// ============================================================
// STRUCTURE (all in one file for simplicity, split into
// logical sections so you can easily extract into files):
//
//  1. utils/storage.js  — all localStorage helpers
//  2. utils/helpers.js  — business logic (tasks, teams, etc.)
//  3. components/Badge         — reusable status badge
//  4. components/ProgressBar   — reusable progress bar
//  5. components/Navbar        — top bar with logout
//  6. components/ProjectCard   — single project card (client view)
//  7. components/TaskCard      — single task card
//  8. components/FreelancerCard — freelancer profile card
//  9. components/SubmissionCard — work submission card
// 10. pages/LoginPage          — login / register screen
// 11. pages/ClientDashboard    — full client view
// 12. pages/FreelancerDashboard — full freelancer view
// 13. App                      — root; decides which page to show
// ============================================================

import { useState } from "react";

// ============================================================
// SECTION 1: STORAGE UTILITIES
// WHY: Keeping all localStorage calls in one place means you
// only need to change one function if the key ever changes.
// ============================================================
const KEYS = {
  USERS: "workhub_users_final",
  PROJECTS: "workhub_projects_final",
  INVITATIONS: "workhub_invitations_final",
  MEMBERS: "workhub_project_members_final",
  SUBMISSIONS: "workhub_submissions_final",
  SESSION: "workhub_session_final",
  TASKS: "workhub_tasks_final",
};

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch { return null; }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers()       { return read(KEYS.USERS)       || []; }
function saveUsers(v)     { write(KEYS.USERS, v); }
function getProjects()    { return read(KEYS.PROJECTS)    || []; }
function saveProjects(v)  { write(KEYS.PROJECTS, v); }
function getInvitations() { return read(KEYS.INVITATIONS) || []; }
function saveInvitations(v){ write(KEYS.INVITATIONS, v); }
function getMembers()     { return read(KEYS.MEMBERS)     || []; }
function saveMembers(v)   { write(KEYS.MEMBERS, v); }
function getSubmissions() { return read(KEYS.SUBMISSIONS) || []; }
function saveSubmissions(v){ write(KEYS.SUBMISSIONS, v); }
function getTasks()       { return read(KEYS.TASKS)       || []; }
function saveTasks(v)     { write(KEYS.TASKS, v); }
function getSession()     { return read(KEYS.SESSION); }
function setSession(email, role) { write(KEYS.SESSION, { email, role }); }
function clearSession()   { localStorage.removeItem(KEYS.SESSION); }

// ============================================================
// SECTION 2: BUSINESS LOGIC HELPERS
// WHY: Pure functions are easy to test and explain — no DOM,
// no React, just data in → data out.
// ============================================================

function findUser(email) {
  return getUsers().find(u => u.email === email) || null;
}

function getMembersByProject(projectId) {
  const record = getMembers().find(pm => pm.projectId === projectId);
  return record ? record.members : [];
}

function addMemberToProject(projectId, freelancerEmail) {
  let list = getMembers();
  let record = list.find(pm => pm.projectId === projectId);
  if (!record) {
    record = { projectId, members: [] };
    list.push(record);
  }
  if (!record.members.some(m => m.freelancerEmail === freelancerEmail)) {
    record.members.push({ freelancerEmail, joinedAt: Date.now() });
    saveMembers(list);
  }
}

function getTasksByProject(projectId) {
  return getTasks().filter(t => t.projectId === projectId);
}

function getTasksByFreelancer(projectId, email) {
  return getTasks().filter(t => t.projectId === projectId && t.assignedTo === email);
}

function projectProgress(projectId) {
  const tasks = getTasksByProject(projectId);
  if (!tasks.length) return 0;
  return Math.round(tasks.filter(t => t.status === "completed").length / tasks.length * 100);
}

function freelancerProgress(projectId, email) {
  const tasks = getTasksByFreelancer(projectId, email);
  if (!tasks.length) return 0;
  return Math.round(tasks.filter(t => t.status === "completed").length / tasks.length * 100);
}

function initStorage() {
  if (!localStorage.getItem(KEYS.USERS)) {
    write(KEYS.USERS, [
      { email: "client@demo.com", role: "client", name: "John Client", registered: true },
      { email: "alice@dev.com", role: "freelancer", name: "Alice Johnson", category: "Full Stack Developer", phone: "+1234567890", image: "https://randomuser.me/api/portraits/women/1.jpg", pastExperience: "7 years in React, Node.js, Python" },
      { email: "bob@design.com", role: "freelancer", name: "Bob Smith", category: "UI/UX Designer", phone: "+1234567891", image: "https://randomuser.me/api/portraits/men/2.jpg", pastExperience: "5 years in Figma, Adobe XD" },
      { email: "carol@dev.com", role: "freelancer", name: "Carol Davis", category: "Backend Developer", phone: "+1234567892", image: "https://randomuser.me/api/portraits/women/2.jpg", pastExperience: "4 years in Python, Django, PostgreSQL" },
    ]);
  }
  if (!localStorage.getItem(KEYS.PROJECTS))    write(KEYS.PROJECTS, []);
  if (!localStorage.getItem(KEYS.INVITATIONS)) write(KEYS.INVITATIONS, []);
  if (!localStorage.getItem(KEYS.MEMBERS))     write(KEYS.MEMBERS, []);
  if (!localStorage.getItem(KEYS.SUBMISSIONS)) write(KEYS.SUBMISSIONS, []);
  if (!localStorage.getItem(KEYS.TASKS))       write(KEYS.TASKS, []);
}

// ============================================================
// SECTION 3: REUSABLE COMPONENTS
// WHY: Instead of copy-pasting the same HTML in every template
// string, we make small components. If you want to change how
// a badge looks, you change it in ONE place.
// ============================================================

// --- Badge ---
// Props: status ("available" | "pending" | "hired" | "approved" | "rejected")
// WHY: Badge is used in every card. One component = one place to style it.
function Badge({ status, children }) {
  const map = {
    available: { bg: "#bee3f8", color: "#2c5282" },
    pending:   { bg: "#fefcbf", color: "#975a16" },
    hired:     { bg: "#c6f6d5", color: "#22543d" },
    approved:  { bg: "#c6f6d5", color: "#22543d" },
    rejected:  { bg: "#fed7d7", color: "#9b2c2c" },
  };
  const style = map[status] || { bg: "#e2e8f0", color: "#4a5568" };
  return (
    <span style={{
      padding: "0.2rem 0.7rem", borderRadius: "50px",
      fontSize: "0.75rem", fontWeight: 600,
      background: style.bg, color: style.color,
    }}>
      {children}
    </span>
  );
}

// --- ProgressBar ---
// Props: percent (number 0-100)
function ProgressBar({ percent }) {
  return (
    <div style={{ background: "#e2e8f0", borderRadius: "50px", height: 8, overflow: "hidden", margin: "0.5rem 0" }}>
      <div style={{
        width: `${percent}%`, height: "100%",
        background: "linear-gradient(90deg, #48bb78, #38a169)",
        transition: "width 0.3s ease",
      }} />
    </div>
  );
}

// --- Navbar ---
// Props: title, email, onLogout, onEditProfile (optional)
// WHY: Every dashboard has the same top bar. One component handles both
// client and freelancer — we just pass different props.
function Navbar({ title, email, onLogout, onEditProfile }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
      <h2 style={{ fontSize: "1.5rem", color: "#2d3748", borderLeft: "4px solid #667eea", paddingLeft: "1rem" }}>{title}</h2>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        {onEditProfile && (
          <button onClick={onEditProfile} style={styles.btnOutline}>✏️ Edit Profile</button>
        )}
        <button onClick={onLogout} style={styles.btnDanger}>Logout</button>
      </div>
    </div>
  );
}

// --- TaskCard ---
// Props: task, assigneeName, isClient, freelancerEmail, onUpdateTask, onEditTask, onDeleteTask
// WHY: Tasks appear in both Client and Freelancer dashboards.
// Same card, different action buttons based on `isClient`.
function TaskCard({ task, assigneeName, isClient, freelancerEmail, onUpdateTask, onEditTask, onDeleteTask }) {
  const bgMap = { completed: "#c6f6d5", "in-progress": "#fefcbf", todo: "#edf2f7" };
  const statusMap = { completed: "approved", "in-progress": "pending", todo: "available" };

  return (
    <div style={{ ...styles.card, background: bgMap[task.status] || "#edf2f7" }}>
      <div style={styles.flexBetween}>
        <strong>{task.title}</strong>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
          <Badge status={statusMap[task.status]}>{task.status.toUpperCase()}</Badge>
          {isClient && (
            <>
              <button onClick={() => onEditTask(task)} style={styles.btnOutlineSm}>✏️ Edit</button>
              <button onClick={() => onDeleteTask(task.id)} style={styles.btnDangerSm}>🗑️ Delete</button>
            </>
          )}
        </div>
      </div>
      <div>📝 {task.description}</div>
      {assigneeName && <div>👤 Assigned to: {assigneeName}</div>}
      <div>📅 Created: {new Date(task.createdAt).toLocaleDateString()}</div>
      {task.completedAt && <div>✅ Completed: {new Date(task.completedAt).toLocaleDateString()}</div>}

      {/* Freelancer task action buttons */}
      {!isClient && task.status !== "completed" && (
        <div style={{ marginTop: "0.8rem" }}>
          {task.status === "todo" ? (
            <button onClick={() => onUpdateTask(task.id, "in-progress")} style={styles.btnPrimarySm}>▶️ Start Task</button>
          ) : (
            <button onClick={() => onUpdateTask(task.id, "completed")} style={styles.btnSuccessSm}>✅ Mark Complete</button>
          )}
        </div>
      )}
    </div>
  );
}

// --- FreelancerCard ---
// Props: freelancer, onInvite (optional — only shown when inviting)
// WHY: Used in the "Hire Freelancers" page and the freelancer list.
function FreelancerCard({ freelancer, onInvite }) {
  return (
    <div style={styles.card}>
      <img
        src={freelancer.image || "https://via.placeholder.com/60"}
        alt={freelancer.name}
        style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "3px solid #667eea" }}
        onError={e => { e.target.src = "https://via.placeholder.com/60"; }}
      />
      <h3 style={{ margin: "0.5rem 0 0.3rem", fontSize: "1.1rem", color: "#2d3748" }}>{freelancer.name}</h3>
      <div><strong>📌 Category:</strong> {freelancer.category}</div>
      <div><strong>📞 Phone:</strong> {freelancer.phone}</div>
      <div><strong>🎓 Experience:</strong> {freelancer.pastExperience}</div>
      {onInvite && (
        <button onClick={() => onInvite(freelancer.email)} style={{ ...styles.btnPrimary, width: "100%", marginTop: "1rem" }}>
          📨 Send Invitation
        </button>
      )}
    </div>
  );
}

// --- SubmissionCard ---
// Props: submission, freelancerName, isClient, onApprove, onReject
// WHY: Submissions appear in both dashboards. Client sees approve/reject buttons.
function SubmissionCard({ submission: sub, freelancerName, isClient, onApprove, onReject }) {
  const bgMap = { pending: "#fefcbf", approved: "#c6f6d5", rejected: "#fed7d7" };
  return (
    <div style={{ ...styles.card, background: bgMap[sub.status] || "#f7fafc" }}>
      <div style={styles.flexBetween}>
        <strong>{sub.milestone}</strong>
        <Badge status={sub.status}>{sub.status.toUpperCase()}</Badge>
      </div>
      {freelancerName && <div>👤 Freelancer: {freelancerName}</div>}
      <div>📝 {sub.description}</div>
      <div>📎 Attachment: {sub.fileUrl}</div>
      <div>📅 Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</div>
      {isClient && sub.status === "pending" && (
        <div style={{ ...styles.flexBetween, marginTop: "0.8rem" }}>
          <button onClick={() => onApprove(sub.id)} style={styles.btnSuccess}>✅ Approve</button>
          <button onClick={() => onReject(sub.id)} style={{ ...styles.btnDanger, padding: "0.4rem 1.2rem", borderRadius: "50px", fontSize: "0.85rem", fontWeight: 600, border: "none", cursor: "pointer" }}>🔄 Reject</button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SECTION 4: LOGIN PAGE
// WHY: Separated into its own component so App.jsx stays clean.
// Uses useState to track which form is showing (client/freelancer/register).
// ============================================================
function LoginPage({ onLogin }) {
  // "view" controls what form is shown below the role buttons
  const [view, setView] = useState(""); // "" | "client" | "freelancer" | "register"
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [freelancerEmail, setFreelancerEmail] = useState("");
  const [reg, setReg] = useState({ name: "", category: "", phone: "", image: "", pastExperience: "" });

  function handleClientLogin() {
    if (!clientName.trim() || !clientEmail.trim()) return alert("Please fill all fields");
    const email = clientEmail.trim().toLowerCase();
    const existing = findUser(email);
    if (existing && existing.role !== "client") return alert("Email registered as freelancer");
    if (!existing) {
      const users = getUsers();
      users.push({ email, name: clientName.trim(), role: "client", registered: true });
      saveUsers(users);
    }
    setSession(email, "client");
    onLogin(email, "client");
  }

  function handleFreelancerCheck() {
    if (!freelancerEmail.trim()) return alert("Enter email");
    const email = freelancerEmail.trim().toLowerCase();
    const existing = findUser(email);
    if (existing && existing.role === "client") return alert("Email registered as client");
    if (existing && existing.role === "freelancer") {
      setSession(email, "freelancer");
      onLogin(email, "freelancer");
    } else {
      setView("register");
    }
  }

  function handleRegister() {
    const { name, category, phone, image, pastExperience } = reg;
    if (!name || !category || !phone || !image || !pastExperience) return alert("Please fill all fields");
    const email = freelancerEmail.trim().toLowerCase();
    const users = getUsers();
    users.push({ email, name, category, phone, image, pastExperience, role: "freelancer", registered: true });
    saveUsers(users);
    setSession(email, "freelancer");
    onLogin(email, "freelancer");
  }

  return (
    <div style={styles.loginCard}>
      <div style={{ textAlign: "center" }}>
        <h1 style={styles.gradientHeading}>FreeLancer Hub</h1>
        <p style={{ color: "#4a5568", marginTop: "0.5rem" }}>Complete Project Management Platform</p>
      </div>

      <div style={{ display: "flex", gap: "1rem", margin: "1.5rem 0", justifyContent: "center" }}>
        <button onClick={() => setView("client")} style={styles.btnPrimary}>📋 I'm a Client</button>
        <button onClick={() => setView("freelancer")} style={styles.btnOutline}>💼 I'm a Freelancer</button>
      </div>

      {/* CLIENT LOGIN FORM */}
      {view === "client" && (
        <div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input style={styles.input} placeholder="Enter your name" value={clientName} onChange={e => setClientName(e.target.value)} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" placeholder="client@example.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
          </div>
          <button onClick={handleClientLogin} style={{ ...styles.btnPrimary, width: "100%" }}>Continue →</button>
        </div>
      )}

      {/* FREELANCER EMAIL CHECK */}
      {(view === "freelancer" || view === "register") && (
        <div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" placeholder="freelancer@example.com" value={freelancerEmail} onChange={e => setFreelancerEmail(e.target.value)} />
          </div>
          {view === "freelancer" && (
            <button onClick={handleFreelancerCheck} style={{ ...styles.btnPrimary, width: "100%" }}>Check / Register →</button>
          )}
        </div>
      )}

      {/* FREELANCER REGISTRATION FORM */}
      {view === "register" && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", color: "#4a5568", marginBottom: "1rem" }}>📝 Register Freelancer</h3>
          {[
            { label: "Full Name", key: "name", placeholder: "Your full name" },
            { label: "Category", key: "category", placeholder: "e.g. React Developer" },
            { label: "Phone", key: "phone", placeholder: "+1234567890" },
            { label: "Profile Image URL", key: "image", placeholder: "https://..." },
          ].map(field => (
            <div key={field.key} style={styles.formGroup}>
              <label style={styles.label}>{field.label}</label>
              <input style={styles.input} placeholder={field.placeholder} value={reg[field.key]} onChange={e => setReg({ ...reg, [field.key]: e.target.value })} />
            </div>
          ))}
          <div style={styles.formGroup}>
            <label style={styles.label}>Past Experience</label>
            <textarea style={{ ...styles.input, minHeight: 80, resize: "vertical" }} value={reg.pastExperience} onChange={e => setReg({ ...reg, pastExperience: e.target.value })} />
          </div>
          <button onClick={handleRegister} style={{ ...styles.btnPrimary, width: "100%" }}>Register →</button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SECTION 5: CLIENT DASHBOARD
// WHY: All client-specific UI lives here. We use useState to
// track which sub-view is active (dashboard, hire, createTask, editTask)
// instead of re-rendering the whole page like the original code did.
// ============================================================
function ClientDashboard({ email, onLogout }) {
  // currentView controls which "page" inside the dashboard to show.
  // This replaces the original pattern of wiping innerHTML and writing new HTML.
  const [currentView, setCurrentView] = useState("dashboard"); // "dashboard" | "hire" | "createTask" | "editTask"
  const [selectedProject, setSelectedProject] = useState(null); // project object
  const [editingTask, setEditingTask] = useState(null);         // task object

  // Project creation form state
  const [newProject, setNewProject] = useState({ projectName: "", budget: "", description: "", details: "", deadline: "" });

  // Task creation form state
  const [newTask, setNewTask] = useState({ title: "", description: "", assignedTo: "" });

  // Edit task form state
  const [editTaskForm, setEditTaskForm] = useState({ title: "", description: "", assignedTo: "" });

  // --- Force re-render trick (used after localStorage writes) ---
  // WHY: React doesn't know when localStorage changes. We use a simple
  // counter that when incremented, causes the component to re-render
  // and re-read fresh data from localStorage.
  const [tick, setTick] = useState(0);
  function refresh() { setTick(t => t + 1); }

  // Read fresh data from localStorage on every render
  const projects = getProjects().filter(p => p.clientEmail === email);
  const invitations = getInvitations().filter(i => i.clientEmail === email);
  const submissions = getSubmissions();

  // ---- ACTION HANDLERS ----

  function handleCreateProject() {
    const { projectName, budget, description, details, deadline } = newProject;
    if (!projectName || !budget || !description || !details) return alert("Please fill all fields!");
    const all = getProjects();
    all.push({
      id: "proj_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      clientEmail: email,
      clientName: email.split("@")[0],
      projectName, budget, description, details,
      deadline: deadline ? `${deadline} days` : "Flexible",
      status: "available",
      createdAt: Date.now(),
    });
    saveProjects(all);
    setNewProject({ projectName: "", budget: "", description: "", details: "", deadline: "" });
    refresh();
  }

  function handleSendInvitation(projectId, freelancerEmail) {
    const inv = getInvitations();
    if (inv.find(i => i.projectId === projectId && i.freelancerEmail === freelancerEmail)) {
      return alert("Invitation already sent!");
    }
    inv.push({
      id: "inv_" + Date.now(),
      projectId, clientEmail: email, freelancerEmail,
      status: "pending", sentAt: Date.now(),
    });
    saveInvitations(inv);
    alert("Invitation sent!");
    refresh();
  }

  function handleApprove(subId) {
    const subs = getSubmissions();
    const idx = subs.findIndex(s => s.id == subId);
    if (idx === -1) return;
    if (subs[idx].status !== "pending") return alert("Already processed.");
    subs[idx].status = "approved";
    subs[idx].approvedAt = Date.now();
    saveSubmissions(subs);
    alert("✅ Work approved!");
    refresh();
  }

  function handleReject(subId) {
    const subs = getSubmissions();
    const idx = subs.findIndex(s => s.id == subId);
    if (idx === -1) return;
    if (subs[idx].status !== "pending") return alert("Already processed.");
    subs[idx].status = "rejected";
    subs[idx].rejectedAt = Date.now();
    saveSubmissions(subs);
    alert("⚠️ Work marked for revision.");
    refresh();
  }

  function handleCreateTask() {
    const { title, description, assignedTo } = newTask;
    if (!title || !description || !assignedTo) return alert("Please fill all fields!");
    const members = getMembersByProject(selectedProject.id);
    if (!members.some(m => m.freelancerEmail === assignedTo)) return alert("Can only assign to team members!");
    const all = getTasks();
    all.push({
      id: "task_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      projectId: selectedProject.id,
      title, description, assignedTo,
      status: "todo", createdAt: Date.now(), completedAt: null,
    });
    saveTasks(all);
    alert("Task created!");
    setNewTask({ title: "", description: "", assignedTo: "" });
    setCurrentView("dashboard");
    refresh();
  }

  function handleDeleteTask(taskId) {
    if (!window.confirm("Delete this task?")) return;
    const all = getTasks().filter(t => t.id !== taskId);
    saveTasks(all);
    refresh();
  }

  function openEditTask(task) {
    setEditingTask(task);
    setEditTaskForm({ title: task.title, description: task.description, assignedTo: task.assignedTo });
    setCurrentView("editTask");
  }

  function handleSaveTaskEdit() {
    const { title, description, assignedTo } = editTaskForm;
    if (!title || !description) return alert("Please fill all fields!");
    const members = getMembersByProject(editingTask.projectId);
    if (assignedTo && !members.some(m => m.freelancerEmail === assignedTo)) return alert("Can only assign to team members!");
    const all = getTasks().map(t => t.id === editingTask.id ? { ...t, title, description, assignedTo } : t);
    saveTasks(all);
    alert("Task updated!");
    setCurrentView("dashboard");
    refresh();
  }

  function handleRemoveFreelancer(projectId, freelancerEmail) {
    if (!window.confirm(`Remove ${freelancerEmail}?`)) return;
    const tasks = getTasksByFreelancer(projectId, freelancerEmail);
    if (tasks.some(t => t.status === "completed")) return alert("Cannot remove member with completed tasks.");
    if (tasks.some(t => t.status !== "completed")) {
      if (!window.confirm("Member has pending tasks — they will be reset. Continue?")) return;
      const updated = getTasks().map(t =>
        t.projectId === projectId && t.assignedTo === freelancerEmail
          ? { ...t, assignedTo: null, status: "todo", completedAt: null }
          : t
      );
      saveTasks(updated);
    }
    const all = getMembers().map(pm =>
      pm.projectId === projectId
        ? { ...pm, members: pm.members.filter(m => m.freelancerEmail !== freelancerEmail) }
        : pm
    );
    saveMembers(all);
    alert("Freelancer removed.");
    refresh();
  }

  // ---- RENDER SUB-VIEWS ----

  // Hire / Manage Team page
  if (currentView === "hire" && selectedProject) {
    const allFreelancers = getUsers().filter(u => u.role === "freelancer");
    const members = getMembersByProject(selectedProject.id);
    const available = allFreelancers.filter(f => !members.some(m => m.freelancerEmail === f.email));

    return (
      <div style={styles.card}>
        <div style={styles.flexBetween}>
          <h2 style={styles.sectionHeading}>👥 Manage Team: {selectedProject.projectName}</h2>
          <button onClick={() => setCurrentView("dashboard")} style={styles.btnOutline}>← Back</button>
        </div>

        <div style={styles.infoBox}>
          <strong>Current Team Members: {members.length}</strong>
          {members.map(m => {
            const f = findUser(m.freelancerEmail);
            const p = freelancerProgress(selectedProject.id, m.freelancerEmail);
            return <div key={m.freelancerEmail}>• {f?.name} ({f?.category}) — {p}% complete</div>;
          })}
        </div>

        <h3 style={styles.subHeading}>📨 Invite New Freelancers</h3>
        {available.length === 0 ? (
          <div style={styles.infoBox}>No more freelancers available to invite!</div>
        ) : (
          <div style={styles.grid3}>
            {available.map(f => (
              <FreelancerCard key={f.email} freelancer={f} onInvite={fe => handleSendInvitation(selectedProject.id, fe)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Create Task page
  if (currentView === "createTask" && selectedProject) {
    const members = getMembersByProject(selectedProject.id);
    return (
      <div style={styles.card}>
        <div style={styles.flexBetween}>
          <h2 style={styles.sectionHeading}>📋 Create Task: {selectedProject.projectName}</h2>
          <button onClick={() => setCurrentView("dashboard")} style={styles.btnOutline}>← Back</button>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Task Title</label>
          <input style={styles.input} placeholder="e.g., Design Homepage" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Task Description</label>
          <textarea style={{ ...styles.input, minHeight: 80, resize: "vertical" }} placeholder="Detailed description..." value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Assign To</label>
          <select style={styles.input} value={newTask.assignedTo} onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}>
            <option value="">Select freelancer...</option>
            {members.map(m => {
              const f = findUser(m.freelancerEmail);
              return <option key={m.freelancerEmail} value={m.freelancerEmail}>{f?.name} ({f?.category})</option>;
            })}
          </select>
        </div>
        <button onClick={handleCreateTask} style={{ ...styles.btnPrimary, width: "100%" }}>✨ Create Task</button>
      </div>
    );
  }

  // Edit Task page
  if (currentView === "editTask" && editingTask) {
    const members = getMembersByProject(editingTask.projectId);
    return (
      <div style={styles.card}>
        <div style={styles.flexBetween}>
          <h2 style={styles.sectionHeading}>✏️ Edit Task</h2>
          <button onClick={() => setCurrentView("dashboard")} style={styles.btnOutline}>Cancel</button>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Task Title</label>
          <input style={styles.input} value={editTaskForm.title} onChange={e => setEditTaskForm({ ...editTaskForm, title: e.target.value })} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Task Description</label>
          <textarea style={{ ...styles.input, minHeight: 80, resize: "vertical" }} value={editTaskForm.description} onChange={e => setEditTaskForm({ ...editTaskForm, description: e.target.value })} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Assign To</label>
          <select style={styles.input} value={editTaskForm.assignedTo} onChange={e => setEditTaskForm({ ...editTaskForm, assignedTo: e.target.value })}>
            <option value="">Unassigned</option>
            {members.map(m => {
              const f = findUser(m.freelancerEmail);
              return <option key={m.freelancerEmail} value={m.freelancerEmail}>{f?.name} ({f?.category})</option>;
            })}
          </select>
        </div>
        <button onClick={handleSaveTaskEdit} style={{ ...styles.btnPrimary, width: "100%" }}>💾 Save Changes</button>
      </div>
    );
  }

  // ---- MAIN DASHBOARD VIEW ----
  return (
    <div style={styles.card}>
      <Navbar title="📋 Client Dashboard" email={email} onLogout={onLogout} />
      <div style={styles.infoBox}>✅ Welcome, {email}</div>

      {/* CREATE PROJECT FORM */}
      <h3 style={styles.subHeading}>➕ Create New Project</h3>
      <div style={styles.grid2}>
        <input style={styles.input} placeholder="Project Name *" value={newProject.projectName} onChange={e => setNewProject({ ...newProject, projectName: e.target.value })} />
        <input style={styles.input} placeholder="Budget *" value={newProject.budget} onChange={e => setNewProject({ ...newProject, budget: e.target.value })} />
        <textarea style={{ ...styles.input, minHeight: 70, resize: "vertical" }} placeholder="Project Description *" value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} />
        <textarea style={{ ...styles.input, minHeight: 70, resize: "vertical" }} placeholder="Technical Details & Requirements *" value={newProject.details} onChange={e => setNewProject({ ...newProject, details: e.target.value })} />
        <input style={styles.input} type="number" placeholder="Deadline (days from now)" value={newProject.deadline} onChange={e => setNewProject({ ...newProject, deadline: e.target.value })} />
      </div>
      <button onClick={handleCreateProject} style={{ ...styles.btnPrimary, width: "100%", marginBottom: "1.5rem" }}>✨ Create Project</button>

      {/* MY PROJECTS LIST */}
      <h3 style={styles.subHeading}>📌 My Projects</h3>
      {projects.length === 0 ? (
        <div style={styles.infoBox}>No projects created yet.</div>
      ) : projects.map(p => {
        const memberCount = getMembersByProject(p.id).length;
        const prog = projectProgress(p.id);
        return (
          <div key={p.id} style={styles.card}>
            <div style={styles.flexBetween}>
              <strong>{p.projectName}</strong>
              <Badge status={p.status === "available" ? "available" : "hired"}>
                {p.status === "available" ? "Available" : "In Progress"}
              </Badge>
            </div>
            <div>💰 {p.budget}</div>
            <div>📝 {p.description}</div>
            <div>👥 Team Size: {memberCount} member(s) | Tasks Progress: {prog}%</div>
            {memberCount > 0 && <ProgressBar percent={prog} />}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.8rem", flexWrap: "wrap" }}>
              <button onClick={() => { setSelectedProject(p); setCurrentView("hire"); }} style={styles.btnPrimarySm}>
                👥 {memberCount > 0 ? "Manage Team" : "Hire Freelancers"}
              </button>
              {memberCount > 0 && (
                <button onClick={() => { setSelectedProject(p); setCurrentView("createTask"); }} style={styles.btnOutlineSm}>
                  📋 Create Task
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* PENDING INVITATIONS */}
      <h3 style={styles.subHeading}>📨 Pending Invitations</h3>
      {invitations.filter(i => i.status === "pending").length === 0 ? (
        <div style={styles.infoBox}>No pending invitations.</div>
      ) : invitations.filter(i => i.status === "pending").map(inv => {
        const freelancer = findUser(inv.freelancerEmail);
        const project = getProjects().find(p => p.id === inv.projectId);
        return (
          <div key={inv.id} style={styles.card}>
            <div style={styles.flexBetween}>
              <strong>Project: {project?.projectName}</strong>
              <Badge status="pending">Waiting for Response</Badge>
            </div>
            <div>👤 Freelancer: {freelancer?.name} ({freelancer?.category})</div>
            <div>📧 {inv.freelancerEmail}</div>
          </div>
        );
      })}

      {/* PROJECTS & TASKS OVERVIEW */}
      <h3 style={styles.subHeading}>⚡ Projects & Tasks Overview</h3>
      {projects.filter(p => getMembersByProject(p.id).length > 0).length === 0 ? (
        <div style={styles.infoBox}>No active projects with team members yet.</div>
      ) : projects.filter(p => getMembersByProject(p.id).length > 0).map(proj => {
        const projectTasks = getTasksByProject(proj.id);
        const prog = projectProgress(proj.id);
        const members = getMembersByProject(proj.id);
        const projectSubs = submissions.filter(s => s.projectId === proj.id);

        return (
          <div key={proj.id} style={styles.card}>
            <div style={styles.flexBetween}>
              <strong>📌 {proj.projectName}</strong>
              <Badge status="hired">Tasks: {prog}% Complete</Badge>
            </div>
            <div>💰 {proj.budget}</div>
            <ProgressBar percent={prog} />

            {/* ALL TASKS */}
            <h4 style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#4a5568" }}>📋 All Tasks ({projectTasks.length})</h4>
            {projectTasks.length === 0 ? (
              <div style={styles.infoBox}>No tasks yet. Click "Create Task" above!</div>
            ) : projectTasks.map(task => {
              const assignee = findUser(task.assignedTo);
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  assigneeName={assignee?.name || task.assignedTo || "Unassigned"}
                  isClient={true}
                  onEditTask={openEditTask}
                  onDeleteTask={handleDeleteTask}
                />
              );
            })}

            {/* TEAM MEMBERS */}
            <h4 style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#4a5568" }}>👥 Team Members</h4>
            {members.map(member => {
              const f = findUser(member.freelancerEmail);
              const memberTasks = getTasksByFreelancer(proj.id, member.freelancerEmail);
              const completed = memberTasks.filter(t => t.status === "completed").length;
              const prog = freelancerProgress(proj.id, member.freelancerEmail);
              return (
                <div key={member.freelancerEmail} style={{ background: "#edf2f7", padding: "0.5rem", borderRadius: "0.5rem", marginTop: "0.5rem" }}>
                  <div style={styles.flexBetween}>
                    <strong>{f?.name}</strong>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span>{prog}% ({completed}/{memberTasks.length} tasks)</span>
                      <button onClick={() => handleRemoveFreelancer(proj.id, member.freelancerEmail)} style={styles.btnDangerSm}>Remove</button>
                    </div>
                  </div>
                  <ProgressBar percent={prog} />
                </div>
              );
            })}

            {/* SUBMISSIONS */}
            <h4 style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#4a5568" }}>📤 Submissions ({projectSubs.length})</h4>
            {projectSubs.length === 0 ? (
              <div style={styles.infoBox}>No submissions yet.</div>
            ) : projectSubs.map(sub => {
              const f = findUser(sub.freelancerEmail);
              return (
                <SubmissionCard
                  key={sub.id}
                  submission={sub}
                  freelancerName={f?.name || sub.freelancerEmail}
                  isClient={true}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// SECTION 6: FREELANCER DASHBOARD
// ============================================================
function FreelancerDashboard({ email, onLogout }) {
  const [currentView, setCurrentView] = useState("dashboard"); // "dashboard" | "editProfile"
  const [tick, setTick] = useState(0);
  function refresh() { setTick(t => t + 1); }

  const freelancer = findUser(email);
  const [profileForm, setProfileForm] = useState({
    name: freelancer?.name || "",
    category: freelancer?.category || "",
    phone: freelancer?.phone || "",
    image: freelancer?.image || "",
    pastExperience: freelancer?.pastExperience || "",
  });

  if (!freelancer) { onLogout(); return null; }

  // Gather data fresh on each render
  const allProjects = getProjects();
  const allMembers = getMembers();
  const submissions = getSubmissions();
  const pendingInvitations = getInvitations().filter(i => i.freelancerEmail === email && i.status === "pending");

  // Build "My Projects" list
  const myProjects = [];
  allMembers.forEach(pm => {
    if (pm.members.some(m => m.freelancerEmail === email)) {
      const project = allProjects.find(p => p.id === pm.projectId);
      if (project) {
        myProjects.push({
          ...project,
          taskProgress: freelancerProgress(project.id, email),
          myTasks: getTasksByFreelancer(project.id, email),
          teamMembers: pm.members.filter(m => m.freelancerEmail !== email),
        });
      }
    }
  });

  // ---- ACTION HANDLERS ----

  function handleRespondInvitation(invId, response, projectId) {
    const inv = getInvitations();
    const idx = inv.findIndex(i => i.id === invId);
    if (idx === -1) return;
    inv[idx].status = response === "accept" ? "accepted" : "rejected";
    saveInvitations(inv);

    if (response === "accept") {
      addMemberToProject(projectId, email);
      const projs = getProjects();
      const pi = projs.findIndex(p => p.id === projectId);
      if (pi !== -1 && projs[pi].status === "available") {
        projs[pi].status = "hired";
        saveProjects(projs);
      }
      alert("You've joined the team!");
    } else {
      alert("Invitation rejected.");
    }
    refresh();
  }

  function handleUpdateTask(taskId, newStatus) {
    const all = getTasks();
    const idx = all.findIndex(t => t.id === taskId);
    if (idx === -1) return alert("Task not found!");
    if (all[idx].assignedTo !== email) return alert("Not your task!");
    const valid = { todo: ["in-progress"], "in-progress": ["completed"], completed: [] };
    if (!valid[all[idx].status].includes(newStatus)) return alert(`Cannot change from ${all[idx].status} to ${newStatus}`);
    all[idx].status = newStatus;
    if (newStatus === "completed") all[idx].completedAt = Date.now();
    saveTasks(all);
    alert(`Task marked as ${newStatus}!`);
    refresh();
  }

  function handleLeaveProject(projectId) {
    if (!window.confirm("Leave this project?")) return;
    const tasks = getTasksByFreelancer(projectId, email);
    if (tasks.some(t => t.status !== "completed")) {
      if (!window.confirm("You have pending tasks — they will be reset. Continue?")) return;
      const updated = getTasks().map(t =>
        t.projectId === projectId && t.assignedTo === email
          ? { ...t, assignedTo: null, status: "todo", completedAt: null }
          : t
      );
      saveTasks(updated);
    }
    const all = getMembers().map(pm =>
      pm.projectId === projectId
        ? { ...pm, members: pm.members.filter(m => m.freelancerEmail !== email) }
        : pm
    );
    saveMembers(all);
    alert("You left the project.");
    refresh();
  }

  function handleSubmitWork(projectId, milestone, description, fileUrl) {
    if (!milestone || !description) return alert("Please fill milestone and description!");
    const subs = getSubmissions();
    subs.push({
      id: Date.now(),
      projectId, freelancerEmail: email,
      milestone, description,
      fileUrl: fileUrl || "work_sample.pdf",
      status: "pending", submittedAt: Date.now(),
    });
    saveSubmissions(subs);
    alert("Work submitted!");
    refresh();
  }

  function handleSaveProfile() {
    const { name, category, phone, image, pastExperience } = profileForm;
    if (!name || !category || !phone || !image || !pastExperience) return alert("Please fill all fields!");
    const users = getUsers().map(u => u.email === email ? { ...u, name, category, phone, image, pastExperience } : u);
    saveUsers(users);
    alert("Profile updated!");
    setCurrentView("dashboard");
    refresh();
  }

  // ---- EDIT PROFILE VIEW ----
  if (currentView === "editProfile") {
    return (
      <div style={styles.card}>
        <div style={styles.flexBetween}>
          <h2 style={styles.sectionHeading}>✏️ Edit Profile</h2>
          <button onClick={() => setCurrentView("dashboard")} style={styles.btnOutline}>Cancel</button>
        </div>
        {[
          { label: "Full Name", key: "name" },
          { label: "Category (Skills)", key: "category" },
          { label: "Phone", key: "phone" },
          { label: "Profile Image URL", key: "image" },
        ].map(f => (
          <div key={f.key} style={styles.formGroup}>
            <label style={styles.label}>{f.label}</label>
            <input style={styles.input} value={profileForm[f.key]} onChange={e => setProfileForm({ ...profileForm, [f.key]: e.target.value })} />
          </div>
        ))}
        <div style={styles.formGroup}>
          <label style={styles.label}>Past Experience</label>
          <textarea style={{ ...styles.input, minHeight: 80, resize: "vertical" }} value={profileForm.pastExperience} onChange={e => setProfileForm({ ...profileForm, pastExperience: e.target.value })} />
        </div>
        <button onClick={handleSaveProfile} style={{ ...styles.btnPrimary, width: "100%" }}>💾 Save Changes</button>
      </div>
    );
  }

  // ---- MAIN FREELANCER DASHBOARD ----
  return (
    <div style={styles.card}>
      <Navbar title="💼 Freelancer Dashboard" email={email} onLogout={onLogout} onEditProfile={() => setCurrentView("editProfile")} />

      {/* PROFILE SECTION */}
      <div style={{ background: "linear-gradient(135deg, #fef5e7, #fff)", borderRadius: "1rem", padding: "1rem", marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "center", border: "1px solid #fbd38d" }}>
        <img src={freelancer.image} alt={freelancer.name} style={{ width: 70, height: 70, borderRadius: "50%", objectFit: "cover", border: "3px solid #667eea" }} onError={e => { e.target.src = "https://via.placeholder.com/70"; }} />
        <div>
          <strong>{freelancer.name}</strong><br />
          📌 {freelancer.category} | 📞 {freelancer.phone}<br />
          🎓 {freelancer.pastExperience}
        </div>
      </div>

      {/* INVITATIONS */}
      <h3 style={styles.subHeading}>📨 Project Invitations ({pendingInvitations.length})</h3>
      {pendingInvitations.length === 0 ? (
        <div style={styles.infoBox}>No pending invitations.</div>
      ) : pendingInvitations.map(inv => {
        const project = allProjects.find(p => p.id === inv.projectId);
        const client = findUser(inv.clientEmail);
        return (
          <div key={inv.id} style={styles.card}>
            <div style={styles.flexBetween}>
              <strong>📌 {project?.projectName}</strong>
              <Badge status="pending">Pending Decision</Badge>
            </div>
            <div><strong>Client:</strong> {client?.name}</div>
            <div><strong>Budget:</strong> {project?.budget}</div>
            <div><strong>Description:</strong> {project?.description}</div>
            <div><strong>Requirements:</strong> {project?.details}</div>
            <div><strong>Deadline:</strong> {project?.deadline || "Not specified"}</div>
            <div style={{ ...styles.flexBetween, marginTop: "1rem" }}>
              <button onClick={() => handleRespondInvitation(inv.id, "accept", inv.projectId)} style={styles.btnSuccess}>✅ Accept & Join Team</button>
              <button onClick={() => handleRespondInvitation(inv.id, "reject", inv.projectId)} style={styles.btnDanger}>❌ Reject</button>
            </div>
          </div>
        );
      })}

      {/* ACTIVE PROJECTS */}
      <h3 style={styles.subHeading}>⚡ My Active Projects</h3>
      {myProjects.length === 0 ? (
        <div style={styles.infoBox}>No active projects yet. Accept invitations to get started!</div>
      ) : myProjects.map(proj => {
        // Each active project has its own inline submit form — we use a local sub-component trick
        return <ActiveProjectCard key={proj.id} proj={proj} email={email} onUpdateTask={handleUpdateTask} onLeave={handleLeaveProject} onSubmitWork={handleSubmitWork} submissions={submissions} />;
      })}
    </div>
  );
}

// ActiveProjectCard is a small sub-component for each active project.
// WHY: It has its own local form state (milestone, fileUrl, workDesc)
// using useState. If we put this in the parent, we'd need to track
// form state for every project at once — messy!
function ActiveProjectCard({ proj, email, onUpdateTask, onLeave, onSubmitWork, submissions }) {
  const [form, setForm] = useState({ milestone: "", fileUrl: "", workDesc: "" });
  const mySubs = submissions.filter(s => s.projectId === proj.id && s.freelancerEmail === email);

  return (
    <div style={styles.card}>
      <div style={styles.flexBetween}>
        <strong>📌 {proj.projectName}</strong>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Badge status="hired">My Progress: {proj.taskProgress}%</Badge>
          <button onClick={() => onLeave(proj.id)} style={styles.btnDangerSm}>Leave Project</button>
        </div>
      </div>
      <div><strong>Client:</strong> {proj.clientName || proj.clientEmail}</div>
      <div><strong>Budget:</strong> {proj.budget}</div>
      <div><strong>Description:</strong> {proj.description}</div>
      <ProgressBar percent={proj.taskProgress} />

      {/* MY TASKS */}
      <h4 style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#4a5568" }}>📋 My Tasks ({proj.myTasks.length})</h4>
      {proj.myTasks.length === 0 ? (
        <div style={styles.infoBox}>No tasks assigned yet. The client will create tasks for you.</div>
      ) : proj.myTasks.map(task => (
        <TaskCard key={task.id} task={task} isClient={false} onUpdateTask={onUpdateTask} />
      ))}

      {/* TEAM MEMBERS */}
      <h4 style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#4a5568" }}>👥 Team Members</h4>
      {proj.teamMembers.length === 0 ? (
        <div style={styles.infoBox}>You're the only team member so far!</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {proj.teamMembers.map(member => {
            const teammate = findUser(member.freelancerEmail);
            const teamTasks = getTasksByFreelancer(proj.id, member.freelancerEmail);
            const p = freelancerProgress(proj.id, member.freelancerEmail);
            return (
              <div key={member.freelancerEmail} style={{ background: "#edf2f7", padding: "0.5rem", borderRadius: "0.5rem" }}>
                <strong>{teammate?.name}</strong> — {teammate?.category}<br />
                📊 Progress: {p}% ({teamTasks.filter(t => t.status === "completed").length}/{teamTasks.length} tasks)
              </div>
            );
          })}
        </div>
      )}

      {/* SUBMIT WORK FORM */}
      <h4 style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#4a5568" }}>📤 Submit Work</h4>
      <div style={styles.grid2}>
        <input style={styles.input} placeholder="Milestone Name" value={form.milestone} onChange={e => setForm({ ...form, milestone: e.target.value })} />
        <input style={styles.input} placeholder="File/Attachment name" value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} />
        <textarea style={{ ...styles.input, minHeight: 60, resize: "vertical" }} placeholder="Describe what you completed..." value={form.workDesc} onChange={e => setForm({ ...form, workDesc: e.target.value })} />
      </div>
      <button
        onClick={() => {
          onSubmitWork(proj.id, form.milestone, form.workDesc, form.fileUrl);
          setForm({ milestone: "", fileUrl: "", workDesc: "" });
        }}
        style={{ ...styles.btnPrimary, width: "100%", marginTop: "0.5rem" }}
      >
        📎 Submit Work
      </button>

      {/* MY SUBMISSIONS */}
      <h4 style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#4a5568" }}>📋 My Submissions</h4>
      {mySubs.length === 0 ? (
        <div style={styles.infoBox}>No submissions yet.</div>
      ) : mySubs.map(sub => (
        <SubmissionCard key={sub.id} submission={sub} isClient={false} />
      ))}
    </div>
  );
}

// ============================================================
// SECTION 7: APP (ROOT COMPONENT)
// WHY: App is the "traffic controller". It decides which page
// to show based on the current session. All other components
// are pure UI — App holds the top-level state.
// ============================================================
initStorage(); // runs once when the module loads

export default function App() {
  const stored = getSession();
  const [session, setSession_] = useState(stored); // { email, role } or null

  function handleLogin(email, role) {
    setSession_(email ? { email, role } : null);
  }

  function handleLogout() {
    clearSession();
    setSession_(null);
  }

  // Decide which page to show
  if (!session) {
    return (
      <div style={styles.pageWrapper}>
        <LoginPage onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      {session.role === "client" ? (
        <ClientDashboard email={session.email} onLogout={handleLogout} />
      ) : (
        <FreelancerDashboard email={session.email} onLogout={handleLogout} />
      )}
    </div>
  );
}

// ============================================================
// SECTION 8: SHARED STYLES OBJECT
// WHY: Centralised styles mean you change a button's look
// in ONE place and it updates everywhere. Same idea as CSS
// classes, but works neatly with inline React styles.
// ============================================================
const styles = {
  pageWrapper: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    minHeight: "100vh",
    padding: "2rem",
    fontFamily: "system-ui, 'Segoe UI', -apple-system, sans-serif",
  },
  card: {
    background: "rgba(255,255,255,0.98)",
    borderRadius: "1.5rem",
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
    padding: "2rem",
    width: "100%",
    maxWidth: 1400,
    margin: "0 auto 1rem auto",
    border: "1px solid #e2e8f0",
  },
  loginCard: {
    background: "rgba(255,255,255,0.98)",
    borderRadius: "1.5rem",
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
    padding: "2rem",
    maxWidth: 550,
    margin: "2rem auto",
  },
  gradientHeading: {
    fontSize: "2rem",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    marginBottom: "0.5rem",
  },
  sectionHeading: {
    fontSize: "1.5rem",
    color: "#2d3748",
    marginBottom: "1.2rem",
    borderLeft: "4px solid #667eea",
    paddingLeft: "1rem",
  },
  subHeading: {
    fontSize: "1.2rem",
    color: "#4a5568",
    margin: "1.5rem 0 1rem 0",
  },
  flexBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginBottom: "0.3rem",
  },
  infoBox: {
    background: "#e6fffa",
    borderLeft: "4px solid #38b2ac",
    padding: "0.8rem",
    borderRadius: "0.5rem",
    margin: "0.5rem 0",
  },
  formGroup: { marginBottom: "1rem" },
  label: { display: "block", fontWeight: 600, marginBottom: "0.4rem", color: "#2d3748", fontSize: "0.85rem" },
  input: {
    width: "100%",
    padding: "0.7rem 1rem",
    border: "2px solid #e2e8f0",
    borderRadius: "0.8rem",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" },
  // Buttons
  btnPrimary:   { padding: "0.7rem 1.8rem", border: "none", borderRadius: "50px", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem", background: "linear-gradient(135deg, #667eea, #764ba2)", color: "white" },
  btnOutline:   { padding: "0.7rem 1.8rem", background: "white", border: "2px solid #667eea", color: "#667eea", borderRadius: "50px", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem" },
  btnSuccess:   { padding: "0.7rem 1.8rem", border: "none", borderRadius: "50px", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem", background: "#48bb78", color: "white" },
  btnDanger:    { padding: "0.7rem 1.8rem", border: "none", borderRadius: "50px", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem", background: "#f56565", color: "white" },
  btnPrimarySm: { padding: "0.4rem 1.2rem", border: "none", borderRadius: "50px", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", background: "linear-gradient(135deg, #667eea, #764ba2)", color: "white" },
  btnOutlineSm: { padding: "0.4rem 1.2rem", background: "white", border: "2px solid #667eea", color: "#667eea", borderRadius: "50px", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem" },
  btnSuccessSm: { padding: "0.4rem 1.2rem", border: "none", borderRadius: "50px", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", background: "#48bb78", color: "white" },
  btnDangerSm:  { padding: "0.4rem 1.2rem", border: "none", borderRadius: "50px", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", background: "#f56565", color: "white" },
};