const API = "http://localhost:5000/api/auth";

// 🔐 Toggle Password
function togglePassword() {
  const pass = document.getElementById("password");
  pass.type = pass.type === "password" ? "text" : "password";
}

// 💪 Password Strength
function checkStrength() {
  const pass = document.getElementById("password").value;
  const strength = document.getElementById("strength");

  if (pass.length < 4) strength.innerText = "Weak";
  else if (pass.length < 8) strength.innerText = "Medium";
  else strength.innerText = "Strong";
}

// 📝 REGISTER
async function register() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, email, password, role })
  });

  const data = await res.json();
  alert(data.message);
}

// 🔑 LOGIN
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include"
  });

  const data = await res.json();

  console.log(data);
  alert("Login successful");
}


//google authentiaction
function googleLogin() {
  window.location.href = "http://localhost:5000/api/auth/google";
}

window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (token) {
    localStorage.setItem("token", token);
    alert("Google Login Successful");
  }
};

window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (token) {
    localStorage.setItem("token", token);
    alert("Google Login Successful");
    window.location.href = "dashboard.html"; // next step
  }
};