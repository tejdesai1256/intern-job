const socket = io("http://localhost:5000");

// AUTH CHECK
(function () {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Login required");
    window.location.href = "login.html";
  }
})();

// GET USER
const user = JSON.parse(localStorage.getItem("currentUser")) || {
  name: "Guest",
  role: "intern"
};

// UI SETUP
document.getElementById("userName").innerText = user.name;
document.getElementById("userRole").innerText = user.role;
document.getElementById("avatar").innerText = user.name[0];
document.getElementById("welcomeText").innerText = "Welcome " + user.name;

// ROLE BASED UI
if (user.role === "admin") {
  document.getElementById("adminMenu").style.display = "block";
}

// NAVIGATION
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// LOGOUT
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// ===== CHAT SYSTEM =====
const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("message");

let chats = JSON.parse(localStorage.getItem("chats")) || [
  {
    id: 1,
    name: "General",
    type: "channel",
    members: [user.name, "Admin"],
    messages: [
      { id: 1, author: "Admin", text: "Welcome to the general channel!", timestamp: new Date(Date.now() - 3600000) },
      { id: 2, author: user.name, text: "Thanks!", timestamp: new Date(Date.now() - 1800000) }
    ],
    lastMessage: "Thanks!",
    lastMessageTime: new Date(Date.now() - 1800000),
    unread: 0
  }
];

let currentChat = chats[0];

socket.emit("join", { username: user.name, channel: "general" });

socket.on("message", (data) => {
  const msg = {
    id: Date.now(),
    author: data.user,
    text: data.text,
    timestamp: new Date()
  };

  if (currentChat) {
    currentChat.messages = currentChat.messages || [];
    currentChat.messages.push(msg);
  }

  renderMessages();
});

function openNewChatModal() {
  document.getElementById("chatModal").classList.add("active");
}

function closeNewChatModal() {
  document.getElementById("chatModal").classList.remove("active");
  document.getElementById("newChatName").value = "";
  document.getElementById("newChatType").value = "group";
  document.getElementById("newChatMembers").value = "";
}

function createNewChat(event) {
  event.preventDefault();

  const newChat = {
    id: Date.now(),
    name: document.getElementById("newChatName").value,
    type: document.getElementById("newChatType").value,
    members: [user.name, ...document.getElementById("newChatMembers").value.split(",").map(m => m.trim()).filter(m => m)],
    messages: [],
    lastMessage: "",
    lastMessageTime: new Date(),
    unread: 0
  };

  chats.push(newChat);
  localStorage.setItem("chats", JSON.stringify(chats));
  renderChatsList();
  selectChat(newChat.id);
  closeNewChatModal();
  socket.emit("chatCreated", newChat);
}

function renderChatsList() {
  const chatsList = document.getElementById("chatsList");
  chatsList.innerHTML = chats.map(chat => `
    <div class="chat-item ${currentChat?.id === chat.id ? 'active' : ''}" onclick="selectChat(${chat.id})">
      <div class="chat-item-avatar">${chat.name[0]}</div>
      <div class="chat-item-content">
        <div class="chat-item-name">${chat.name}</div>
        <div class="chat-item-preview">${chat.lastMessage || 'No messages yet'}</div>
      </div>
      ${chat.unread > 0 ? `<div class="chat-item-unread"></div>` : ''}
    </div>
  `).join('');
}

function selectChat(chatId) {
  currentChat = chats.find(c => c.id === chatId);
  if (!currentChat) return;

  currentChat.unread = 0;
  localStorage.setItem("chats", JSON.stringify(chats));

  document.getElementById("chatChannelName").innerText = currentChat.name;
  document.getElementById("chatChannelInfo").innerText = `${currentChat.members.length} members`;

  renderChatsList();
  renderMessages();
  messageInput.focus();
}

