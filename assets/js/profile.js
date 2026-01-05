const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser) location.href = "login.html";

async function initProfile() {
    document.getElementById("profileImage").src = currentUser.profile_image || "assets/images/error.jpeg";
    document.getElementById("username").textContent = "@" + currentUser.username;
    document.getElementById("name").textContent = currentUser.name;

    try {
        const res = await fetch(`https://tarmeezacademy.com/api/v1/users/${currentUser.id}/posts`);
        const data = await res.json();
        const posts = data.data;
        document.getElementById("postsCount").textContent = posts.length;
        renderProfilePosts(posts);
    } catch (e) { console.log("Error loading profile"); }
}

function renderProfilePosts(posts) {
    const container = document.getElementById("profilePosts");
    container.innerHTML = posts.map(p => `
        <div class="post-card-profile">
            <p>${p.body || ""}</p>
            ${p.image ? `<img src="${p.image}">` : ""}
        </div>
    `).join('');
}

document.getElementById("darkModeToggle").onclick = () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode") ? "enabled" : "disabled");
};

initProfile();