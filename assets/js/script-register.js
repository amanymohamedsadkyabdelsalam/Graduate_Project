document.addEventListener("DOMContentLoaded", () => {

  const signupForm = document.getElementById("signupForm");
  const signupBtn = document.getElementById("signUp");
  const signupText = document.getElementById("signup-text");
  const signupLoader = document.getElementById("signup-loader");
  const errorMessage = document.getElementById("error-message");
  
  const fullNameInput = document.getElementById("full-name");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const profileImageInput = document.getElementById("profile-Image");
  const profilePreview = document.getElementById("profile-preview");
  const imagePlaceholder = document.querySelector(".image-placeholder");
  const fileInfo = document.querySelector(".file-info");
  const termsCheckbox = document.getElementById("terms");
  
  const strengthFill = document.getElementById("strength-fill");
  const strengthText = document.getElementById("strength-text");
  const passwordRules = document.querySelectorAll("#password-rules li");
  const passwordMatch = document.getElementById("password-match");
  
  init();
  
  function init() {
    setupEventListeners();
    setupPasswordStrength();
    setupImageUpload();
  }
  
  function setupEventListeners() {
    signupForm.addEventListener("submit", handleSignup);
    
    fullNameInput.addEventListener("input", clearError);
    usernameInput.addEventListener("input", clearError);
    emailInput.addEventListener("input", clearError);
    passwordInput.addEventListener("input", validatePassword);
    confirmPasswordInput.addEventListener("input", validatePasswordMatch);
    
    const inputs = signupForm.querySelectorAll("input");
    inputs.forEach((input, index) => {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (index < inputs.length - 1) {
            inputs[index + 1].focus();
          } else {
            handleSignup(e);
          }
        }
      });
    });
  }
  
  function setupPasswordStrength() {
    passwordInput.addEventListener("input", updatePasswordStrength);
    confirmPasswordInput.addEventListener("input", validatePasswordMatch);
  }
  
  function setupImageUpload() {
    profileImageInput.addEventListener("change", handleImageUpload);
  }
  
  function clearError() {
    errorMessage.style.display = "none";
    errorMessage.textContent = "";
  }
  
  function updatePasswordStrength() {
    const password = passwordInput.value;
    
    const rules = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    passwordRules.forEach(rule => {
      const ruleType = rule.dataset.rule;
      if (rules[ruleType]) {
        rule.classList.add("valid");
      } else {
        rule.classList.remove("valid");
      }
    });
    
    let score = Object.values(rules).filter(Boolean).length;
    
    const percentage = (score / 4) * 100;
    strengthFill.style.width = `${percentage}%`;
    
    let color, text;
    if (score === 0) {
      color = "#ff5757";
      text = "Very Weak";
    } else if (score === 1) {
      color = "#ff8c00";
      text = "Weak";
    } else if (score === 2) {
      color = "#ffcc00";
      text = "Fair";
    } else if (score === 3) {
      color = "#66cc66";
      text = "Good";
    } else {
      color = "#45bd62";
      text = "Strong";
    }
    
    strengthFill.style.background = color;
    strengthText.textContent = `Password Strength: ${text}`;
    
    validatePasswordMatch();
  }
  
  function validatePassword() {
    const password = passwordInput.value;
    
    if (password.length > 0 && password.length < 6) {
      showError("Password must be at least 6 characters long");
      return false;
    }
    
    return true;
  }
  
  function validatePasswordMatch() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword.length === 0) {
      passwordMatch.textContent = "";
      passwordMatch.className = "password-match";
      return false;
    }
    
    if (password === confirmPassword && password.length > 0) {
      passwordMatch.textContent = "✓ Passwords match";
      passwordMatch.className = "password-match match";
      return true;
    } else {
      passwordMatch.textContent = "✗ Passwords do not match";
      passwordMatch.className = "password-match mismatch";
      return false;
    }
  }
  
  function handleImageUpload(event) {
    const file = event.target.files[0];
    
    if (!file) {
      resetImagePreview();
      return;
    }
    
    if (!file.type.startsWith("image/")) {
      showError("Please select an image file");
      resetImagePreview();
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      showError("Image size should be less than 5MB");
      resetImagePreview();
      return;
    }
    
    fileInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)}KB)`;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      profilePreview.src = e.target.result;
      profilePreview.style.display = "block";
      imagePlaceholder.style.display = "none";
    };
    reader.readAsDataURL(file);
  }
  
  function resetImagePreview() {
    profilePreview.src = "";
    profilePreview.style.display = "none";
    imagePlaceholder.style.display = "flex";
    profileImageInput.value = "";
    fileInfo.textContent = "";
  }
  
  async function handleSignup(e) {
    e.preventDefault();
    
    const fullName = fullNameInput.value.trim();
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (!fullName || !username || !email || !password || !confirmPassword) {
      showError("Please fill in all required fields");
      return;
    }
    
    if (fullName.length < 2) {
      showError("Full name must be at least 2 characters");
      return;
    }
    
    if (username.length < 3) {
      showError("Username must be at least 3 characters");
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      showError("Username can only contain letters, numbers, and underscores");
      return;
    }
    
    if (!validateEmail(email)) {
      showError("Please enter a valid email address");
      return;
    }
    
    if (!validatePassword()) {
      return;
    }
    
    if (!validatePasswordMatch()) {
      showError("Passwords do not match");
      return;
    }
    
    if (!termsCheckbox.checked) {
      showError("You must agree to the terms and conditions");
      return;
    }
    
    setLoading(true);
    clearError();
    
    try {
      const formData = new FormData();
      formData.append("name", fullName);
      formData.append("username", username);
      formData.append("password", password);
      formData.append("email", email);
    
      if (profileImageInput.files[0]) {
        formData.append("image", profileImageInput.files[0]);
      }
      
      const response = await fetch("https://tarmeezacademy.com/api/v1/register", {
        method: "POST",
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {

        localStorage.setItem("token", data.token);
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        
        showModal("Success!", true, `Welcome to SocialVibe, ${data.user.name}! Your account has been created successfully.`);
        
            setTimeout(() => {
          window.location.href = "index.html";
        }, 3000);
        
      } else {
        let errorMsg = data.message || "Registration failed";
        
        if (response.status === 422) {
          if (data.errors) {
            const errorMessages = Object.values(data.errors).flat();
            errorMsg = errorMessages.join(", ");
          }
        } else if (response.status === 409) {
          errorMsg = "Username or email already exists";
        }
        
        showError(errorMsg);
        showModal("Registration Failed", false, errorMsg);
      }
    } catch (error) {
      console.error("Signup error:", error);
      showError("Network error. Please check your connection.");
      showModal("Connection Error", false, "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }
  
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    errorMessage.classList.add("show");
    
    errorMessage.style.animation = "none";
    setTimeout(() => {
      errorMessage.style.animation = "slideFade 0.5s ease";
    }, 10);
  }
  
  function setLoading(isLoading) {
    if (isLoading) {
      signupBtn.disabled = true;
      signupText.style.display = "none";
      signupLoader.style.display = "flex";
    } else {
      signupBtn.disabled = false;
      signupText.style.display = "inline";
      signupLoader.style.display = "none";
    }
  }
  
  function showModal(title, success, message) {

    const existingModal = document.querySelector(".modal-overlay");
    if (existingModal) existingModal.remove();
    
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";
    
    const modalBox = document.createElement("div");
    modalBox.className = `modal-box ${success ? "success success-animation" : "error"}`;
    
    const icon = success ? "🎉" : "❌";
    
    modalBox.innerHTML = `
      <h2 style="font-size: 48px; margin-bottom: 15px;">${icon}</h2>
      <h3 style="margin-bottom: 10px;">${title}</h3>
      <p>${message}</p>
      <div style="margin-top: 20px;">
        <small>${success ? "Redirecting to home page..." : "Click outside to close"}</small>
      </div>
    `;
    
    modalOverlay.appendChild(modalBox);
    document.getElementById("modal-container").appendChild(modalOverlay);
    
    if (!success) {
      setTimeout(() => {
        modalOverlay.style.opacity = "0";
        setTimeout(() => {
          if (modalOverlay.parentNode) {
            modalOverlay.parentNode.removeChild(modalOverlay);
          }
        }, 300);
      }, 3000);
      
      modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
          modalOverlay.style.opacity = "0";
          setTimeout(() => {
            if (modalOverlay.parentNode) {
              modalOverlay.parentNode.removeChild(modalOverlay);
            }
          }, 300);
        }
      });
    }
  }
  
  window.handleImageUpload = handleImageUpload;
});