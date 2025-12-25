// /assets/js/script1.js
const password = document.getElementById("password");
const fill = document.getElementById("strength-fill");
const signup = document.getElementById("signUp");

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
    submit.disabled = true;
  } else if (score === 3 || score === 4) {
    fill.style.width = "66%";
    fill.style.background = "orange";
    submit.disabled = false;
  } else if (score === 5) {
    fill.style.width = "100%";
    fill.style.background = "green";
    submit.disabled = false;
  }
});