(function() {

    const API_BASE = "https://freelancer-project-z7j4.onrender.com";
    // ========== STORAGE KEYS ==========
    const STORAGE_USERS = "workhub_users_final";
    const STORAGE_PROJECTS = "workhub_projects_final";
    const STORAGE_INVITATIONS = "workhub_invitations_final";
    const STORAGE_PROJECT_MEMBERS = "workhub_project_members_final";
    const STORAGE_SUBMISSIONS = "workhub_submissions_final";
    const STORAGE_SESSION = "workhub_session_final";
    const STORAGE_TASKS = "workhub_tasks_final";

    // ========== INITIALIZE STORAGE ==========
    function initializeStorage() {
        if (!localStorage.getItem(STORAGE_USERS)) {
            const users = [
                { email: "client@demo.com", role: "client", name: "John Client", registered: true },
                { email: "alice@dev.com", role: "freelancer", name: "Alice Johnson", category: "Full Stack Developer", phone: "+1234567890", image: "https://randomuser.me/api/portraits/women/1.jpg", pastExperience: "7 years in React, Node.js, Python" },
                { email: "bob@design.com", role: "freelancer", name: "Bob Smith", category: "UI/UX Designer", phone: "+1234567891", image: "https://randomuser.me/api/portraits/men/2.jpg", pastExperience: "5 years in Figma, Adobe XD" },
                { email: "carol@dev.com", role: "freelancer", name: "Carol Davis", category: "Backend Developer", phone: "+1234567892", image: "https://randomuser.me/api/portraits/women/2.jpg", pastExperience: "4 years in Python, Django, PostgreSQL" }
            ];
            localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
        }

        if (!localStorage.getItem(STORAGE_PROJECTS)) localStorage.setItem(STORAGE_PROJECTS, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_INVITATIONS)) localStorage.setItem(STORAGE_INVITATIONS, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_PROJECT_MEMBERS)) localStorage.setItem(STORAGE_PROJECT_MEMBERS, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_SUBMISSIONS)) localStorage.setItem(STORAGE_SUBMISSIONS, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_TASKS)) localStorage.setItem(STORAGE_TASKS, JSON.stringify([]));
        
        migrateOldHiredData();
    }
    
    function migrateOldHiredData() {
        const oldHired = localStorage.getItem("workhub_hired_final");
        const currentMembers = localStorage.getItem(STORAGE_PROJECT_MEMBERS);
        
        if (oldHired && JSON.parse(oldHired).length > 0 && (!currentMembers || JSON.parse(currentMembers).length === 0)) {
            const hired = JSON.parse(oldHired);
            const membersByProject = {};
            
            hired.forEach(h => {
                if (!membersByProject[h.projectId]) {
                    membersByProject[h.projectId] = [];
                }
                membersByProject[h.projectId].push({
                    freelancerEmail: h.freelancerEmail,
                    joinedAt: h.hiredAt || Date.now()
                });
            });
            
            const newMembers = Object.entries(membersByProject).map(([projectId, members]) => ({
                projectId,
                members
            }));
            
            localStorage.setItem(STORAGE_PROJECT_MEMBERS, JSON.stringify(newMembers));
        }
    }

    // ========== HELPER FUNCTIONS ==========
    function getUsers() { return JSON.parse(localStorage.getItem(STORAGE_USERS) || "[]"); }
    function saveUsers(users) { localStorage.setItem(STORAGE_USERS, JSON.stringify(users)); }
    function getProjects() { return JSON.parse(localStorage.getItem(STORAGE_PROJECTS) || "[]"); }
    function saveProjects(projects) { localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(projects)); }
    function getInvitations() { return JSON.parse(localStorage.getItem(STORAGE_INVITATIONS) || "[]"); }
    function saveInvitations(invitations) { localStorage.setItem(STORAGE_INVITATIONS, JSON.stringify(invitations)); }
    function getProjectMembers() { return JSON.parse(localStorage.getItem(STORAGE_PROJECT_MEMBERS) || "[]"); }
    function saveProjectMembers(members) { localStorage.setItem(STORAGE_PROJECT_MEMBERS, JSON.stringify(members)); }
    function getSubmissions() { return JSON.parse(localStorage.getItem(STORAGE_SUBMISSIONS) || "[]"); }
    function saveSubmissions(submissions) { localStorage.setItem(STORAGE_SUBMISSIONS, JSON.stringify(submissions)); }
    function getSession() { return JSON.parse(localStorage.getItem(STORAGE_SESSION) || "null"); }
    function setSession(email, role) { localStorage.setItem(STORAGE_SESSION, JSON.stringify({ email, role })); }
    function clearSession() { localStorage.removeItem(STORAGE_SESSION); }
    
    // ========== TASK MANAGEMENT FUNCTIONS ==========
    function getTasks() { return JSON.parse(localStorage.getItem(STORAGE_TASKS) || "[]"); }
    function saveTasks(tasks) { localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks)); }
    
    function getTasksByProject(projectId) {
        const tasks = getTasks();
        return tasks.filter(t => t.projectId === projectId);
    }
    
    function getTasksByFreelancer(projectId, freelancerEmail) {
        const tasks = getTasks();
        return tasks.filter(t => t.projectId === projectId && t.assignedTo === freelancerEmail);
    }
    
    function resetTasksForFreelancer(projectId, freelancerEmail) {
        let tasks = getTasks();
        let updated = false;
        
        tasks = tasks.map(task => {
            if (task.projectId === projectId && task.assignedTo === freelancerEmail) {
                updated = true;
                return {
                    ...task,
                    assignedTo: null,
                    status: "todo",
                    completedAt: null
                };
            }
            return task;
        });
        
        if (updated) {
            saveTasks(tasks);
        }
        return updated;
    }
    
    function canAssignToProject(projectId, freelancerEmail) {
        const members = getProjectMembersByProject(projectId);
        return members.some(m => m.freelancerEmail === freelancerEmail);
    }
    
    function createTask(projectId, assignedTo, title, description) {
        const members = getProjectMembersByProject(projectId);
        const isValidAssignee = members.some(m => m.freelancerEmail === assignedTo);
        
        if (!isValidAssignee) {
            throw new Error("Task can only be assigned to team members!");
        }
        
        const tasks = getTasks();
        const newTask = {
            id: "task_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
            projectId: projectId,
            title: title,
            description: description,
            assignedTo: assignedTo,
            status: "todo",
            createdAt: Date.now(),
            completedAt: null,
            submissionId: null
        };
        tasks.push(newTask);
        saveTasks(tasks);
        return newTask;
    }
    
    function updateTaskStatus(taskId, newStatus, requestingEmail) {
        let tasks = getTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
            alert("Task not found!");
            return false;
        }
        
        const task = tasks[taskIndex];
        
        if (task.assignedTo !== requestingEmail) {
            alert("You can only update tasks assigned to you!");
            return false;
        }
        
        const validTransitions = {
            'todo': ['in-progress'],
            'in-progress': ['completed'],
            'completed': []
        };
        
        if (!validTransitions[task.status].includes(newStatus)) {
            alert(`Cannot change from ${task.status} to ${newStatus}`);
            return false;
        }
        
        task.status = newStatus;
        if (newStatus === 'completed') {
            task.completedAt = Date.now();
        }
        
        tasks[taskIndex] = task;
        saveTasks(tasks);
        return true;
    }
    
    function editTask(taskId, updatedTitle, updatedDescription, updatedAssignee, clientEmail) {
        let tasks = getTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
            alert("Task not found!");
            return false;
        }
        
        const task = tasks[taskIndex];
        const project = getProjects().find(p => p.id === task.projectId);
        
        if (!project || project.clientEmail !== clientEmail) {
            alert("Only the client can edit tasks!");
            return false;
        }
        
        if (updatedAssignee !== task.assignedTo) {
            const isValidAssignee = canAssignToProject(task.projectId, updatedAssignee);
            if (!isValidAssignee) {
                alert("Can only reassign to team members!");
                return false;
            }
        }
        
        task.title = updatedTitle;
        task.description = updatedDescription;
        task.assignedTo = updatedAssignee;
        
        tasks[taskIndex] = task;
        saveTasks(tasks);
        return true;
    }
    
    function deleteTask(taskId, clientEmail) {
        let tasks = getTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
            alert("Task not found!");
            return false;
        }
        
        const task = tasks[taskIndex];
        const project = getProjects().find(p => p.id === task.projectId);
        
        if (!project || project.clientEmail !== clientEmail) {
            alert("Only the client can delete tasks!");
            return false;
        }
        
        if (confirm(`Are you sure you want to delete task: "${task.title}"?`)) {
            tasks.splice(taskIndex, 1);
            saveTasks(tasks);
            return true;
        }
        return false;
    }
    
    // ========== TEAM MANAGEMENT FUNCTIONS ==========
    function removeFreelancer(projectId, freelancerEmail, clientEmail) {
        // Verify client owns the project
        const projects = getProjects();
        const project = projects.find(p => p.id === projectId);
        
        if (!project || project.clientEmail !== clientEmail) {
            alert("You don't have permission to remove members from this project!");
            return false;
        }
        
        // Check if freelancer has completed tasks
        const tasks = getTasksByFreelancer(projectId, freelancerEmail);
        const hasCompletedTasks = tasks.some(t => t.status === 'completed');
        
        if (hasCompletedTasks) {
            alert("Cannot remove member with completed tasks. Please handle completed tasks first.");
            return false;
        }
        
        // Check if freelancer has pending/in-progress tasks
        const hasPendingTasks = tasks.some(t => t.status !== 'completed');
        
        if (hasPendingTasks) {
            const confirm = window.confirm("This freelancer has pending tasks. These tasks will be reset and unassigned. Continue?");
            if (!confirm) return false;
            
            // Reset tasks (assignedTo = null, status = 'todo')
            resetTasksForFreelancer(projectId, freelancerEmail);
        }
        
        // Remove freelancer from project members
        let membersList = getProjectMembers();
        const projectMembersIndex = membersList.findIndex(pm => pm.projectId === projectId);
        
        if (projectMembersIndex !== -1) {
            const memberIndex = membersList[projectMembersIndex].members.findIndex(
                m => m.freelancerEmail === freelancerEmail
            );
            
            if (memberIndex !== -1) {
                membersList[projectMembersIndex].members.splice(memberIndex, 1);
                saveProjectMembers(membersList);
                alert(`Freelancer has been removed from the project.`);
                return true;
            }
        }
        
        alert("Freelancer not found in project members!");
        return false;
    }
    
    function leaveProject(projectId, freelancerEmail) {
        // Check if freelancer is a member
        const members = getProjectMembersByProject(projectId);
        const isMember = members.some(m => m.freelancerEmail === freelancerEmail);
        
        if (!isMember) {
            alert("You are not a member of this project!");
            return false;
        }
        
        // Check freelancer's tasks
        const tasks = getTasksByFreelancer(projectId, freelancerEmail);
        const hasPendingTasks = tasks.some(t => t.status !== 'completed');
        
        if (hasPendingTasks) {
            const confirm = window.confirm("You have pending tasks. If you leave, these tasks will be reset and unassigned. Continue?");
            if (!confirm) return false;
            
            // Reset tasks (assignedTo = null, status = 'todo')
            resetTasksForFreelancer(projectId, freelancerEmail);
        }
        
        // Remove freelancer from project members
        let membersList = getProjectMembers();
        const projectMembersIndex = membersList.findIndex(pm => pm.projectId === projectId);
        
        if (projectMembersIndex !== -1) {
            const memberIndex = membersList[projectMembersIndex].members.findIndex(
                m => m.freelancerEmail === freelancerEmail
            );
            
            if (memberIndex !== -1) {
                membersList[projectMembersIndex].members.splice(memberIndex, 1);
                saveProjectMembers(membersList);
                alert(`You have left the project.`);
                return true;
            }
        }
        
        alert("Failed to leave project!");
        return false;
    }
    
    // ========== TASK-BASED PROGRESS CALCULATIONS ==========
    function getFreelancerTaskProgress(projectId, freelancerEmail) {
        const tasks = getTasksByFreelancer(projectId, freelancerEmail);
        if (tasks.length === 0) return 0;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        return Math.round((completedTasks / tasks.length) * 100);
    }
    
    function getProjectTaskProgress(projectId) {
        const tasks = getTasksByProject(projectId);
        if (tasks.length === 0) return 0;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        return Math.round((completedTasks / tasks.length) * 100);
    }
    
    // ========== TEAM MEMBER FUNCTIONS ==========
    function getProjectMembersByProject(projectId) {
        const members = getProjectMembers();
        const record = members.find(pm => pm.projectId === projectId);
        return record ? record.members.map(m => ({
            freelancerEmail: m.freelancerEmail,
            joinedAt: m.joinedAt
        })) : [];
    }
    
    function addMemberToProject(projectId, freelancerEmail) {
        let membersList = getProjectMembers();
        let record = membersList.find(pm => pm.projectId === projectId);
        
        if (!record) {
            record = { projectId, members: [] };
            membersList.push(record);
        }
        
        if (!record.members.some(m => m.freelancerEmail === freelancerEmail)) {
            record.members.push({
                freelancerEmail: freelancerEmail,
                joinedAt: Date.now()
            });
            saveProjectMembers(membersList);
        }
        return record;
    }
    
    // ========== FREELANCER PROFILE FUNCTIONS ==========
    function getFreelancerProfile(email) {
        const users = getUsers();
        return users.find(u => u.email === email && u.role === "freelancer");
    }
    
    function updateFreelancerProfile(email, updates) {
        let users = getUsers();
        const userIndex = users.findIndex(u => u.email === email && u.role === "freelancer");
        
        if (userIndex === -1) {
            alert("Freelancer not found!");
            return false;
        }
        
        const allowedUpdates = ['name', 'category', 'phone', 'image', 'pastExperience'];
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                users[userIndex][field] = updates[field];
            }
        });
        
        saveUsers(users);
        return true;
    }
    
    function findUser(email) {
        const users = getUsers();
        return users.find(u => u.email === email);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    // ========== SUBMISSION FUNCTIONS ==========
    function submitWork(projectId, freelancerEmail, milestone, description, fileUrl) {
        const submissions = getSubmissions();
        submissions.push({
            id: Date.now(),
            projectId: projectId,
            freelancerEmail: freelancerEmail,
            milestone: milestone,
            description: description,
            fileUrl: fileUrl || "work_sample.pdf",
            status: "pending",
            submittedAt: Date.now()
        });                 
        saveSubmissions(submissions);
    }
    
    window.approveWork = function(submissionId, projectId, freelancerEmail, clientEmail) {
        let submissions = getSubmissions();
        const submissionIndex = submissions.findIndex(s => s.id == submissionId);
        if (submissionIndex === -1) {
            alert("Submission not found!");
            return;
        }
        
        const submission = submissions[submissionIndex];
        if (submission.status !== "pending") {
            alert("This submission has already been processed.");
            return;
        }
        
        submission.status = "approved";
        submission.approvedAt = Date.now();
        saveSubmissions(submissions);
        
        alert(`✅ Work approved!`);
        
        const session = getSession();
        if (session && session.email === clientEmail) {
            renderClientDashboard(clientEmail);
        } else if (session && session.email === freelancerEmail) {
            renderFreelancerDashboard(freelancerEmail);
        }
    };
    
    window.rejectWork = function(submissionId, projectId, freelancerEmail, clientEmail) {
        let submissions = getSubmissions();
        const submissionIndex = submissions.findIndex(s => s.id == submissionId);
        if (submissionIndex === -1) {
            alert("Submission not found!");
            return;
        }
        
        const submission = submissions[submissionIndex];
        if (submission.status !== "pending") {
            alert("This submission has already been processed.");
            return;
        }
        
        submission.status = "rejected";
        submission.rejectedAt = Date.now();
        saveSubmissions(submissions);
        
        alert("⚠️ Work marked for revision.");
        
        const session = getSession();
        if (session && session.email === clientEmail) {
            renderClientDashboard(clientEmail);
        } else if (session && session.email === freelancerEmail) {
            renderFreelancerDashboard(freelancerEmail);
        }
    };

    // ========== CLIENT DASHBOARD ==========
    function renderClientDashboard(email) {
        let projects = getProjects();
        let clientProjects = projects.filter(p => p.clientEmail === email);
        let invitations = getInvitations();
        let submissions = getSubmissions();
        
        let myInvitations = invitations.filter(i => i.clientEmail === email);
        
        const container = document.getElementById("app");
        
        container.innerHTML = `
            <div class="glass-card">
                <div class="flex-between">
                    <h2>📋 Client Dashboard</h2>
                    <button onclick="window.logout()" class="logout-btn">Logout</button>
                </div>
                <div class="message">✅ Welcome, ${escapeHtml(email)}</div>
                
                <h3>➕ Create New Project</h3>
                <div class="grid-2">
                    <input type="text" id="projectName" placeholder="Project Name *">
                    <input type="text" id="budget" placeholder="Budget *">
                    <textarea id="description" placeholder="Project Description *" rows="2"></textarea>
                    <textarea id="details" placeholder="Technical Details & Requirements *" rows="2"></textarea>
                    <input type="number" id="deadline" placeholder="Deadline (days from now)">
                </div>
                <button onclick="window.createProject('${email}')" class="btn btn-primary" style="width:100%; margin-bottom:1.5rem;">✨ Create Project</button>
                
                <h3>📌 My Projects</h3>
                <div id="myProjects">
                    ${clientProjects.length === 0 ? '<div class="message">No projects created yet.</div>' : 
                        clientProjects.map(p => {
                            const memberCount = getProjectMembersByProject(p.id).length;
                            const taskProgress = getProjectTaskProgress(p.id);
                            return `
                            <div class="project-card">
                                <div class="flex-between">
                                    <strong>${escapeHtml(p.projectName)}</strong>
                                    <span class="badge ${p.status === 'available' ? 'badge-available' : 'badge-hired'}">${p.status === 'available' ? 'Available' : 'In Progress'}</span>
                                </div>
                                <div>💰 ${escapeHtml(p.budget)}</div>
                                <div>📝 ${escapeHtml(p.description)}</div>
                                <div>👥 Team Size: ${memberCount} member(s) | Tasks Progress: ${taskProgress}%</div>
                                ${memberCount > 0 ? `
                                    <div class="progress-bar"><div class="progress-fill" style="width: ${taskProgress}%"></div></div>
                                ` : ''}
                                <button onclick="window.showFreelancersForHire('${p.id}', '${escapeHtml(p.projectName)}')" class="btn btn-primary btn-sm" style="margin-top:0.8rem;">👥 ${memberCount > 0 ? 'Manage Team' : 'Hire Freelancers'}</button>
                                ${memberCount > 0 ? `<button onclick="window.showCreateTaskForm('${p.id}', '${escapeHtml(p.projectName)}')" class="btn btn-outline btn-sm" style="margin-top:0.8rem; margin-left:0.5rem;">📋 Create Task</button>` : ''}
                            </div>
                        `}).join('')
                    }
                </div>
                
                <h3>📨 Pending Invitations</h3>
                <div id="pendingInvitations">
                    ${myInvitations.filter(i => i.status === 'pending').length === 0 ? '<div class="message">No pending invitations.</div>' :
                        myInvitations.filter(i => i.status === 'pending').map(inv => {
                            const freelancer = findUser(inv.freelancerEmail);
                            const project = projects.find(p => p.id === inv.projectId);
                            return `
                                <div class="project-card">
                                    <div class="flex-between">
                                        <strong>Project: ${escapeHtml(project?.projectName)}</strong>
                                        <span class="badge badge-pending">Waiting for Response</span>
                                    </div>
                                    <div>👤 Freelancer: ${escapeHtml(freelancer?.name)} (${escapeHtml(freelancer?.category)})</div>
                                    <div>📧 ${escapeHtml(inv.freelancerEmail)}</div>
                                </div>
                            `;
                        }).join('')
                    }
                </div>
                
                <h3>⚡ Projects & Tasks Overview</h3>
                <div id="activeProjects">
                    ${clientProjects.filter(p => getProjectMembersByProject(p.id).length > 0).length === 0 ? '<div class="message">No active projects with team members yet.</div>' :
                        clientProjects.filter(p => getProjectMembersByProject(p.id).length > 0).map(proj => {
                            const projectTasks = getTasksByProject(proj.id);
                            const taskProgress = getProjectTaskProgress(proj.id);
                            const members = getProjectMembersByProject(proj.id);
                            const projectSubmissions = submissions.filter(s => s.projectId === proj.id);
                            
                            return `
                                <div class="project-card">
                                    <div class="flex-between">
                                        <strong>📌 ${escapeHtml(proj.projectName)}</strong>
                                        <span class="badge badge-hired">Tasks: ${taskProgress}% Complete</span>
                                    </div>
                                    <div>💰 ${escapeHtml(proj.budget)}</div>
                                    <div class="progress-bar"><div class="progress-fill" style="width: ${taskProgress}%"></div></div>
                                    
                                    <h4 style="margin-top:1rem;">📋 All Tasks (${projectTasks.length})</h4>
                                    ${projectTasks.length === 0 ? '<div class="message">No tasks created yet. Click "Create Task" to get started!</div>' :
                                        projectTasks.map(task => {
                                            const assignedFreelancer = findUser(task.assignedTo);
                                            return `
                                                <div class="submission-card" style="background:${task.status === 'completed' ? '#c6f6d5' : task.status === 'in-progress' ? '#fefcbf' : '#edf2f7'}">
                                                    <div class="flex-between">
                                                        <strong>${escapeHtml(task.title)}</strong>
                                                        <div>
                                                            <span class="badge ${task.status === 'completed' ? 'badge-approved' : task.status === 'in-progress' ? 'badge-pending' : 'badge-available'}">${task.status.toUpperCase()}</span>
                                                            <button onclick="window.showEditTaskForm('${task.id}', '${escapeHtml(task.title)}', '${escapeHtml(task.description)}', '${task.assignedTo}')" class="btn btn-outline btn-sm" style="margin-left:0.5rem;">✏️ Edit</button>
                                                            <button onclick="window.handleDeleteTask('${task.id}')" class="btn btn-danger btn-sm" style="margin-left:0.5rem;">🗑️ Delete</button>
                                                        </div>
                                                    </div>
                                                    <div>📝 ${escapeHtml(task.description)}</div>
                                                    <div>👤 Assigned to: ${escapeHtml(assignedFreelancer?.name || task.assignedTo || 'Unassigned')}</div>
                                                    <div>📅 Created: ${new Date(task.createdAt).toLocaleDateString()}</div>
                                                    ${task.completedAt ? `<div>✅ Completed: ${new Date(task.completedAt).toLocaleDateString()}</div>` : ''}
                                                </div>
                                            `;
                                        }).join('')
                                    }
                                    
                                    <h4 style="margin-top:1rem;">👥 Team Members</h4>
                                    ${members.map(member => {
                                        const freelancer = findUser(member.freelancerEmail);
                                        const memberTasks = getTasksByFreelancer(proj.id, member.freelancerEmail);
                                        const completedCount = memberTasks.filter(t => t.status === 'completed').length;
                                        const progress = getFreelancerTaskProgress(proj.id, member.freelancerEmail);
                                        
                                        return `
                                            <div style="background:#edf2f7; padding:0.5rem; border-radius:0.5rem; margin-top:0.5rem;">
                                                <div class="flex-between">
                                                    <strong>${escapeHtml(freelancer?.name)}</strong>
                                                    <div>
                                                        <span>${progress}% Complete (${completedCount}/${memberTasks.length} tasks)</span>
                                                        <button onclick="window.handleRemoveFreelancer('${proj.id}', '${member.freelancerEmail}')" class="btn btn-danger btn-sm" style="margin-left:0.5rem;">Remove</button>
                                                    </div>
                                                </div>
                                                <div class="progress-bar"><div class="progress-fill" style="width: ${progress}%"></div></div>
                                            </div>
                                        `;
                                    }).join('')}
                                    
                                    <h4 style="margin-top:1rem;">📤 Submissions (${projectSubmissions.length})</h4>
                                    ${projectSubmissions.length === 0 ? '<div class="message">No submissions yet.</div>' :
                                        projectSubmissions.map(sub => {
                                            const freelancer = findUser(sub.freelancerEmail);
                                            return `
                                                <div class="submission-card" style="background:${sub.status === 'pending' ? '#fefcbf' : sub.status === 'approved' ? '#c6f6d5' : '#fed7d7'}">
                                                    <div class="flex-between">
                                                        <strong>${escapeHtml(sub.milestone)}</strong>
                                                        <span class="badge ${sub.status === 'pending' ? 'badge-pending' : sub.status === 'approved' ? 'badge-approved' : 'badge-rejected'}">${sub.status.toUpperCase()}</span>
                                                    </div>
                                                    <div>👤 Freelancer: ${escapeHtml(freelancer?.name || sub.freelancerEmail)}</div>
                                                    <div>📝 ${escapeHtml(sub.description)}</div>
                                                    <div>📎 Attachment: ${escapeHtml(sub.fileUrl)}</div>
                                                    <div>📅 Submitted: ${new Date(sub.submittedAt).toLocaleDateString()}</div>
                                                    ${sub.status === 'pending' ? `
                                                        <div class="flex-between" style="margin-top:0.8rem;">
                                                            <button class="btn btn-success btn-sm" onclick="window.approveWork('${sub.id}', '${proj.id}', '${sub.freelancerEmail}', '${email}')">✅ Approve</button>
                                                            <button class="revision-btn" onclick="window.rejectWork('${sub.id}', '${proj.id}', '${sub.freelancerEmail}', '${email}')">🔄 Reject</button>
                                                        </div>
                                                    ` : ''}
                                                </div>
                                            `;
                                        }).join('')
                                    }
                                </div>
                            `;
                        }).join('')
                    }
                </div>
            </div>
        `;
    }
    
    window.handleRemoveFreelancer = function(projectId, freelancerEmail) {
        const session = getSession();
        if (session && confirm(`Are you sure you want to remove ${freelancerEmail} from this project?`)) {
            removeFreelancer(projectId, freelancerEmail, session.email);
            renderClientDashboard(session.email);
        }
    };
    
    window.showEditTaskForm = function(taskId, currentTitle, currentDescription, currentAssignee) {
        const session = getSession();
        const tasks = getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const members = getProjectMembersByProject(task.projectId);
        
        const container = document.getElementById("app");
        container.innerHTML = `
            <div class="glass-card">
                <div class="flex-between">
                    <h2>✏️ Edit Task</h2>
                    <button onclick="window.goBackToClient()" class="btn btn-outline">Cancel</button>
                </div>
                
                <div class="form-group">
                    <label>Task Title</label>
                    <input type="text" id="editTaskTitle" value="${escapeHtml(currentTitle)}">
                </div>
                <div class="form-group">
                    <label>Task Description</label>
                    <textarea id="editTaskDescription" rows="3">${escapeHtml(currentDescription)}</textarea>
                </div>
                <div class="form-group">
                    <label>Assign To</label>
                    <select id="editTaskAssignee">
                        <option value="">Unassigned</option>
                        ${members.map(m => {
                            const freelancer = findUser(m.freelancerEmail);
                            const selected = m.freelancerEmail === currentAssignee ? 'selected' : '';
                            return `<option value="${m.freelancerEmail}" ${selected}>${escapeHtml(freelancer?.name)} (${escapeHtml(freelancer?.category)})</option>`;
                        }).join('')}
                    </select>
                </div>
                
                <button onclick="window.saveTaskEdit('${taskId}')" class="btn btn-primary" style="width:100%">💾 Save Changes</button>
            </div>
        `;
    };
    
    window.saveTaskEdit = function(taskId) {
        const title = document.getElementById("editTaskTitle").value.trim();
        const description = document.getElementById("editTaskDescription").value.trim();
        const assignee = document.getElementById("editTaskAssignee").value;
        const session = getSession();
        
        if (!title || !description) {
            alert("Please fill all fields!");
            return;
        }
        
        if (editTask(taskId, title, description, assignee, session.email)) {
            alert("Task updated successfully!");
            renderClientDashboard(session.email);
        }
    };
    
    window.handleDeleteTask = function(taskId) {
        const session = getSession();
        if (deleteTask(taskId, session.email)) {
            renderClientDashboard(session.email);
        }
    };
    
    window.showCreateTaskForm = function(projectId, projectName) {
        const members = getProjectMembersByProject(projectId);
        
        const container = document.getElementById("app");
        container.innerHTML = `
            <div class="glass-card">
                <div class="flex-between">
                    <h2>📋 Create New Task for: ${escapeHtml(projectName)}</h2>
                    <button onclick="window.goBackToClient()" class="btn btn-outline">← Back to Dashboard</button>
                </div>
                
                <div class="form-group">
                    <label>Task Title</label>
                    <input type="text" id="taskTitle" placeholder="e.g., Design Homepage">
                </div>
                <div class="form-group">
                    <label>Task Description</label>
                    <textarea id="taskDescription" rows="3" placeholder="Detailed description of the task..."></textarea>
                </div>
                <div class="form-group">
                    <label>Assign To</label>
                    <select id="taskAssignee">
                        <option value="">Select freelancer...</option>
                        ${members.map(m => {
                            const freelancer = findUser(m.freelancerEmail);
                            return `<option value="${m.freelancerEmail}">${escapeHtml(freelancer?.name)} (${escapeHtml(freelancer?.category)})</option>`;
                        }).join('')}
                    </select>
                </div>
                <button onclick="window.createNewTask('${projectId}')" class="btn btn-primary" style="width:100%">✨ Create Task</button>
            </div>
        `;
    };
    
    window.createNewTask = function(projectId) {
        const title = document.getElementById("taskTitle").value.trim();
        const description = document.getElementById("taskDescription").value.trim();
        const assignedTo = document.getElementById("taskAssignee").value;
        
        if (!title || !description || !assignedTo) {
            alert("Please fill all fields and assign to a freelancer!");
            return;
        }
        
        if (!canAssignToProject(projectId, assignedTo)) {
            alert("Task can only be assigned to existing team members!");
            return;
        }
        
        try {
            createTask(projectId, assignedTo, title, description);
            alert("Task created successfully!");
            
            const session = getSession();
            if (session && session.email) {
                renderClientDashboard(session.email);
            }
        } catch (error) {
            alert(error.message);
        }
    };
    
    window.goBackToClient = function() {
        const session = getSession();
        if (session && session.email) {
            renderClientDashboard(session.email);
        }
    };

    window.showFreelancersForHire = function(projectId, projectName) {
        const freelancers = getUsers().filter(u => u.role === "freelancer");
        const currentMembers = getProjectMembersByProject(projectId);
        const availableFreelancers = freelancers.filter(f => !currentMembers.some(m => m.freelancerEmail === f.email));
        
        const container = document.getElementById("app");
        
        container.innerHTML = `
            <div class="glass-card">
                <div class="flex-between">
                    <h2>👥 Manage Team for: ${escapeHtml(projectName)}</h2>
                    <button onclick="window.goBackToClient()" class="btn btn-outline">← Back to Dashboard</button>
                </div>
                
                <div class="message">
                    <strong>Current Team Members: ${currentMembers.length}</strong>
                    ${currentMembers.map(m => {
                        const f = findUser(m.freelancerEmail);
                        const progress = getFreelancerTaskProgress(projectId, m.freelancerEmail);
                        return `<div>• ${escapeHtml(f?.name)} (${escapeHtml(f?.category)}) - ${progress}% complete</div>`;
                    }).join('')}
                </div>
                
                <h3>📨 Invite New Freelancers</h3>
                <div class="grid-3">
                    ${availableFreelancers.length === 0 ? '<div class="message">No more freelancers available to invite!</div>' :
                        availableFreelancers.map(f => `
                        <div class="freelancer-card">
                            <img class="profile-img" src="${escapeHtml(f.image)}" style="width:60px; height:60px;" onerror="this.src='https://via.placeholder.com/60'">
                            <h3>${escapeHtml(f.name)}</h3>
                            <div><strong>📌 Category:</strong> ${escapeHtml(f.category)}</div>
                            <div><strong>📞 Phone:</strong> ${escapeHtml(f.phone)}</div>
                            <div><strong>🎓 Experience:</strong> ${escapeHtml(f.pastExperience)}</div>
                            <button onclick="window.sendInvitation('${projectId}', '${f.email}')" class="btn btn-primary" style="width:100%; margin-top:1rem;">📨 Send Invitation</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    window.sendInvitation = function(projectId, freelancerEmail) {
        const session = getSession();
        if (!session) return;
        
        const invitations = getInvitations();
        const existing = invitations.find(i => i.projectId === projectId && i.freelancerEmail === freelancerEmail);
        
        if (existing) {
            alert("Invitation already sent to this freelancer!");
            return;
        }
        
        invitations.push({
            id: "inv_" + Date.now(),
            projectId: projectId,
            clientEmail: session.email,
            freelancerEmail: freelancerEmail,
            status: "pending",
            sentAt: Date.now()
        });
        
        saveInvitations(invitations);
        alert("Invitation sent successfully!");
        renderClientDashboard(session.email);
    };

    // ========== FREELANCER DASHBOARD ==========
    function renderFreelancerDashboard(email) {
        const freelancer = findUser(email);
        if (!freelancer) return renderLogin();
        
        let projects = getProjects();
        let invitations = getInvitations();
        let submissions = getSubmissions();
        let projectMembers = getProjectMembers();
        
        let myInvitations = invitations.filter(i => i.freelancerEmail === email && i.status === "pending");
        
        let myProjects = [];
        projectMembers.forEach(pm => {
            const isMember = pm.members.some(m => m.freelancerEmail === email);
            if (isMember) {
                const project = projects.find(p => p.id === pm.projectId);
                if (project) {
                    const myTasks = getTasksByFreelancer(project.id, email);
                    const taskProgress = getFreelancerTaskProgress(project.id, email);
                    
                    myProjects.push({
                        ...project,
                        taskProgress: taskProgress,
                        myTasks: myTasks,
                        teamMembers: pm.members.filter(m => m.freelancerEmail !== email)
                    });
                }
            }
        });
        
        const container = document.getElementById("app");
        
        container.innerHTML = `
            <div class="glass-card">
                <div class="flex-between">
                    <h2>💼 Freelancer Dashboard</h2>
                    <div>
                        <button onclick="window.showEditProfileForm('${email}')" class="btn btn-outline btn-sm" style="margin-right:0.5rem;">✏️ Edit Profile</button>
                        <button onclick="window.logout()" class="logout-btn">Logout</button>
                    </div>
                </div>
                
                <div class="freelancer-profile">
                    <img class="profile-img" src="${escapeHtml(freelancer.image)}" onerror="this.src='https://via.placeholder.com/70'">
                    <div>
                        <strong>${escapeHtml(freelancer.name)}</strong><br>
                        📌 ${escapeHtml(freelancer.category)} | 📞 ${escapeHtml(freelancer.phone)}<br>
                        🎓 ${escapeHtml(freelancer.pastExperience)}
                    </div>
                </div>
                
                <h3>📨 Project Invitations (${myInvitations.length})</h3>
                <div id="invitations">
                    ${myInvitations.length === 0 ? '<div class="message">No pending invitations.</div>' :
                        myInvitations.map(inv => {
                            const project = projects.find(p => p.id === inv.projectId);
                            const client = findUser(inv.clientEmail);
                            return `
                                <div class="project-card">
                                    <div class="flex-between">
                                        <strong>📌 ${escapeHtml(project?.projectName)}</strong>
                                        <span class="badge badge-pending">Pending Decision</span>
                                    </div>
                                    <div><strong>Client:</strong> ${escapeHtml(client?.name)}</div>
                                    <div><strong>Budget:</strong> ${escapeHtml(project?.budget)}</div>
                                    <div><strong>Description:</strong> ${escapeHtml(project?.description)}</div>
                                    <div><strong>Requirements:</strong> ${escapeHtml(project?.details)}</div>
                                    <div><strong>Deadline:</strong> ${project?.deadline || 'Not specified'}</div>
                                    <div class="flex-between" style="margin-top:1rem;">
                                        <button onclick="window.respondToInvitation('${inv.id}', 'accept', '${email}', '${inv.projectId}')" class="btn btn-success">✅ Accept & Join Team</button>
                                        <button onclick="window.respondToInvitation('${inv.id}', 'reject', '${email}', '${inv.projectId}')" class="btn btn-danger">❌ Reject</button>
                                    </div>
                                </div>
                            `;
                        }).join('')
                    }
                </div>
                
                <h3>⚡ My Active Projects</h3>
                <div id="activeProjects">
                    ${myProjects.length === 0 ? '<div class="message">No active projects yet. Accept invitations to get started!</div>' :
                        myProjects.map(proj => {
                            const projectTasks = getTasksByFreelancer(proj.id, email);
                            
                            return `
                                <div class="project-card">
                                    <div class="flex-between">
                                        <strong>📌 ${escapeHtml(proj.projectName)}</strong>
                                        <div>
                                            <span class="badge badge-hired">My Progress: ${proj.taskProgress}%</span>
                                            <button onclick="window.handleLeaveProject('${proj.id}', '${email}')" class="btn btn-danger btn-sm" style="margin-left:0.5rem;">Leave Project</button>
                                        </div>
                                    </div>
                                    <div><strong>Client:</strong> ${escapeHtml(proj.clientName || proj.clientEmail)}</div>
                                    <div><strong>Budget:</strong> ${escapeHtml(proj.budget)}</div>
                                    <div><strong>Description:</strong> ${escapeHtml(proj.description)}</div>
                                    <div class="progress-bar"><div class="progress-fill" style="width: ${proj.taskProgress}%"></div></div>
                                    
                                    <h4 style="margin-top:1rem;">📋 My Tasks (${projectTasks.length})</h4>
                                    ${projectTasks.length === 0 ? '<div class="message">No tasks assigned yet. The client will create tasks for you.</div>' :
                                        projectTasks.map(task => `
                                            <div class="submission-card" style="background:${task.status === 'completed' ? '#c6f6d5' : task.status === 'in-progress' ? '#fefcbf' : '#edf2f7'}">
                                                <div class="flex-between">
                                                    <strong>${escapeHtml(task.title)}</strong>
                                                    <span class="badge ${task.status === 'completed' ? 'badge-approved' : task.status === 'in-progress' ? 'badge-pending' : 'badge-available'}">${task.status.toUpperCase()}</span>
                                                </div>
                                                <div>📝 ${escapeHtml(task.description)}</div>
                                                <div>📅 Created: ${new Date(task.createdAt).toLocaleDateString()}</div>
                                                ${task.completedAt ? `<div>✅ Completed: ${new Date(task.completedAt).toLocaleDateString()}</div>` : ''}
                                                ${task.status !== 'completed' ? `
                                                    <div class="flex-between" style="margin-top:0.8rem;">
                                                        ${task.status === 'todo' ? 
                                                            `<button class="btn btn-primary btn-sm" onclick="window.updateTask('${task.id}', 'in-progress', '${email}')">▶️ Start Task</button>` : 
                                                            `<button class="btn btn-success btn-sm" onclick="window.updateTask('${task.id}', 'completed', '${email}')">✅ Mark Complete</button>`
                                                        }
                                                    </div>
                                                ` : ''}
                                            </div>
                                        `).join('')
                                    }
                                    
                                    <h4 style="margin-top:1rem;">👥 Team Members</h4>
                                    ${proj.teamMembers.length === 0 ? '<div class="message">You\'re the only team member so far!</div>' :
                                        `<div style="display:flex; flex-direction:column; gap:0.5rem;">
                                            ${proj.teamMembers.map(member => {
                                                const teammate = findUser(member.freelancerEmail);
                                                const teammateTasks = getTasksByFreelancer(proj.id, member.freelancerEmail);
                                                const completedCount = teammateTasks.filter(t => t.status === 'completed').length;
                                                const progress = getFreelancerTaskProgress(proj.id, member.freelancerEmail);
                                                return `
                                                    <div style="background:#edf2f7; padding:0.5rem; border-radius:0.5rem;">
                                                        <strong>${escapeHtml(teammate?.name)}</strong> - ${escapeHtml(teammate?.category)}<br>
                                                        📊 Progress: ${progress}% (${completedCount}/${teammateTasks.length} tasks)
                                                    </div>
                                                `;
                                            }).join('')}
                                        </div>`
                                    }
                                    
                                    <h4 style="margin-top:1rem;">📤 Submit Work</h4>
                                    <div class="grid-2">
                                        <input type="text" id="milestone-${proj.id}" placeholder="Milestone Name">
                                        <input type="text" id="fileUrl-${proj.id}" placeholder="File/Attachment name">
                                        <textarea id="workDesc-${proj.id}" placeholder="Describe what you completed..." rows="2"></textarea>
                                    </div>
                                    <button onclick="window.submitWorkForProject('${proj.id}', '${email}', '${proj.clientEmail}')" class="btn btn-primary btn-sm" style="width:100%; margin-top:0.5rem;">📎 Submit Work</button>
                                    
                                    <h4 style="margin-top:1rem;">📋 My Submissions</h4>
                                    ${submissions.filter(s => s.projectId === proj.id && s.freelancerEmail === email).length === 0 ? '<div class="message">No submissions yet.</div>' :
                                        submissions.filter(s => s.projectId === proj.id && s.freelancerEmail === email).map(sub => `
                                            <div class="submission-card" style="background:${sub.status === 'pending' ? '#fefcbf' : sub.status === 'approved' ? '#c6f6d5' : '#fed7d7'}">
                                                <div class="flex-between">
                                                    <strong>${escapeHtml(sub.milestone)}</strong>
                                                    <span class="badge ${sub.status === 'pending' ? 'badge-pending' : sub.status === 'approved' ? 'badge-approved' : 'badge-rejected'}">${sub.status.toUpperCase()}</span>
                                                </div>
                                                <div>📝 ${escapeHtml(sub.description)}</div>
                                                <div>📅 ${new Date(sub.submittedAt).toLocaleDateString()}</div>
                                            </div>
                                        `).join('')
                                    }
                                </div>
                            `;
                        }).join('')
                    }
                </div>
            </div>
        `;
    }
    
    window.handleLeaveProject = function(projectId, freelancerEmail) {
        if (confirm("Are you sure you want to leave this project?")) {
            leaveProject(projectId, freelancerEmail);
            renderFreelancerDashboard(freelancerEmail);
        }
    };
    
    window.updateTask = function(taskId, newStatus, freelancerEmail) {
        const success = updateTaskStatus(taskId, newStatus, freelancerEmail);
        if (success) {
            alert(`Task marked as ${newStatus}!`);
            renderFreelancerDashboard(freelancerEmail);
        }
    };
    
    window.showEditProfileForm = function(freelancerEmail) {
        const freelancer = getFreelancerProfile(freelancerEmail);
        if (!freelancer) return;
        
        const container = document.getElementById("app");
        
        container.innerHTML = `
            <div class="glass-card">
                <div class="flex-between">
                    <h2>✏️ Edit Profile</h2>
                    <button onclick="window.cancelEditProfile('${freelancerEmail}')" class="btn btn-outline">Cancel</button>
                </div>
                
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="editName" value="${escapeHtml(freelancer.name)}">
                </div>
                <div class="form-group">
                    <label>Category (Skills)</label>
                    <input type="text" id="editCategory" value="${escapeHtml(freelancer.category)}">
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="text" id="editPhone" value="${escapeHtml(freelancer.phone)}">
                </div>
                <div class="form-group">
                    <label>Profile Image URL</label>
                    <input type="text" id="editImage" value="${escapeHtml(freelancer.image)}">
                </div>
                <div class="form-group">
                    <label>Past Experience</label>
                    <textarea id="editExperience" rows="3">${escapeHtml(freelancer.pastExperience)}</textarea>
                </div>
                
                <button onclick="window.saveProfileEdit('${freelancerEmail}')" class="btn btn-primary" style="width:100%">💾 Save Changes</button>
            </div>
        `;
    };
    
    window.cancelEditProfile = function(email) {
        renderFreelancerDashboard(email);
    };
    
    window.saveProfileEdit = function(email) {
        const updates = {
            name: document.getElementById("editName").value.trim(),
            category: document.getElementById("editCategory").value.trim(),
            phone: document.getElementById("editPhone").value.trim(),
            image: document.getElementById("editImage").value.trim(),
            pastExperience: document.getElementById("editExperience").value.trim()
        };
        
        if (!updates.name || !updates.category || !updates.phone || !updates.image || !updates.pastExperience) {
            alert("Please fill all fields!");
            return;
        }
        
        if (updateFreelancerProfile(email, updates)) {
            alert("Profile updated successfully!");
            renderFreelancerDashboard(email);
        }
    };

    window.submitWorkForProject = function(projectId, freelancerEmail, clientEmail) {
        const milestone = document.getElementById(`milestone-${projectId}`).value.trim();
        const fileUrl = document.getElementById(`fileUrl-${projectId}`).value.trim();
        const description = document.getElementById(`workDesc-${projectId}`).value.trim();
        
        if (!milestone || !description) {
            alert("Please fill milestone name and work description!");
            return;
        }
        
        submitWork(projectId, freelancerEmail, milestone, description, fileUrl || "work_sample.pdf");
        alert("Work submitted! Waiting for client approval.");
        
        const session = getSession();
        if (session && session.email === freelancerEmail) {
            renderFreelancerDashboard(freelancerEmail);
        }
    };

    window.respondToInvitation = function(invitationId, response, freelancerEmail, projectId) {
        let invitations = getInvitations();
        const invitationIndex = invitations.findIndex(i => i.id === invitationId);
        
        if (invitationIndex === -1) {
            alert("Invitation not found!");
            return;
        }
        
        if (response === 'accept') {
            invitations[invitationIndex].status = 'accepted';
            saveInvitations(invitations);
            
            addMemberToProject(projectId, freelancerEmail);
            
            let projects = getProjects();
            const projectIndex = projects.findIndex(p => p.id === projectId);
            if (projectIndex !== -1 && projects[projectIndex].status === 'available') {
                projects[projectIndex].status = 'hired';
                saveProjects(projects);
            }
            
            alert("You've joined the team! The client will assign tasks for you to complete.");
        } else {
            invitations[invitationIndex].status = 'rejected';
            saveInvitations(invitations);
            alert("Invitation rejected.");
        }
        
        renderFreelancerDashboard(freelancerEmail);
    };

    window.createProject = function(clientEmail) {
        const projectName = document.getElementById("projectName").value.trim();
        const budget = document.getElementById("budget").value.trim();
        const description = document.getElementById("description").value.trim();
        const details = document.getElementById("details").value.trim();
        const deadline = document.getElementById("deadline").value;
        
        if (!projectName || !budget || !description || !details) {
            return alert("Please fill all fields!");
        }
        
        const projects = getProjects();
        const newProject = {
            id: "proj_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
            clientEmail: clientEmail,
            clientName: clientEmail.split('@')[0],
            projectName: projectName,
            budget: budget,
            description: description,
            details: details,
            deadline: deadline ? `${deadline} days` : "Flexible",
            status: "available",
            createdAt: Date.now()
        };
        
        projects.push(newProject);
        saveProjects(projects);
        renderClientDashboard(clientEmail);
    };

    function renderLogin() {
        const container = document.getElementById("app");
        container.innerHTML = `
            <div class="glass-card login-card">
                <div style="text-align: center;">
                    <h1>FreeLancer Hub</h1>
                    <p style="color: #4a5568; margin-top: 0.5rem;">Complete Project Management Platform</p>
                </div>
                <div class="role-buttons">
                    <button onclick="window.showClientLogin()" class="btn btn-primary">📋 I'm a Client</button>
                    <button onclick="window.showFreelancerLogin()" class="btn btn-outline">💼 I'm a Freelancer</button>
                </div>
                <div id="loginForm"></div>
            </div>
        `;
    }

    window.showClientLogin = function() {
        const formDiv = document.getElementById("loginForm");
        formDiv.innerHTML = `
            <div class="form-group"><label>Full Name</label><input type="text" id="clientName" placeholder="Enter your name"></div>
            <div class="form-group"><label>Email</label><input type="email" id="clientEmail" placeholder="client@example.com"></div>
            <button onclick="window.handleClientLogin()" class="btn btn-primary" style="width:100%">Continue →</button>
        `;
    };

window.handleClientLogin = async function() {

    const name = document.getElementById("clientName").value.trim();
    const email = document.getElementById("clientEmail").value.trim().toLowerCase();

    if (!name || !email) {
        return alert("Please fill all fields");
    }

    try {

        let response = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password: "123456",
                role: "client"
            })
        });

        let data = await response.json();

        if (!response.ok) {

            response = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password: "123456"
                })
            });

            data = await response.json();

            if (!response.ok) {
                return alert(data.message || "Login failed");
            }
        }

        localStorage.setItem("token", data.token);

        setSession(email, "client");

        renderClientDashboard(email);

    } catch (error) {
        console.error(error);
        alert("Server error");
    }
};

    window.showFreelancerLogin = function() {
        const formDiv = document.getElementById("loginForm");
        formDiv.innerHTML = `
            <div class="form-group"><label>Email</label><input type="email" id="freelancerEmail" placeholder="freelancer@example.com"></div>
            <button onclick="window.checkFreelancer()" class="btn btn-primary" style="width:100%">Check / Register →</button>
            <div id="regForm" style="display:none; margin-top:1.5rem;"></div>
        `;
    };

    window.checkFreelancer = function() {
        const email = document.getElementById("freelancerEmail").value.trim().toLowerCase();
        if (!email) return alert("Enter email");
        
        const existing = findUser(email);
        if (existing && existing.role === "freelancer") {
            setSession(email, "freelancer");
            renderFreelancerDashboard(email);
        } else if (existing && existing.role === "client") {
            alert("Email registered as client");
        } else {
            const regDiv = document.getElementById("regForm");
            regDiv.style.display = "block";
            regDiv.innerHTML = `
                <h3>📝 Register Freelancer</h3>
                <div class="form-group"><label>Full Name</label><input type="text" id="regName"></div>
                <div class="form-group"><label>Category</label><input type="text" id="regCategory"></div>
                <div class="form-group"><label>Phone</label><input type="text" id="regPhone"></div>
                <div class="form-group"><label>Profile Image URL</label><input type="text" id="regImage" placeholder="https://..."></div>
                <div class="form-group"><label>Past Experience</label><textarea id="regExperience" rows="2"></textarea></div>
                <button onclick="window.completeRegistration('${email}')" class="btn btn-primary" style="width:100%">Register →</button>
            `;
        }
    };

   window.completeRegistration = async function(email) {

    const name = document.getElementById("regName").value.trim();
    const category = document.getElementById("regCategory").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const image = document.getElementById("regImage").value.trim();
    const experience = document.getElementById("regExperience").value.trim();

    if (!name || !category || !phone || !image || !experience) {
        return alert("Please fill all fields");
    }

    try {

        const response = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password: "123456",
                role: "freelancer"
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return alert(data.message || "Registration failed");
        }

        // Extra freelancer info still local for now
        const users = getUsers();

        users.push({
            email,
            name,
            category,
            phone,
            image,
            pastExperience: experience,
            role: "freelancer",
            registered: true
        });

        saveUsers(users);

        localStorage.setItem("token", data.token);

        setSession(email, "freelancer");

        renderFreelancerDashboard(email);

    } catch (error) {
        console.error(error);
        alert("Server error");
    }
};

    window.logout = function() {
        clearSession();
        renderLogin();
    };

    // ========== START APP ==========
    initializeStorage();
    const session = getSession();
    if (session && session.email) {
        const user = findUser(session.email);
        if (user && user.role === "client") {
            renderClientDashboard(session.email);
        } else if (user && user.role === "freelancer") {
            renderFreelancerDashboard(session.email);
        } else {
            renderLogin();
        }
    } else {
        renderLogin();
    }
})();
