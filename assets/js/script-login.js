document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginButton = document.getElementById("login");
  const loginText = document.getElementById("login-text");
  const loginLoader = document.getElementById("login-loader");
  const errorMessage = document.getElementById("error-message");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  
  usernameInput.value = "demo_user";
  passwordInput.value = "password123";
  
  loginForm.addEventListener("submit", handleLogin);
  
  usernameInput.addEventListener("input", clearError);
  passwordInput.addEventListener("input", clearError);
  
  usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      passwordInput.focus();
    }
  });
  
  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin(e);
    }
  });
  
  function clearError() {
    errorMessage.style.display = "none";
    errorMessage.textContent = "";
  }
  
  async function handleLogin(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username || !password) {
      showError("Please fill in all fields");
      return;
    }
    
    if (username.length < 3) {
      showError("Username must be at least 3 characters");
      return;
    }
    
    if (password.length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    clearError();
    
    try {
      const response = await fetch("https://tarmeezacademy.com/api/v1/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ 
          username: username, 
          password: password 
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        
        showModal("Login Successful!", true, "Welcome back to SocialVibe!");
        
        setTimeout(() => {
          window.location.href = "index.html";
        }, 2000);
      } else {
        let errorMsg = data.message || "Login failed";
        
        if (response.status === 401) {
          errorMsg = "Invalid username or password";
        } else if (response.status === 422) {
          errorMsg = "Please check your input and try again";
        } else if (response.status === 500) {
          errorMsg = "Server error. Please try again later";
        }
        
        showError(errorMsg);
        showModal("Login Failed", false, errorMsg);
      }
    } catch (error) {
      console.error("Login error:", error);
      showError("Network error. Please check your connection.");
      showModal("Connection Error", false, "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
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
      loginButton.disabled = true;
      loginText.style.display = "none";
      loginLoader.style.display = "flex";
    } else {
      loginButton.disabled = false;
      loginText.style.display = "inline";
      loginLoader.style.display = "none";
    }
  }
  
  function showModal(title, success, message) {
    const existingModal = document.querySelector(".modal-overlay");
    if (existingModal) existingModal.remove();
    
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";
    
    const modalBox = document.createElement("div");
    modalBox.className = `modal-box ${success ? "success" : "error"}`;
    
    const icon = success ? "✅" : "❌";
    
    modalBox.innerHTML = `
      <h2>${icon}</h2>
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
  
  async function testAPIConnection() {
    try {
      await fetch("https://tarmeezacademy.com/api/v1/posts?limit=1");
      console.log("API connection test: OK");
    } catch (error) {
      console.warn("API connection test failed. The app may not work properly.");
    }
  }
  
  testAPIConnection();
});