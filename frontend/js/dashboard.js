window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (token) {
    localStorage.setItem("token", token);
  }

  const savedToken = localStorage.getItem("token");

  if (!savedToken) {
    window.location.href = "login.html"; // सुरक्षा
  }
};