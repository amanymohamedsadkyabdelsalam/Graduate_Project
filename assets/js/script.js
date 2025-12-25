
const post = document.getElementById("posts");
const loader = document.getElementById("loader");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const toast = document.getElementById("toast");
let currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
let allPosts = [];
let displayedCount = 0;
const postsPerPage = 10;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  toast.classList.remove("hide");
  setTimeout(() => {
    toast.classList.add("hide");
    toast.classList.remove("show");
  }, 2000);
}

function updateHeaderNavigation() {
  const navigation = document.querySelector(".navigation ul");
  if (currentUser) {
    navigation.innerHTML = `
      <li><a href="index.html"><i class="fa-solid fa-house"></i> Home</a></li>
      <li><a href="profile.html"><i class="fa-regular fa-user"></i> Profile</a></li>
      <li><a href="profile.html"><img src="${
        currentUser.profileImage || "assets/images/error.jpeg"
      }" class="myImg" onerror="this.src='assets/images/error.jpeg'"></a></li>
      <li><a href="#" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i> Logout</a></li>
    `;
  } else {
    navigation.innerHTML = `
      <li><a href="index.html"><i class="fa-solid fa-house"></i> Home</a></li>
      <li><a href="login.html"><i class="fa-solid fa-right-to-bracket"></i> Login</a></li>
      <li><a href="sign.html" class="signUp"><i class="fa-solid fa-user-plus"></i> Sign Up</a></li>
    `;
  }
}

function updateCreatePostBox() {
  const createPostBox = document.getElementById("createPostBox");
  const userAvatar = document.getElementById("userAvatar");
  const formUserAvatar = document.getElementById("formUserAvatar");
  const formUsername = document.getElementById("formUsername");

  if (currentUser) {
    userAvatar.src = currentUser.profileImage || "assets/images/error.jpeg";
    formUserAvatar.src = currentUser.profileImage || "assets/images/error.jpeg";
    formUsername.textContent = currentUser.fullName || currentUser.username;
    createPostBox.style.display = "block";
  } else {
    createPostBox.style.display = "none";
  }
}

document.getElementById("darkModeToggle").onclick = () => {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
};

if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark-mode");
}

function openCreatePostForm() {
  if (!currentUser) {
    showToast("Please login to create a post");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
    return;
  }
  document.getElementById("createPostForm").style.display = "block";
  document.getElementById("postContent").focus();
}

function closeCreatePostForm() {
  document.getElementById("createPostForm").style.display = "none";
  document.getElementById("postContent").value = "";
  document.getElementById("postImageInput").value = "";
  document.getElementById("imagePreview").style.display = "none";
}

function previewPostImage() {
  const input = document.getElementById("postImageInput");
  const preview = document.getElementById("imagePreview");
  const previewImage = document.getElementById("previewImage");

  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      previewImage.src = e.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function removeImage() {
  document.getElementById("postImageInput").value = "";
  document.getElementById("imagePreview").style.display = "none";
}

function timeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
}

function createPost() {
  if (!currentUser) {
    showToast("Please login first");
    return;
  }

  const content = document.getElementById("postContent").value.trim();
  const imageInput = document.getElementById("postImageInput");

  if (!content && (!imageInput.files || !imageInput.files[0])) {
    showToast("Please write something or add an image");
    return;
  }

  const newPost = {
    id: Date.now(),
    title: "",
    body: content,
    image: "",
    author: {
      id: currentUser.id,
      name: currentUser.fullName || currentUser.username,
      username: currentUser.username,
      profile_image: currentUser.profileImage || "assets/images/error.jpeg",
    },
    created_at: new Date(),
    comments: [],
    likes: [],
    isUserPost: true,
  };

  if (imageInput.files && imageInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      newPost.image = e.target.result;
      savePost(newPost);
    };
    reader.readAsDataURL(imageInput.files[0]);
  } else {
    savePost(newPost);
  }
}

function savePost(newPost) {
  const userPosts = JSON.parse(localStorage.getItem("userPosts")) || [];
  userPosts.unshift(newPost);
  localStorage.setItem("userPosts", JSON.stringify(userPosts));

  closeCreatePostForm();
  showToast("Post created successfully!");

  post.innerHTML = "";
  displayedCount = 0;
  renderPosts();
}

async function initPosts() {
  loader.style.display = "block";
  try {
    const res = await fetch("https://tarmeezacademy.com/api/v1/posts?limit=50");
    const data = await res.json();
    const savedPosts = JSON.parse(localStorage.getItem("posts")) || [];

    data.data.forEach((p) => {
      const saved = savedPosts.find((sp) => sp.id === p.id);
      p.comments = saved?.comments || [];
      p.likes = saved?.likes || [];
    });

    localStorage.setItem("posts", JSON.stringify(data.data));
    displayedCount = 0;
    post.innerHTML = "";
    renderPosts();
  } catch (error) {
    showToast("Error loading posts");
    console.error("Error:", error);
  }
  loader.style.display = "none";
}

