const socket = io("http://localhost:5000");

let currentChannel = "general";

// USER DATA
const username = localStorage.getItem("userName") || "User";
document.getElementById("userName").innerText = username;
document.getElementById("avatar").innerText = username[0].toUpperCase();

// DOM
const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("message");

// AUTH CHECK
(function () {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Login required");
    window.location.href = "login.html";
  }
})();

// JOIN CHANNEL
socket.emit("join", { username, channel: currentChannel });

// RECEIVE MESSAGE
socket.on("message", (data) => {
  chatBox.innerHTML += `
    <div class="msg">
      <div class="top">${data.user} • ${data.time}</div>
      <div class="text">${data.text}</div>
    </div>
  `;
  chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
});

// SEND MESSAGE
function sendMessage() {
  const msg = messageInput.value.trim();
  if (!msg) return;

  socket.emit("sendMessage", msg);
  messageInput.value = "";
}

// ENTER KEY
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// SWITCH CHANNEL
function switchChannel(channel) {
  currentChannel = channel;

  document.getElementById("channelName").innerText = "# " + channel;
  chatBox.innerHTML = "";

  document.querySelectorAll(".channel").forEach(c => c.classList.remove("active"));
  event.target.classList.add("active");

  socket.emit("join", { username, channel });
}

// LOGOUT
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}