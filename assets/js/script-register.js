// assets/js/script-register.js

const password = document.getElementById("password");
const fill = document.getElementById("strength-fill");
const signupBtn = document.getElementById("signUp");
const fullName = document.getElementById("full-name");
const username = document.getElementById("username");
const email = document.getElementById("email");
const profileImageInput = document.getElementById("profile-Image");

password.addEventListener("input", () => {
  const val = password.value;
  let score = 0;

  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[a-z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  if (score <= 2) {
    fill.style.width = "33%";
    fill.style.background = "red";
  } else if (score === 3 || score === 4) {
    fill.style.width = "66%";
    fill.style.background = "orange";
  } else if (score === 5) {
    fill.style.width = "100%";
    fill.style.background = "green";
  }
});

function handleImageUpload(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("assets/images/error.jpeg");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

signupBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const file = profileImageInput.files[0];
  let profileImageData = "assets/images/error.jpeg";

  if (file) {
    try {
      profileImageData = await handleImageUpload(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Could not upload image. Using default profile picture.");
    }
  }

  const userData = {
    fullName: fullName.value.trim(),
    username: username.value.trim(),
    email: email.value.trim(),
    password: password.value,
    profileImage: profileImageData,
    createdAt: new Date().toISOString(),
    id: Date.now(),
  };

  if (
    !userData.fullName ||
    !userData.username ||
    !userData.email ||
    !userData.password
  ) {
    alert("Please fill in all required fields!");
    return;
  }

  if (userData.username.length < 3) {
    alert("Username must be at least 3 characters!");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userData.email)) {
    alert("Please enter a valid email address!");
    return;
  }

  if (userData.password.length < 8) {
    alert("Password must be at least 8 characters!");
    return;
  }

  let users = JSON.parse(localStorage.getItem("users")) || [];

  const usernameExists = users.some(
    (user) => user.username === userData.username
  );
  if (usernameExists) {
    alert("Username already exists! Please choose another one.");
    return;
  }

  const emailExists = users.some((user) => user.email === userData.email);
  if (emailExists) {
    alert("Email already registered! Please use another email.");
    return;
  }

  users.push(userData);
  localStorage.setItem("users", JSON.stringify(users));

  alert("Account created successfully! You can now login.");
  window.location.href = "login.html";
});
