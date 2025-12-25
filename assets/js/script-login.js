// assets/js/script-login.js

document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ Script loaded successfully!");

  const loginBtn = document.getElementById("login");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  if (!loginBtn || !usernameInput || !passwordInput) {
    console.error("❌ Error: Login elements not found!");
    alert("⚠️ Page elements missing! Please refresh the page.");
    return;
  }

  console.log("✅ All elements found!");

  function showModal(message, isSuccess) {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";

    const modalBox = document.createElement("div");
    modalBox.className = "modal-box";

    const icon = document.createElement("div");
    icon.className = isSuccess ? "modal-icon success" : "modal-icon error";
    icon.innerHTML = isSuccess ? "✅" : "❌";

    const text = document.createElement("h2");
    text.className = isSuccess ? "modal-title success" : "modal-title error";
    text.innerHTML = isSuccess ? "Login Succeeded!" : "Login Failed!";

    const description = document.createElement("p");
    description.className = "modal-description";
    description.innerHTML = message;

    modalBox.appendChild(icon);
    modalBox.appendChild(text);
    modalBox.appendChild(description);
    modal.appendChild(modalBox);
    document.body.appendChild(modal);

    setTimeout(() => {
      modal.classList.add("fade-out");
      setTimeout(() => {
        modal.remove();
        if (isSuccess) {
          window.location.href = "index.html";
        }
      }, 300);
    }, 2000);
  }

  loginBtn.addEventListener("click", function (e) {
    e.preventDefault();
    console.log("🔘 Login button clicked!");

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    console.log("Username entered:", username);
    console.log("Password entered:", password ? "******" : "(empty)");

    if (!username || !password) {
      console.log("⚠️ Empty fields detected!");
      showModal("Please enter both username and password!", false);
      return;
    }

    if (username.length < 3) {
      console.log("⚠️ Username too short!");
      showModal("Username must be at least 3 characters!", false);
      return;
    }

    console.log("🔍 Checking users...");

    let users = [];
    try {
      const storedUsers = localStorage.getItem("users");
      console.log("Raw localStorage data:", storedUsers);

      if (storedUsers) {
        users = JSON.parse(storedUsers);
        console.log("✅ Users found:", users.length);
        console.log("Users list:", users);
      } else {
        console.log("❌ No users found!");
        showModal("No registered users found! Please sign up first.", false);
        return;
      }
    } catch (error) {
      console.error("❌ Error reading localStorage:", error);
      showModal("Error reading user data! Please try again.", false);
      return;
    }

    console.log("🔍 Searching for user...");
    const user = users.find((u) => {
      const usernameMatch = u.username === username;
      const passwordMatch = u.password === password;
      console.log(
        `Checking user: ${u.username} - Username match: ${usernameMatch}, Password match: ${passwordMatch}`
      );
      return usernameMatch && passwordMatch;
    });

    if (!user) {
      console.log("❌ User not found or password incorrect!");
      showModal("Incorrect username or password!", false);
      usernameInput.value = "";
      passwordInput.value = "";
      usernameInput.focus();
      return;
    }

    console.log("✅ Login successful! ", user);

    const currentUser = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      profileImage: user.profileImage || "assets/images/error.jpeg",
      loginTime: new Date().toISOString(),
    };

    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    console.log("✅ Current user saved:", currentUser);

    showModal("Welcome back, " + user.fullName + "!", true);
  });

  passwordInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      console.log("⏎ Enter pressed in password field");
      loginBtn.click();
    }
  });

  usernameInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      console.log("⏎ Enter pressed in username field");
      loginBtn.click();
    }
  });

  console.log("✅ Event listeners attached successfully!");
});

function testLocalStorage() {
  console.log("=== LocalStorage Test ===");
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  console.log("Total users:", users.length);
  console.table(users);
  console.log("Current user:", localStorage.getItem("currentUser"));
}
