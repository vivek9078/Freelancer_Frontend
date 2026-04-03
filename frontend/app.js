(function() {
    // ========== STORAGE KEYS ==========
    const STORAGE_USERS = "workhub_users_final";
    const STORAGE_PROJECTS = "workhub_projects_final";
    const STORAGE_INVITATIONS = "workhub_invitations_final";
    const STORAGE_HIRED = "workhub_hired_final";
    const STORAGE_SUBMISSIONS = "workhub_submissions_final";
    const STORAGE_SESSION = "workhub_session_final";

    // ========== INITIALIZE STORAGE ==========
    function initializeStorage() {
        if (!localStorage.getItem(STORAGE_USERS)) {
            const users = [
                { email: "client@demo.com", role: "client", name: "John Client", registered: true },
                { email: "alice@dev.com", role: "freelancer", name: "Alice Johnson", category: "Full Stack Developer", phone: "+1234567890", image: "https://randomuser.me/api/portraits/women/1.jpg", pastExperience: "7 years in React, Node.js, Python" },
                { email: "bob@design.com", role: "freelancer", name: "Bob Smith", category: "UI/UX Designer", phone: "+1234567891", image: "https://randomuser.me/api/portraits/men/2.jpg", pastExperience: "5 years in Figma, Adobe XD" }
            ];
            localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
        }

        if (!localStorage.getItem(STORAGE_PROJECTS)) localStorage.setItem(STORAGE_PROJECTS, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_INVITATIONS)) localStorage.setItem(STORAGE_INVITATIONS, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_HIRED)) localStorage.setItem(STORAGE_HIRED, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_SUBMISSIONS)) localStorage.setItem(STORAGE_SUBMISSIONS, JSON.stringify([]));
    }

    // ========== HELPER FUNCTIONS ==========
    function getUsers() { return JSON.parse(localStorage.getItem(STORAGE_USERS) || "[]"); }
    function saveUsers(users) { localStorage.setItem(STORAGE_USERS, JSON.stringify(users)); }
    function getProjects() { return JSON.parse(localStorage.getItem(STORAGE_PROJECTS) || "[]"); }
    function saveProjects(projects) { localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(projects)); }
    function getInvitations() { return JSON.parse(localStorage.getItem(STORAGE_INVITATIONS) || "[]"); }
    function saveInvitations(invitations) { localStorage.setItem(STORAGE_INVITATIONS, JSON.stringify(invitations)); }
    function getHired() { return JSON.parse(localStorage.getItem(STORAGE_HIRED) || "[]"); }
    function saveHired(hired) { localStorage.setItem(STORAGE_HIRED, JSON.stringify(hired)); }
    function getSubmissions() { return JSON.parse(localStorage.getItem(STORAGE_SUBMISSIONS) || "[]"); }
    function saveSubmissions(submissions) { localStorage.setItem(STORAGE_SUBMISSIONS, JSON.stringify(submissions)); }
    function getSession() { return JSON.parse(localStorage.getItem(STORAGE_SESSION) || "null"); }
    function setSession(email, role) { localStorage.setItem(STORAGE_SESSION, JSON.stringify({ email, role })); }
    function clearSession() { localStorage.removeItem(STORAGE_SESSION); }
    
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
    
    // APPROVE WORK - increments progress by 20% each time (max 100%)
    window.approveWork = function(submissionId, projectId, freelancerEmail, clientEmail) {
        console.log("Approve work called:", submissionId);
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
        
        // Update submission status
        submission.status = "approved";
        submission.approvedAt = Date.now();
        saveSubmissions(submissions);
        
        // Update project progress - each approved submission adds 20%
        let hired = getHired();
        const hiredIndex = hired.findIndex(h => h.projectId === projectId && h.freelancerEmail === freelancerEmail);
        if (hiredIndex !== -1) {
            const projectSubmissions = submissions.filter(s => s.projectId === projectId && s.freelancerEmail === freelancerEmail);
            const approvedCount = projectSubmissions.filter(s => s.status === "approved").length;
            const newProgress = Math.min(100, approvedCount * 20);
            hired[hiredIndex].progress = newProgress;
            saveHired(hired);
            console.log(`Progress updated to ${newProgress}%`);
        }
        
        alert(`✅ Work approved! Progress increased by 20%. Current progress: ${hired[hiredIndex]?.progress || 0}%`);
        
        // Refresh dashboards
        const session = getSession();
        if (session && session.email === clientEmail) {
            renderClientDashboard(clientEmail);
        } else if (session && session.email === freelancerEmail) {
            renderFreelancerDashboard(freelancerEmail);
        } else {
            if (clientEmail) renderClientDashboard(clientEmail);
            if (freelancerEmail) renderFreelancerDashboard(freelancerEmail);
        }
    };
    
    // REJECT WORK - marks as rejected, no popup
    window.rejectWork = function(submissionId, projectId, freelancerEmail, clientEmail) {
        console.log("Reject work called:", submissionId);
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
        
        // Mark as rejected
        submission.status = "rejected";
        submission.rejectedAt = Date.now();
        saveSubmissions(submissions);
        
        alert("⚠️ Work marked for revision. Please provide feedback to the freelancer.");
        
        // Refresh dashboards
        const session = getSession();
        if (session && session.email === clientEmail) {
            renderClientDashboard(clientEmail);
        } else if (session && session.email === freelancerEmail) {
            renderFreelancerDashboard(freelancerEmail);
        } else {
            if (clientEmail) renderClientDashboard(clientEmail);
            if (freelancerEmail) renderFreelancerDashboard(freelancerEmail);
        }
    };

    // ========== CLIENT DASHBOARD ==========
    function renderClientDashboard(email) {
        let projects = getProjects();
        let clientProjects = projects.filter(p => p.clientEmail === email);
        let invitations = getInvitations();
        let hired = getHired();
        let submissions = getSubmissions();
        
        let myInvitations = invitations.filter(i => i.clientEmail === email);
        let myHired = hired.filter(h => {
            const proj = projects.find(p => p.id === h.projectId);
            return proj && proj.clientEmail === email;
        });

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
                        clientProjects.map(p => `
                            <div class="project-card">
                                <div class="flex-between">
                                    <strong>${escapeHtml(p.projectName)}</strong>
                                    <span class="badge ${p.status === 'available' ? 'badge-available' : 'badge-hired'}">${p.status === 'available' ? 'Available' : 'Hired'}</span>
                                </div>
                                <div>💰 ${escapeHtml(p.budget)}</div>
                                <div>📝 ${escapeHtml(p.description)}</div>
                                <div>🔧 ${escapeHtml(p.details)}</div>
                                <div>⏰ Deadline: ${p.deadline || 'Not set'}</div>
                                ${p.status === 'available' ? 
                                    `<button onclick="window.showFreelancersForHire('${p.id}', '${p.projectName}')" class="btn btn-primary btn-sm" style="margin-top:0.8rem;">👥 Hire Freelancer</button>` : 
                                    '<div class="message" style="margin-top:0.8rem;">✅ Freelancer hired</div>'}
                            </div>
                        `).join('')
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
                
                <h3>⚡ Active Projects & Work Submissions</h3>
                <div id="activeProjects">
                    ${myHired.length === 0 ? '<div class="message">No active projects yet.</div>' :
                        myHired.map(h => {
                            const proj = projects.find(p => p.id === h.projectId);
                            const freelancer = findUser(h.freelancerEmail);
                            const projectSubmissions = submissions.filter(s => s.projectId === h.projectId && s.freelancerEmail === h.freelancerEmail);
                            const approvedCount = projectSubmissions.filter(s => s.status === "approved").length;
                            const expectedProgress = Math.min(100, approvedCount * 20);
                            // Sync progress if needed
                            if (h.progress !== expectedProgress) {
                                h.progress = expectedProgress;
                                saveHired(getHired());
                            }
                            
                            return `
                                <div class="project-card">
                                    <div class="flex-between">
                                        <strong>📌 ${escapeHtml(proj?.projectName)}</strong>
                                        <span class="badge badge-hired">Freelancer: ${escapeHtml(freelancer?.name)}</span>
                                    </div>
                                    <div>💰 ${escapeHtml(proj?.budget)}</div>
                                    <div>📊 Overall Progress: ${h.progress}% Complete</div>
                                    <div class="progress-bar"><div class="progress-fill" style="width: ${h.progress}%"></div></div>
                                    
                                    <h4 style="margin-top:1rem;">📎 Work Submissions</h4>
                                    ${projectSubmissions.length === 0 ? '<div class="message">No submissions yet. Freelancer will submit work for approval.</div>' :
                                        projectSubmissions.map(sub => `
                                            <div class="submission-card" style="background:${sub.status === 'pending' ? '#fefcbf' : sub.status === 'approved' ? '#c6f6d5' : '#fed7d7'}">
                                                <div class="flex-between">
                                                    <strong>${escapeHtml(sub.milestone)}</strong>
                                                    <span class="badge ${sub.status === 'pending' ? 'badge-pending' : sub.status === 'approved' ? 'badge-approved' : 'badge-rejected'}">${sub.status.toUpperCase()}</span>
                                                </div>
                                                <div>📝 ${escapeHtml(sub.description)}</div>
                                                <div>📎 Attachment: ${escapeHtml(sub.fileUrl)}</div>
                                                <div>📅 Submitted: ${new Date(sub.submittedAt).toLocaleDateString()}</div>
                                                ${sub.status === 'pending' ? `
                                                    <div class="flex-between" style="margin-top:0.8rem;">
                                                        <button class="btn btn-success btn-sm" onclick="window.approveWork('${sub.id}', '${h.projectId}', '${h.freelancerEmail}', '${email}')">✅ Approve (+20% Progress)</button>
                                                        <button class="revision-btn" onclick="window.rejectWork('${sub.id}', '${h.projectId}', '${h.freelancerEmail}', '${email}')">🔄 Needs Revision</button>
                                                    </div>
                                                    <div class="feedback-note">💡 Tip: Provide feedback to freelancer about what needs improvement</div>
                                                ` : sub.status === 'rejected' ? 
                                                    `<div class="message message-warning" style="margin-top:0.5rem;">⚠️ Revision requested. Please provide feedback to the freelancer.</div>` : 
                                                    `<div class="message" style="margin-top:0.5rem; background:#c6f6d5;">✅ Approved! Progress: +20%</div>`
                                                }
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

    window.showFreelancersForHire = function(projectId, projectName) {
        const freelancers = getUsers().filter(u => u.role === "freelancer");
        const container = document.getElementById("app");
        
        container.innerHTML = `
            <div class="glass-card">
                <div class="flex-between">
                    <h2>👥 Hire Freelancer for: ${escapeHtml(projectName)}</h2>
                    <button onclick="window.goBackToClient()" class="btn btn-outline">← Back to Dashboard</button>
                </div>
                <div class="grid-3">
                    ${freelancers.map(f => `
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

    window.goBackToClient = function() {
        const session = getSession();
        if (session && session.email) {
            renderClientDashboard(session.email);
        }
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
        let hired = getHired();
        let submissions = getSubmissions();
        
        let myInvitations = invitations.filter(i => i.freelancerEmail === email && i.status === "pending");
        let myProjects = hired.filter(h => h.freelancerEmail === email);
        
        const container = document.getElementById("app");
        
        container.innerHTML = `
            <div class="glass-card">
                <div class="flex-between">
                    <h2>💼 Freelancer Dashboard</h2>
                    <button onclick="window.logout()" class="logout-btn">Logout</button>
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
                                        <button onclick="window.respondToInvitation('${inv.id}', 'accept', '${email}', '${inv.projectId}')" class="btn btn-success">✅ Accept Project</button>
                                        <button onclick="window.respondToInvitation('${inv.id}', 'reject', '${email}', '${inv.projectId}')" class="btn btn-danger">❌ Reject</button>
                                    </div>
                                </div>
                            `;
                        }).join('')
                    }
                </div>
                
                <h3>⚡ My Active Projects</h3>
                <div id="activeProjects">
                    ${myProjects.length === 0 ? '<div class="message">No active projects yet.</div>' :
                        myProjects.map(h => {
                            const proj = projects.find(p => p.id === h.projectId);
                            const projectSubmissions = submissions.filter(s => s.projectId === h.projectId && s.freelancerEmail === email);
                            const approvedCount = projectSubmissions.filter(s => s.status === "approved").length;
                            const expectedProgress = Math.min(100, approvedCount * 20);
                            if (h.progress !== expectedProgress) {
                                h.progress = expectedProgress;
                                saveHired(getHired());
                            }
                            
                            return `
                                <div class="project-card">
                                    <div class="flex-between">
                                        <strong>📌 ${escapeHtml(proj?.projectName)}</strong>
                                        <span class="badge badge-hired">${h.progress}% Complete</span>
                                    </div>
                                    <div><strong>Client:</strong> ${escapeHtml(proj?.clientName || proj?.clientEmail)}</div>
                                    <div><strong>Budget:</strong> ${escapeHtml(proj?.budget)}</div>
                                    <div><strong>Description:</strong> ${escapeHtml(proj?.description)}</div>
                                    <div class="progress-bar"><div class="progress-fill" style="width: ${h.progress}%"></div></div>
                                    
                                    <h4 style="margin-top:1rem;">📤 Submit Work</h4>
                                    <div class="grid-2">
                                        <input type="text" id="milestone-${h.projectId}" placeholder="Milestone Name (e.g., Week 1 - Design)">
                                        <input type="text" id="fileUrl-${h.projectId}" placeholder="File/Attachment name">
                                        <textarea id="workDesc-${h.projectId}" placeholder="Describe what you completed..." rows="2"></textarea>
                                    </div>
                                    <button onclick="window.submitWorkForProject('${h.projectId}', '${email}', '${proj?.clientEmail}')" class="btn btn-primary" style="width:100%; margin-top:0.5rem;">📎 Submit Work for Approval</button>
                                    
                                    <h4 style="margin-top:1rem;">📋 Submission History</h4>
                                    ${projectSubmissions.length === 0 ? '<div class="message">No submissions yet.</div>' :
                                        projectSubmissions.map(sub => `
                                            <div class="submission-card" style="background:${sub.status === 'pending' ? '#fefcbf' : sub.status === 'approved' ? '#c6f6d5' : '#fed7d7'}">
                                                <div class="flex-between">
                                                    <strong>${escapeHtml(sub.milestone)}</strong>
                                                    <span class="badge ${sub.status === 'pending' ? 'badge-pending' : sub.status === 'approved' ? 'badge-approved' : 'badge-rejected'}">${sub.status.toUpperCase()}</span>
                                                </div>
                                                <div>📝 ${escapeHtml(sub.description)}</div>
                                                <div>📎 ${escapeHtml(sub.fileUrl)}</div>
                                                <div>📅 ${new Date(sub.submittedAt).toLocaleDateString()}</div>
                                                ${sub.status === 'rejected' ? `<div class="message message-warning" style="margin-top:0.5rem;">❌ Revision requested. Client will provide feedback.</div>` : 
                                                 sub.status === 'approved' ? `<div class="message" style="margin-top:0.5rem; background:#c6f6d5;">✅ Approved! +20% progress</div>` : ''}
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

    window.submitWorkForProject = function(projectId, freelancerEmail, clientEmail) {
        const milestone = document.getElementById(`milestone-${projectId}`).value.trim();
        const fileUrl = document.getElementById(`fileUrl-${projectId}`).value.trim();
        const description = document.getElementById(`workDesc-${projectId}`).value.trim();
        
        if (!milestone || !description) {
            alert("Please fill milestone name and work description!");
            return;
        }
        
        submitWork(projectId, freelancerEmail, milestone, description, fileUrl || "work_sample.pdf");
        alert("Work submitted! Waiting for client approval. Each approval adds 20% to project progress.");
        
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
            
            let projects = getProjects();
            const projectIndex = projects.findIndex(p => p.id === projectId);
            if (projectIndex !== -1) {
                projects[projectIndex].status = 'hired';
                saveProjects(projects);
            }
            
            let hired = getHired();
            hired.push({
                projectId: projectId,
                freelancerEmail: freelancerEmail,
                progress: 0,
                hiredAt: Date.now()
            });
            saveHired(hired);
            
            alert("Project accepted! You can now submit work for approval. Each approved submission adds 20% progress.");
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

    window.handleClientLogin = function() {
        const name = document.getElementById("clientName").value.trim();
        const email = document.getElementById("clientEmail").value.trim().toLowerCase();
        if (!name || !email) return alert("Please fill all fields");
        
        const existing = findUser(email);
        if (existing && existing.role === "client") {
            setSession(email, "client");
            renderClientDashboard(email);
        } else if (existing && existing.role !== "client") {
            alert("Email registered as freelancer");
        } else {
            const users = getUsers();
            users.push({ email, name, role: "client", registered: true });
            saveUsers(users);
            setSession(email, "client");
            renderClientDashboard(email);
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

    window.completeRegistration = function(email) {
        const name = document.getElementById("regName").value.trim();
        const category = document.getElementById("regCategory").value.trim();
        const phone = document.getElementById("regPhone").value.trim();
        const image = document.getElementById("regImage").value.trim();
        const experience = document.getElementById("regExperience").value.trim();
        
        if (!name || !category || !phone || !image || !experience) {
            return alert("Please fill all fields");
        }
        
        const users = getUsers();
        users.push({ email, name, category, phone, image, pastExperience: experience, role: "freelancer", registered: true });
        saveUsers(users);
        setSession(email, "freelancer");
        renderFreelancerDashboard(email);
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