function renderPosts() {
  const savedPosts = JSON.parse(localStorage.getItem("posts")) || [];
  const userPosts = JSON.parse(localStorage.getItem("userPosts")) || [];
  allPosts = [...userPosts, ...savedPosts];

  allPosts.slice(displayedCount, displayedCount + postsPerPage).forEach((p) => {
    const div = document.createElement("div");
    div.className = "post-card";

    const authorImage =
      typeof p.author.profile_image === "string" &&
      p.author.profile_image.trim() !== ""
        ? p.author.profile_image
        : "assets/images/error.jpeg";

    const liked = currentUser ? p.likes.includes(currentUser.id) : false;
    const createdDate = (post.userId !== currentUser.id)
      ? p.created_at
      : timeAgo(p.created_at);

    const commentsHTML = p.comments
      .map((c) => {
        const commentUserImage = currentUser && c.userId === currentUser.id 
          ? (currentUser.profileImage || "assets/images/error.jpeg")
          : "assets/images/error.jpeg";
        
        return `
          <div class="comment-item">
            <img src="${commentUserImage}" alt="${c.username}" class="comment-avatar" onerror="this.src='assets/images/error.jpeg'">
            <div class="comment-content">
              <div class="comment-bubble">
                <div class="comment-author">${c.username}</div>
                <div class="comment-text">${c.text}</div>
              </div>
              ${
                c.userId === currentUser?.id
                  ? `<div class="comment-actions">
                       <span onclick="editComment(${p.id}, ${p.comments.indexOf(c)})">Edit</span>
                       <span onclick="deleteComment(${p.id}, ${p.comments.indexOf(c)})">Delete</span>
                     </div>`
                  : ""
              }
            </div>
          </div>
        `;
      })
      .join("");

    div.innerHTML = `
      <div class="post-header">
        <img src="${authorImage}" alt="${p.author.name}" onerror="this.src='assets/images/error.jpeg'">
        <div class="post-author-info">
          <h3>${p.author.name}</h3>
          <p>@${p.author.username} • ${createdDate}</p>
        </div>
      </div>
      
      <div class="post-content">
        ${p.title ? `<div class="post-title">${p.title}</div>` : ""}
        ${p.body ? `<div class="post-body">${p.body}</div>` : ""}
        ${
          p.image
            ? `<img src="${p.image}" alt="Post image" class="post-image" onerror="this.src='assets/images/error.jpeg'">`
            : ""
        }
      </div>

      <div class="post-actions">
        <button class="action-btn ${liked ? "liked" : ""}" onclick="toggleLike(${p.id})">
          <i class="fa-${liked ? "solid" : "regular"} fa-heart"></i>
          <span id="like-count-${p.id}">${p.likes.length} ${p.likes.length === 1 ? "Like" : "Likes"}</span>
        </button>
        <button class="action-btn" onclick="toggleComments(${p.id})">
          <i class="fa-regular fa-comment"></i>
          <span id="comment-count-${p.id}">${p.comments.length} ${p.comments.length === 1 ? "Comment" : "Comments"}</span>
        </button>
      </div>

      <div class="comments-section" id="comments-${p.id}" style="display: ${p.comments.length > 0 ? "block" : "none"};">
        <div class="comments-list" id="comments-list-${p.id}">
          ${commentsHTML || '<div style="text-align: center; color: #888; padding: 10px;">No comments yet</div>'}
        </div>
        <div class="add-comment">
          <img src="${currentUser ? (currentUser.profileImage || "assets/images/error.jpeg") : "assets/images/error.jpeg"}" alt="You" onerror="this.src='assets/images/error.jpeg'">
          <div class="comment-input-wrapper">
            <input type="text" id="comment-input-${p.id}" placeholder="Write a comment..." onkeypress="handleCommentKeyPress(event, ${p.id})">
            <button class="send-comment-btn" onclick="addComment(${p.id})" id="send-btn-${p.id}" disabled>
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    post.appendChild(div);

    const commentInput = document.getElementById(`comment-input-${p.id}`);
    if (commentInput) {
      commentInput.addEventListener("input", function () {
        const sendBtn = document.getElementById(`send-btn-${p.id}`);
        sendBtn.disabled = !this.value.trim();
      });
    }
  });

  displayedCount += postsPerPage;
  loadMoreBtn.style.display =
    displayedCount < allPosts.length ? "block" : "none";
}

function toggleComments(postId) {
  const commentsSection = document.getElementById(`comments-${postId}`);
  if (commentsSection.style.display === "none") {
    commentsSection.style.display = "block";
  } else {
    commentsSection.style.display = "none";
  }
}

function handleCommentKeyPress(event, postId) {
  if (event.key === "Enter") {
    event.preventDefault();
    addComment(postId);
  }
}

function addComment(postId) {
  if (!currentUser) {
    showToast("Please login to comment");
    return;
  }

  const input = document.getElementById(`comment-input-${postId}`);
  const text = input.value.trim();

  if (!text) {
    showToast("Please write a comment");
    return;
  }

  const userPosts = JSON.parse(localStorage.getItem("userPosts")) || [];
  const savedPosts = JSON.parse(localStorage.getItem("posts")) || [];

  let p = userPosts.find((x) => x.id === postId);
  let isUserPost = true;

  if (!p) {
    p = savedPosts.find((x) => x.id === postId);
    isUserPost = false;
  }

  if (!p) return;

  p.comments.push({
    userId: currentUser.id,
    username: currentUser.username,
    text,
  });

  if (isUserPost) {
    localStorage.setItem("userPosts", JSON.stringify(userPosts));
  } else {
    localStorage.setItem("posts", JSON.stringify(savedPosts));
  }

  input.value = "";
  const sendBtn = document.getElementById(`send-btn-${postId}`);
  if (sendBtn) sendBtn.disabled = true;

  showToast("Comment added!");

  post.innerHTML = "";
  displayedCount = 0;
  renderPosts();
}

function editComment(postId, commentIndex) {
  const userPosts = JSON.parse(localStorage.getItem("userPosts")) || [];
  const savedPosts = JSON.parse(localStorage.getItem("posts")) || [];

  let p = userPosts.find((x) => x.id === postId);
  let isUserPost = true;

  if (!p) {
    p = savedPosts.find((x) => x.id === postId);
    isUserPost = false;
  }

  if (!p) return;

  const newText = prompt("Edit your comment:", p.comments[commentIndex].text);
  if (!newText || newText.trim() === "") return;

  p.comments[commentIndex].text = newText.trim();

  if (isUserPost) {
    localStorage.setItem("userPosts", JSON.stringify(userPosts));
  } else {
    localStorage.setItem("posts", JSON.stringify(savedPosts));
  }

  showToast("Comment updated!");

  post.innerHTML = "";
  displayedCount = 0;
  renderPosts();
}

function deleteComment(postId, commentIndex) {
  if (!confirm("Are you sure you want to delete this comment?")) return;

  const userPosts = JSON.parse(localStorage.getItem("userPosts")) || [];
  const savedPosts = JSON.parse(localStorage.getItem("posts")) || [];

  let p = userPosts.find((x) => x.id === postId);
  let isUserPost = true;

  if (!p) {
    p = savedPosts.find((x) => x.id === postId);
    isUserPost = false;
  }

  if (!p) return;

  p.comments.splice(commentIndex, 1);

  if (isUserPost) {
    localStorage.setItem("userPosts", JSON.stringify(userPosts));
  } else {
    localStorage.setItem("posts", JSON.stringify(savedPosts));
  }

  showToast("Comment deleted!");

  post.innerHTML = "";
  displayedCount = 0;
  renderPosts();
}

function toggleLike(postId) {
  if (!currentUser) {
    showToast("Please login to like posts");
    return;
  }

  const userPosts = JSON.parse(localStorage.getItem("userPosts")) || [];
  const savedPosts = JSON.parse(localStorage.getItem("posts")) || [];

  let currentPost = userPosts.find((x) => x.id === postId);
  let isUserPost = true;

  if (!currentPost) {
    currentPost = savedPosts.find((x) => x.id === postId);
    isUserPost = false;
  }

  if (!currentPost) return;

  const idx = currentPost.likes.indexOf(currentUser.id);

  if (idx === -1) {
    currentPost.likes.push(currentUser.id);
  } else {
    currentPost.likes.splice(idx, 1);
  }

  if (isUserPost) {
    localStorage.setItem("userPosts", JSON.stringify(userPosts));
  } else {
    localStorage.setItem("posts", JSON.stringify(savedPosts));
  }

  post.innerHTML = "";
  displayedCount = 0;
  renderPosts();
}

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("currentUser");
    currentUser = null;
    updateHeaderNavigation();
    updateCreatePostBox();
    showToast("Logged out successfully");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  }
}

loadMoreBtn.onclick = () => renderPosts();
updateHeaderNavigation();
updateCreatePostBox();
initPosts();