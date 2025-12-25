// /assets/js/profile.js
const user = JSON.parse(localStorage.getItem("currentUser"));
const toggleButton = document.getElementById("darkModeToggle");
const body = document.body;
if (!user) window.location.href = "sign.html";

let allPosts = [];
let userPosts = [];
let likedPosts = [];

async function fetchData() {
  const res = await fetch("https://tarmeezacademy.com/api/v1/posts?limit=50");
  const data = await res.json();
  allPosts = data.data;
}

async function initProfile() {
  await fetchData();
  userPosts = allPosts.filter(post => post.author.id === user.id);
  const likes = JSON.parse(localStorage.getItem("likes")) || {};
  likedPosts = allPosts.filter(post => likes[post.id]?.users?.includes(user.id));
  document.getElementById("postsCount").textContent = userPosts.length;
  renderPostsTab();
}

function renderPostsTab() {
  renderPosts(userPosts);
}

function renderMediaTab() {
  renderPosts(userPosts.filter(p => p.image), true);
}

function renderLikesTab() {
  renderPosts(likedPosts);
}

function renderPosts(posts, mediaOnly = false) {
  const container = document.getElementById("profilePosts");
  container.innerHTML = "";
  container.className = mediaOnly ? "media-grid" : "";

  if (posts.length === 0) {
    container.innerHTML = `<p class="empty">${mediaOnly ? "No media posts" : "No posts yet"}</p>`;
    return;
  }

  posts.forEach(post => {
    if (mediaOnly) {
      const img = document.createElement("img");
      img.src = post.image;
      img.className = "media-img";
      container.appendChild(img);
    } else {
      const div = document.createElement("div");
      div.className = "post-card-profile";
      div.innerHTML = `
        <p class="post-text">${post.title ?? ""}</p>
        ${post.image ? `<img src="${post.image}">` : ""}
        <button class="like-btn" data-id="${post.id}">❤️ ${post.likes?.length || 0}</button>
      `;
      container.appendChild(div);
    }
  });

  document.querySelectorAll(".like-btn").forEach(btn => {
    const likes = JSON.parse(localStorage.getItem("likes")) || {};
    const postId = btn.dataset.id;
    if (likes[postId]?.users?.includes(user.id)) btn.classList.add("liked");
    btn.addEventListener("click", () => {
      btn.classList.toggle("liked");
      likes[postId] = likes[postId] || { users: [] };
      if (btn.classList.contains("liked")) likes[postId].users.push(user.id);
      else likes[postId].users = likes[postId].users.filter(id => id !== user.id);
      localStorage.setItem("likes", JSON.stringify(likes));
    });
  });
}

document.getElementById("profileImage").src = user.profileImage || "assets/images/error.jpeg";
document.getElementById("username").textContent = user.username;
document.getElementById("name").textContent = user.name || "@demo_user";
document.getElementById("joined").textContent = "Joined in January 2024";

document.querySelector(".pos").onclick = () => { setActiveTab("pos"); renderPostsTab(); };
document.querySelector(".med").onclick = () => { setActiveTab("med"); renderMediaTab(); };
document.querySelector(".lin").onclick = () => { setActiveTab("lin"); renderLikesTab(); };

function setActiveTab(tab) {
  document.querySelectorAll("#nav a").forEach(a => a.classList.remove("active"));
  document.querySelector("." + tab).classList.add("active");
}

if (localStorage.getItem("darkMode") === "enabled") body.classList.add("dark-mode");
toggleButton.addEventListener("click", () => {
  body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", body.classList.contains("dark-mode") ? "enabled" : "disabled");
});

const editBtn = document.getElementById("edit");
const shareBtn = document.getElementById("share");
const editModal = document.getElementById("editModal");
const closeModal = document.querySelector(".close");
const saveBtn = document.getElementById("saveProfile");

editBtn.addEventListener("click", () => {
  editModal.style.display = "block";
  document.getElementById("editUsername").value = user.username;
  document.getElementById("editName").value = user.name || "";
  document.getElementById("editImage").value = user.profileImage || "";
});

closeModal.addEventListener("click", () => { editModal.style.display = "none"; });
window.addEventListener("click", e => { if(e.target == editModal) editModal.style.display = "none"; });

saveBtn.addEventListener("click", () => {
  user.username = document.getElementById("editUsername").value;
  user.name = document.getElementById("editName").value;
  user.profileImage = document.getElementById("editImage").value;
  localStorage.setItem("currentUser", JSON.stringify(user));
  document.getElementById("username").textContent = user.username;
  document.getElementById("name").textContent = user.name;
  document.getElementById("profileImage").src = user.profileImage || "assets/images/error.jpeg";
  editModal.style.display = "none";
});

document.getElementById("profileImage").addEventListener("click", () => {
  const newImage = prompt("Enter new profile image URL:", user.profileImage || "");
  if (newImage) {
    user.profileImage = newImage;
    localStorage.setItem("currentUser", JSON.stringify(user));
    document.getElementById("profileImage").src = user.profileImage;
  }
});

shareBtn.addEventListener("click", () => { alert("Profile link copied to clipboard!"); });

initProfile();