function renderMessages() {
  chatBox.innerHTML = (currentChat?.messages || []).map(msg => `
    <div class="msg ${msg.author === user.name ? 'own' : ''}">
      ${msg.author !== user.name ? `<div class="msg-avatar">${msg.author[0]}</div>` : ''}
      <div class="msg-bubble">
        ${msg.author !== user.name ? `<div class="msg-author">${msg.author}</div>` : ''}
        <div class="msg-text">${msg.text}</div>
        <div class="msg-info">${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      </div>
      ${msg.author === user.name ? `<div class="msg-avatar">${msg.author[0]}</div>` : ''}
    </div>
  `).join('');

  chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage() {
  const msg = messageInput.value.trim();
  if (!msg || !currentChat) return;

  const message = {
    id: Date.now(),
    author: user.name,
    text: msg,
    timestamp: new Date()
  };

  currentChat.messages = currentChat.messages || [];
  currentChat.messages.push(message);
  currentChat.lastMessage = msg;
  currentChat.lastMessageTime = new Date();

  localStorage.setItem("chats", JSON.stringify(chats));
  renderChatsList();
  renderMessages();
  messageInput.value = "";

  socket.emit("sendMessage", { text: msg, chat: currentChat.name });
}

function filterChats() {
  const searchTerm = document.getElementById("chatSearch").value.toLowerCase();
  const chatItems = document.querySelectorAll(".chat-item");

  chatItems.forEach(item => {
    const chatName = item.querySelector(".chat-item-name").innerText.toLowerCase();
    item.style.display = chatName.includes(searchTerm) ? "flex" : "none";
  });
}

function toggleChatInfo() {
  const chatInfo = document.getElementById("chatInfo");
  chatInfo.style.display = chatInfo.style.display === "none" ? "block" : "none";

  if (chatInfo.style.display === "block" && currentChat) {
    document.getElementById("chatInfoContent").innerHTML = `
      <div style="margin-bottom: 15px;">
        <strong>Type:</strong> ${currentChat.type}
      </div>
      <div style="margin-bottom: 15px;">
        <strong>Members:</strong>
        <div style="margin-top: 8px;">
          ${currentChat.members.map(m => `<div style="padding: 4px 8px; background: rgba(255,255,255,0.05); border-radius: 4px; margin-bottom: 4px; font-size: 12px;">${m}</div>`).join('')}
        </div>
      </div>
      <div>
        <strong>Created:</strong> ${new Date(currentChat.lastMessageTime || new Date()).toLocaleDateString()}
      </div>
    `;
  }
}

// Initialize chat
renderChatsList();
renderMessages();

// ===== REPORTS SYSTEM =====
let reportData = JSON.parse(localStorage.getItem("reportData")) || {
  attendance: [
    { date: new Date(Date.now() - 86400000 * 7), status: "present", checkIn: "09:00", checkOut: "17:30" },
    { date: new Date(Date.now() - 86400000 * 6), status: "present", checkIn: "09:15", checkOut: "17:45" },
    { date: new Date(Date.now() - 86400000 * 5), status: "absent", checkIn: null, checkOut: null },
    { date: new Date(Date.now() - 86400000 * 4), status: "present", checkIn: "09:05", checkOut: "17:20" },
    { date: new Date(Date.now() - 86400000 * 3), status: "present", checkIn: "09:00", checkOut: "18:00" },
    { date: new Date(Date.now() - 86400000 * 2), status: "present", checkIn: "09:30", checkOut: "17:15" },
    { date: new Date(Date.now() - 86400000), status: "present", checkIn: "09:00", checkOut: "17:30" }
  ]
};

// Initialize date inputs with defaults (last 30 days)
document.getElementById("reportStartDate").valueAsDate = new Date(Date.now() - 30 * 86400000);
document.getElementById("reportEndDate").valueAsDate = new Date();

function updateReports() {
  renderReportStats();
  renderReportTables();
}

function renderReportStats() {
  // Tasks stats
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length || 1;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(0) : 0;

  document.getElementById("tasksCompleted").innerText = completedTasks;
  document.getElementById("tasksCompletedBar").style.width = completionRate + "%";
  document.getElementById("avgCompletionTime").innerText = "2 days";

  // Attendance stats
  const startDate = new Date(document.getElementById("reportStartDate").value);
  const endDate = new Date(document.getElementById("reportEndDate").value);

  const attendanceInRange = reportData.attendance.filter(a =>
    new Date(a.date) >= startDate && new Date(a.date) <= endDate
  );

  const presentDays = attendanceInRange.filter(a => a.status === 'present').length;
  const attendanceRate = attendanceInRange.length > 0 ? (presentDays / attendanceInRange.length * 100).toFixed(0) : 0;

  document.getElementById("attendanceRate").innerText = attendanceRate + "%";
  document.getElementById("attendanceBar").style.width = attendanceRate + "%";
  document.getElementById("daysPresent").innerText = presentDays;

  // Projects stats
  const activeProj = projects.filter(p => p.status === 'active').length;
  const completedProj = projects.filter(p => p.status === 'completed').length;

  document.getElementById("activeProjects").innerText = activeProj;
  document.getElementById("completedProjects").innerText = completedProj;

  // Productivity score
  const productivity = (completionRate * 0.5 + attendanceRate * 0.5).toFixed(0);
  document.getElementById("productivityScore").innerText = productivity + "%";
  document.getElementById("productivityBar").style.width = productivity + "%";
  document.getElementById("performanceTrend").innerText = productivity > 75 ? "📈 +5%" : "📉 -3%";
}

function renderReportTables() {
  // Tasks Report
  const tasksTable = document.getElementById("tasksReportTable");
  tasksTable.innerHTML = tasks.filter(t => t.status === 'completed').map(task => `
    <tr>
      <td>${task.title}</td>
      <td><span class="status-badge completed">${task.status}</span></td>
      <td><span class="status-badge">${task.priority}</span></td>
      <td>${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</td>
      <td>2 hours</td>
    </tr>
  `).join('');

  if (tasksTable.innerHTML === '') {
    tasksTable.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #aaa;">No completed tasks</td></tr>';
  }

  // Projects Report
  const projectsTable = document.getElementById("projectsReportTable");
  projectsTable.innerHTML = projects.map(project => `
    <tr>
      <td>${project.name}</td>
      <td><span class="status-badge ${project.status}">${project.status}</span></td>
      <td>
        <div class="progress-cell">
          <div class="progress-cell-bar">
            <div class="progress-cell-fill" style="width: ${project.progress}%"></div>
          </div>
          <span class="progress-cell-text">${project.progress}%</span>
        </div>
      </td>
      <td>${project.lead || 'N/A'}</td>
      <td>${project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</td>
    </tr>
  `).join('');

  if (projectsTable.innerHTML === '') {
    projectsTable.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #aaa;">No projects</td></tr>';
  }

  // Attendance Report
  const attendanceTable = document.getElementById("attendanceReportTable");
  const startDate = new Date(document.getElementById("reportStartDate").value);
  const endDate = new Date(document.getElementById("reportEndDate").value);

  const attendanceInRange = reportData.attendance.filter(a =>
    new Date(a.date) >= startDate && new Date(a.date) <= endDate
  );

  attendanceTable.innerHTML = attendanceInRange.map(record => {
    const hoursWorked = record.status === 'present' && record.checkIn && record.checkOut
      ? `${(Math.random() * 6 + 7).toFixed(1)}h`
      : 'N/A';

    return `
      <tr>
        <td>${new Date(record.date).toLocaleDateString()}</td>
        <td><span class="status-badge ${record.status}">${record.status}</span></td>
        <td>${record.checkIn || '-'}</td>
        <td>${record.checkOut || '-'}</td>
        <td>${hoursWorked}</td>
      </tr>
    `;
  }).join('');

  if (attendanceTable.innerHTML === '') {
    attendanceTable.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #aaa;">No attendance records</td></tr>';
  }
}

function showReportTab(tabName) {
  document.querySelectorAll(".report-tab").forEach(tab => tab.classList.remove("active"));
  document.querySelectorAll(".report-tab-btn").forEach(btn => btn.classList.remove("active"));

  document.getElementById(tabName).classList.add("active");
  event.target.classList.add("active");
}

function exportReport() {
  const startDate = document.getElementById("reportStartDate").value;
  const endDate = document.getElementById("reportEndDate").value;

  const reportContent = `
JOBJOCKEY PERFORMANCE REPORT
Generated: ${new Date().toLocaleString()}
Period: ${startDate} to ${endDate}

===== SUMMARY =====
Tasks Completed: ${document.getElementById("tasksCompleted").innerText}
Attendance Rate: ${document.getElementById("attendanceRate").innerText}
Active Projects: ${document.getElementById("activeProjects").innerText}
Productivity Score: ${document.getElementById("productivityScore").innerText}

===== TASKS =====
${tasks.map(t => `- ${t.title} (${t.status})`).join('\n')}

===== PROJECTS =====
${projects.map(p => `- ${p.name} (${p.status}, ${p.progress}%)`).join('\n')}

===== ATTENDANCE =====
${reportData.attendance.map(a => `- ${new Date(a.date).toLocaleDateString()}: ${a.status}`).join('\n')}
  `;

  const blob = new Blob([reportContent], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report-${startDate}-to-${endDate}.txt`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Initialize reports
updateReports();

// ===== TASKS MANAGEMENT =====
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

// Initialize tasks on page load
(function initTasks() {
  renderTasks();
})();

function openNewTaskModal() {
  document.getElementById("taskModal").classList.add("active");
}

function closeNewTaskModal() {
  document.getElementById("taskModal").classList.remove("active");
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDesc").value = "";
  document.getElementById("taskPriority").value = "medium";
  document.getElementById("taskDueDate").value = "";
}

function createTask(event) {
  event.preventDefault();

  const task = {
    id: Date.now(),
    title: document.getElementById("taskTitle").value,
    description: document.getElementById("taskDesc").value,
    priority: document.getElementById("taskPriority").value,
    dueDate: document.getElementById("taskDueDate").value,
    status: "pending",
    createdAt: new Date().toISOString(),
    userId: user.name
  };

  tasks.push(task);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
  closeNewTaskModal();

  // Notify other users via socket
  socket.emit("taskCreated", task);
}

function filterTasks(filter) {
  currentFilter = filter;
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.remove("active");
  });
  event.target.classList.add("active");
  renderTasks();
}

function renderTasks() {
  const tasksList = document.getElementById("tasksList");
  let filteredTasks = tasks;

  if (currentFilter !== "all") {
    filteredTasks = tasks.filter(t => t.status === currentFilter);
  }

  if (filteredTasks.length === 0) {
    tasksList.innerHTML = `<div style="text-align: center; padding: 40px; color: #aaa;">
      No tasks found. <a onclick="openNewTaskModal()" style="color: #6366f1; cursor: pointer;">Create one</a>
    </div>`;
    return;
  }

  tasksList.innerHTML = filteredTasks.map(task => `
    <div class="task-item">
      <input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''}
        onchange="toggleTaskStatus(${task.id})">
      <div class="task-content">
        <div class="task-title" style="${task.status === 'completed' ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
          ${task.title}
        </div>
        ${task.description ? `<div class="task-desc">${task.description}</div>` : ''}
        <div class="task-meta">
          <span class="task-priority priority-${task.priority}">${task.priority.toUpperCase()}</span>
          <span class="task-status status-${task.status}">${task.status}</span>
          ${task.dueDate ? `<span class="task-due">Due: ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-small" onclick="editTask(${task.id})">Edit</button>
        <button class="btn-small" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function toggleTaskStatus(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.status = task.status === 'completed' ? 'pending' : 'completed';
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
    socket.emit("taskUpdated", task);
  }
}

function deleteTask(taskId) {
  if (confirm("Delete this task?")) {
    tasks = tasks.filter(t => t.id !== taskId);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
    socket.emit("taskDeleted", taskId);
  }
}

function editTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    document.getElementById("taskTitle").value = task.title;
    document.getElementById("taskDesc").value = task.description;
    document.getElementById("taskPriority").value = task.priority;
    document.getElementById("taskDueDate").value = task.dueDate;
    openNewTaskModal();

    // TODO: Implement edit mode - for now this just opens as new task
  }
}

// ===== PROJECTS MANAGEMENT =====
let projects = JSON.parse(localStorage.getItem("projects")) || [];
let currentProjectFilter = "all";

// Initialize projects on page load
(function initProjects() {
  renderProjects();
})();

function openNewProjectModal() {
  document.getElementById("projectModal").classList.add("active");
}

function closeNewProjectModal() {
  document.getElementById("projectModal").classList.remove("active");
  document.getElementById("projectName").value = "";
  document.getElementById("projectDesc").value = "";
  document.getElementById("projectLead").value = "";
  document.getElementById("projectStartDate").value = "";
  document.getElementById("projectEndDate").value = "";
  document.getElementById("projectStatus").value = "active";
}

function createProject(event) {
  event.preventDefault();

  const project = {
    id: Date.now(),
    name: document.getElementById("projectName").value,
    description: document.getElementById("projectDesc").value,
    lead: document.getElementById("projectLead").value,
    startDate: document.getElementById("projectStartDate").value,
    endDate: document.getElementById("projectEndDate").value,
    status: document.getElementById("projectStatus").value,
    progress: 0,
    createdAt: new Date().toISOString(),
    createdBy: user.name,
    team: [user.name]
  };

  projects.push(project);
  localStorage.setItem("projects", JSON.stringify(projects));
  renderProjects();
  closeNewProjectModal();

  // Notify other users via socket
  socket.emit("projectCreated", project);
}

function filterProjects(filter) {
  currentProjectFilter = filter;
  document.querySelectorAll(".projects-filters .filter-btn").forEach(btn => {
    btn.classList.remove("active");
  });
  event.target.classList.add("active");
  renderProjects();
}

function renderProjects() {
  const projectsList = document.getElementById("projectsList");
  let filteredProjects = projects;

  if (currentProjectFilter !== "all") {
    filteredProjects = projects.filter(p => p.status === currentProjectFilter);
  }

  if (filteredProjects.length === 0) {
    projectsList.innerHTML = `<div style="text-align: center; padding: 40px; color: #aaa; grid-column: 1 / -1;">
      No projects found. <a onclick="openNewProjectModal()" style="color: #6366f1; cursor: pointer;">Create one</a>
    </div>`;
    return;
  }

  projectsList.innerHTML = filteredProjects.map(project => `
    <div class="project-card">
      <div class="project-header">
        <div class="project-name">${project.name}</div>
        <div class="project-status-badge status-${project.status}">${project.status}</div>
      </div>

      ${project.description ? `<div class="project-description">${project.description}</div>` : ''}

      <div class="project-info">
        <div class="info-item">
          <div class="info-label">Lead</div>
          <div class="info-value">${project.lead || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Team Size</div>
          <div class="info-value">${project.team ? project.team.length : 1}</div>
        </div>
        ${project.startDate ? `
        <div class="info-item">
          <div class="info-label">Start</div>
          <div class="info-value">${new Date(project.startDate).toLocaleDateString()}</div>
        </div>
        ` : ''}
        ${project.endDate ? `
        <div class="info-item">
          <div class="info-label">End</div>
          <div class="info-value">${new Date(project.endDate).toLocaleDateString()}</div>
        </div>
        ` : ''}
      </div>

      <div class="project-progress">
        <div class="progress-label">
          <span>Progress</span>
          <span>${project.progress}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${project.progress}%"></div>
        </div>
      </div>

      <div class="project-team">
        <div class="team-label">Team Members</div>
        <div class="team-avatars">
          ${(project.team || [user.name]).slice(0, 3).map(member =>
            `<div class="mini-avatar" title="${member}">${member[0]}</div>`
          ).join('')}
          ${(project.team || []).length > 3 ? `<div class="mini-avatar">+${(project.team || []).length - 3}</div>` : ''}
        </div>
      </div>

      <div class="project-footer">
        <button class="btn-small" onclick="editProject(${project.id})">Edit</button>
        <button class="btn-small" onclick="deleteProject(${project.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function deleteProject(projectId) {
  if (confirm("Delete this project?")) {
    projects = projects.filter(p => p.id !== projectId);
    localStorage.setItem("projects", JSON.stringify(projects));
    renderProjects();
    socket.emit("projectDeleted", projectId);
  }
}

function editProject(projectId) {
  const project = projects.find(p => p.id === projectId);
  if (project) {
    document.getElementById("projectName").value = project.name;
    document.getElementById("projectDesc").value = project.description;
    document.getElementById("projectLead").value = project.lead;
    document.getElementById("projectStartDate").value = project.startDate;
    document.getElementById("projectEndDate").value = project.endDate;
    document.getElementById("projectStatus").value = project.status;
    openNewProjectModal();

    // TODO: Implement edit mode
  }
}