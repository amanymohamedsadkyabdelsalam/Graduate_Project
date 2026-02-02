document.addEventListener("DOMContentLoaded", () => {
  const postContainer = document.getElementById("posts");
  const loader = document.getElementById("loader");
  const toast = document.getElementById("toast");
  const darkModeToggle = document.getElementById("darkModeToggle");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const createPostForm = document.getElementById("createPostForm");
  const createPostBox = document.getElementById("createPostBox");

  let currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  let allPosts = [];
  let displayedCount = 0;
  const postsPerPage = 5;
  let isLoading = false;
  let hasMorePosts = true;
  let currentPage = 0;
  let activePostMenu = null;
  let postToDelete = null;

  init();

  function init() {
    checkAuth();
    setupEventListeners();
    fetchPosts();
    setupNavigation();
  }

  function checkAuth() {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("currentUser");

    if (token && userData) {
      try {
        currentUser = JSON.parse(userData);
        updateUIForLoggedInUser();
      } catch (e) {
        console.error("Error parsing user data:", e);
        logout();
      }
    } else {
      updateUIForGuest();
    }
  }

  function updateUIForLoggedInUser() {
    const userAvatar = currentUser.profile_image || "assets/images/error.jpeg";
    document.getElementById("userAvatar").src = userAvatar;
    document.getElementById("formUserAvatar").src = userAvatar;
    document.getElementById("formUsername").textContent =
      currentUser.username || "User";

    const nav = document.querySelector(".navigation ul");
    nav.innerHTML = `
      <li><a href="index.html"><i class="fa-solid fa-house-user"></i> Home</a></li>
      <li><a href="#" onclick="openMyProfile()"><i class="fa-solid fa-user"></i> Profile</a></li>
      <li><a href="#" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i> Logout</a></li>
    `;

    createPostBox.style.display = "block";
  }

  function updateUIForGuest() {
    const nav = document.querySelector(".navigation ul");
    nav.innerHTML = `
      <li><a href="index.html"><i class="fa-solid fa-house-user"></i> Home</a></li>
      <li><a href="login.html"><i class="fa-solid fa-right-to-bracket"></i> Log In</a></li>
      <li><a href="sign.html" class="signUp"><i class="fa-solid fa-user-plus"></i> Sign UP</a></li>
    `;

    createPostBox.style.display = "none";
  }

  function setupEventListeners() {
    if (localStorage.getItem("darkMode") === "enabled") {
      document.body.classList.add("dark-mode");
    }

    darkModeToggle.onclick = () => {
      document.body.classList.toggle("dark-mode");
      localStorage.setItem(
        "darkMode",
        document.body.classList.contains("dark-mode") ? "enabled" : "disabled"
      );
    };

    window.addEventListener("scroll", handleScroll);

    // Close post menu when clicking outside
    document.addEventListener("click", (e) => {
      if (activePostMenu && !e.target.closest(".post-menu-container")) {
        activePostMenu.classList.remove("show");
        activePostMenu = null;
      }
    });

    // Close modals when clicking outside
    document.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("delete-modal-overlay") ||
        e.target.classList.contains("share-modal-overlay") ||
        e.target.classList.contains("edit-modal-overlay")
      ) {
        closeDeleteModal();
        closeShareModal();
        closeEditModal();
      }
    });
  }

  function setupNavigation() {
    document.addEventListener("click", (e) => {
      if (
        e.target.closest("a[href='#']") &&
        e.target.closest("a").textContent.includes("Logout")
      ) {
        e.preventDefault();
        logout();
      }
    });
  }

  function openMyProfile() {
    if (currentUser && currentUser.id) {
      openUserProfile(currentUser.id);
    }
  }

  function openUserProfile(userId) {
    localStorage.setItem("viewingUserId", userId);
    window.location.href = "profile.html";
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("viewingUserId");
    currentUser = null;
    updateUIForGuest();
    showToast("Logged out successfully");
    postContainer.innerHTML = "";
    displayedCount = 0;
    currentPage = 0;
    allPosts = [];
    fetchPosts();
  }

  async function apiRequest(url, method = "GET", bodyData = null) {
    const token = localStorage.getItem("token");
    const headers = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers: {
        ...headers,
        Accept: "application/json",
      },
    };

    if (bodyData) {
      if (bodyData instanceof FormData) {
        options.body = bodyData;
      } else {
        headers["Content-Type"] = "application/json";
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(bodyData);
      }
    }

    try {
      const res = await fetch(url, options);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `HTTP error! status: ${res.status}`);
      }

      return data;
    } catch (error) {
      console.error("API Request Error:", error);
      showToast(error.message || "Something went wrong. Please try again.");
      return null;
    }
  }

  async function fetchPosts() {
    if (isLoading || !hasMorePosts) return;

    isLoading = true;
    loader.style.display = "block";
    loadMoreBtn.style.display = "none";

    try {
      currentPage++;
      const result = await apiRequest(
        `https://tarmeezacademy.com/api/v1/posts?limit=${postsPerPage}&page=${currentPage}`
      );

      if (result && result.data) {
        if (result.data.length === 0) {
          hasMorePosts = false;
          loadMoreBtn.style.display = "none";
        } else {
          allPosts = [...allPosts, ...result.data];
          renderPosts();
          loadMoreBtn.style.display =
            allPosts.length >= postsPerPage ? "block" : "none";
        }
      } else {
        hasMorePosts = false;
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      showToast("Failed to load posts");
    } finally {
      isLoading = false;
      loader.style.display = "none";
    }
  }

  function renderPosts() {
    const postsToRender = allPosts.slice(displayedCount);

    postsToRender.forEach((post) => {
      const postElement = createPostElement(post);
      postContainer.appendChild(postElement);
    });

    displayedCount = allPosts.length;
  }

  function createPostElement(post) {
    const div = document.createElement("div");
    div.className = "post-card";
    div.id = `post-${post.id}`;

    const likesCount = post.likes_count || 0;
    const commentsCount = post.comments_count || 0;
    const isLiked = post.is_liked || false;
    const comments = post.comments || [];

    const postDate = new Date(post.created_at);
    let displayDate;

    // تحقق من أن currentUser موجود ومقارنة IDs
    const isCurrentUserAuthor =
      currentUser &&
      currentUser.id &&
      post.author &&
      post.author.id &&
      parseInt(currentUser.id) === parseInt(post.author.id);

    if (currentUser && !isCurrentUserAuthor) {
      displayDate = postDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      displayDate = getRelativeTime(postDate);
    }

    let commentsHTML = "";
    if (comments.length > 0) {
      commentsHTML = comments
        .map(
          (comment) => `
        <div class="comment-item">
          <img src="${
            comment.author.profile_image || "assets/images/error.jpeg"
          }" 
               alt="${comment.author.username}" 
               class="comment-avatar clickable-avatar"
               onclick="openUserProfile(${comment.author.id})"
               style="cursor: pointer"
               onerror="this.src='assets/images/error.jpeg'">
          <div class="comment-content">
            <div class="comment-bubble">
              <div class="comment-author">${comment.author.username}</div>
              <div class="comment-text">${comment.body}</div>
            </div>
          </div>
        </div>
      `
        )
        .join("");
    }

    div.innerHTML = `
      <div class="post-header">
        <img src="${post.author.profile_image || "assets/images/error.jpeg"}" 
             alt="${post.author.username}" 
             class="user-avatar clickable-avatar"
             onclick="openUserProfile(${post.author.id})"
             style="cursor: pointer"
             onerror="this.src='assets/images/error.jpeg'">
        <div class="post-author-info">
          <h3>${post.author.name}</h3>
          <p>@${post.author.username}</p>
          <p>${displayDate}</p>
        </div>
        
        ${
          isCurrentUserAuthor
            ? `
          <div class="post-menu-container">
            <button class="post-menu-btn" onclick="togglePostMenu(${post.id}, event)">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <div class="post-menu-dropdown" id="post-menu-${post.id}">
              <div class="post-menu-item edit" onclick="editPost(${post.id})">
                <i class="fas fa-edit"></i>
                <span>Edit</span>
              </div>
              <div class="post-menu-item share" onclick="sharePost(${post.id})">
                <i class="fas fa-share-alt"></i>
                <span>Share</span>
              </div>
              <div class="post-menu-item delete" onclick="showDeleteModal(${post.id})">
                <i class="fas fa-trash"></i>
                <span>Delete</span>
              </div>
            </div>
          </div>
        `
            : `
          <div class="post-menu-container">
            <button class="post-menu-btn" onclick="togglePostMenu(${post.id}, event)">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <div class="post-menu-dropdown" id="post-menu-${post.id}">
              <div class="post-menu-item share" onclick="sharePost(${post.id})">
                <i class="fas fa-share-alt"></i>
                <span>Share</span>
              </div>
              <div class="post-menu-item" onclick="reportPost(${post.id})">
                <i class="fas fa-flag"></i>
                <span>Report</span>
              </div>
            </div>
          </div>
        `
        }
      </div>
      
      <div class="post-content">
        ${post.title ? `<h4 class="post-title">${post.title}</h4>` : ""}
        <div class="post-body">${post.body}</div>
        ${
          post.image
            ? `<img src="${
                post.image || "assets/images/error.jpeg"
              }" class="post-image" alt="Post image">`
            : ""
        }
      </div>
      
      <div class="post-stats">
        <span class="likes-count">${likesCount} likes</span>
        <span class="comments-count">${commentsCount} comments</span>
      </div>
      
      <div class="post-actions">
        <button class="action-btn like-btn ${
          isLiked ? "liked" : ""
        }" onclick="toggleLike(${post.id})">
          <i class="fa-${isLiked ? "solid" : "regular"} fa-heart"></i>
          <span>Like</span>
        </button>
        <button class="action-btn comment-btn" onclick="toggleComments(${
          post.id
        })">
          <i class="fa-regular fa-comment"></i>
          <span>Comment</span>
        </button>
      </div>
      
      <div class="comments-section" id="comments-${
        post.id
      }" style="display: none;">
        <div class="comments-list" id="comments-list-${post.id}">
          ${commentsHTML}
        </div>
        
        ${
          currentUser
            ? `
          <div class="add-comment">
            <img src="${
              currentUser.profile_image || "assets/images/error.jpeg"
            }" 
                 alt="You" 
                 class="myImg clickable-avatar"
                 onclick="openMyProfile()"
                 style="cursor: pointer"
                 onerror="this.src='assets/images/error.jpeg'">
            <div class="comment-input-wrapper">
              <input type="text" 
                     id="comment-input-${post.id}" 
                     placeholder="Write a comment..."
                     onkeypress="handleCommentKeyPress(event, ${post.id})">
              <button class="send-comment-btn" onclick="addComment(${
                post.id
              })" id="send-comment-${post.id}">
                <i class="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        `
            : `
          <div class="login-prompt">
            <a href="login.html">Log in</a> to comment
          </div>
        `
        }
      </div>
    `;

    return div;
  }

  function getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;

    if (isNaN(diffMs) || diffMs < 0) {
      return "Recently";
    }

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 60) {
      return "Just now";
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;
    } else if (diffDay < 7) {
      return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
    } else if (diffWeek < 4) {
      return `${diffWeek} week${diffWeek !== 1 ? "s" : ""} ago`;
    } else if (diffMonth < 12) {
      return `${diffMonth} month${diffMonth !== 1 ? "s" : ""} ago`;
    } else {
      return `${diffYear} year${diffYear !== 1 ? "s" : ""} ago`;
    }
  }

  function handleScroll() {
    if (isLoading || !hasMorePosts) return;

    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 100) {
      fetchPosts();
    }
  }

  async function toggleLike(postId) {
    if (!currentUser) {
      showToast("Please login to like posts");
      window.location.href = "login.html";
      return;
    }

    const postElement = document.getElementById(`post-${postId}`);
    const likeBtn = postElement.querySelector(".like-btn");
    const likeIcon = likeBtn.querySelector("i");
    const likesCountElement = postElement.querySelector(".likes-count");

    const isLiked = likeBtn.classList.contains("liked");
    const currentLikes = parseInt(likesCountElement.textContent) || 0;

    if (isLiked) {
      likeBtn.classList.remove("liked");
      likeIcon.classList.remove("fa-solid");
      likeIcon.classList.add("fa-regular");
      likesCountElement.textContent = `${currentLikes - 1} likes`;
    } else {
      likeBtn.classList.add("liked");
      likeIcon.classList.remove("fa-regular");
      likeIcon.classList.add("fa-solid");
      likesCountElement.textContent = `${currentLikes + 1} likes`;
    }

    const method = isLiked ? "DELETE" : "POST";
    const result = await apiRequest(
      `https://tarmeezacademy.com/api/v1/posts/${postId}/like`,
      method
    );

    if (!result) {
      if (isLiked) {
        likeBtn.classList.add("liked");
        likeIcon.classList.add("fa-solid");
        likeIcon.classList.remove("fa-regular");
        likesCountElement.textContent = `${currentLikes} likes`;
      } else {
        likeBtn.classList.remove("liked");
        likeIcon.classList.add("fa-regular");
        likeIcon.classList.remove("fa-solid");
        likesCountElement.textContent = `${currentLikes} likes`;
      }
      showToast("Failed to update like");
    }
  }

  function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    const isVisible = commentsSection.style.display === "block";

    commentsSection.style.display = isVisible ? "none" : "block";

    if (!isVisible) {
      const input = document.getElementById(`comment-input-${postId}`);
      if (input) input.focus();
    }
  }

  async function addComment(postId) {
    if (!currentUser) {
      showToast("Please login to comment");
      window.location.href = "login.html";
      return;
    }

    const input = document.getElementById(`comment-input-${postId}`);
    const commentText = input.value.trim();

    if (!commentText) {
      showToast("Please write a comment");
      return;
    }

    const sendBtn = document.getElementById(`send-comment-${postId}`);
    const originalContent = sendBtn.innerHTML;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    sendBtn.disabled = true;

    const result = await apiRequest(
      `https://tarmeezacademy.com/api/v1/posts/${postId}/comments`,
      "POST",
      { body: commentText }
    );

    sendBtn.innerHTML = originalContent;
    sendBtn.disabled = false;

    if (result && result.data) {
      input.value = "";
      showToast("Comment added!");

      const commentsList = document.getElementById(`comments-list-${postId}`);
      const newComment = document.createElement("div");
      newComment.className = "comment-item";
      newComment.innerHTML = `
        <img src="${currentUser.profile_image || "assets/images/error.jpeg"}" 
             alt="${currentUser.username}" 
             class="comment-avatar clickable-avatar"
             onclick="openMyProfile()"
             style="cursor: pointer"
             onerror="this.src='assets/images/error.jpeg'">
        <div class="comment-content">
          <div class="comment-bubble">
            <div class="comment-author">${currentUser.username}</div>
            <div class="comment-text">${commentText}</div>
          </div>
        </div>
      `;
      commentsList.appendChild(newComment);

      const postElement = document.getElementById(`post-${postId}`);
      const commentsCountElement = postElement.querySelector(".comments-count");
      const currentCount = parseInt(commentsCountElement.textContent) || 0;
      commentsCountElement.textContent = `${currentCount + 1} comments`;

      newComment.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function handleCommentKeyPress(event, postId) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      addComment(postId);
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  function openCreatePostForm() {
    if (!currentUser) {
      showToast("Please login to create a post");
      window.location.href = "login.html";
      return;
    }

    createPostForm.style.display = "block";
    createPostBox.style.display = "none";
    document.getElementById("postContent").focus();
  }

  function closeCreatePostForm() {
    createPostForm.style.display = "none";
    createPostBox.style.display = "block";
    document.getElementById("postContent").value = "";
    document.getElementById("imagePreview").style.display = "none";
    document.getElementById("previewImage").src = "";
    document.getElementById("postImageInput").value = "";
  }

  function previewPostImage(event) {
    const input = event.target;
    const preview = document.getElementById("previewImage");
    const previewContainer = document.getElementById("imagePreview");

    if (input.files && input.files[0]) {
      const reader = new FileReader();

      reader.onload = function (e) {
        preview.src = e.target.result;
        previewContainer.style.display = "block";
      };

      reader.readAsDataURL(input.files[0]);
    }
  }

  function removeImage() {
    document.getElementById("imagePreview").style.display = "none";
    document.getElementById("previewImage").src = "";
    document.getElementById("postImageInput").value = "";
  }

  async function createPost() {
    if (!currentUser) {
      showToast("Please login to create a post");
      return;
    }

    const content = document.getElementById("postContent").value.trim();
    const imageInput = document.getElementById("postImageInput");

    if (!content && !imageInput.files[0]) {
      showToast("Please add some content or an image");
      return;
    }

    const postButton = document.querySelector(".post-button");
    const originalText = postButton.textContent;
    postButton.textContent = "Posting...";
    postButton.disabled = true;

    try {
      const formData = new FormData();
      formData.append("body", content);

      if (imageInput.files[0]) {
        formData.append("image", imageInput.files[0]);
      }

      const result = await apiRequest(
        "https://tarmeezacademy.com/api/v1/posts",
        "POST",
        formData
      );

      if (result && result.data) {
        showToast("Post created successfully!");
        closeCreatePostForm();

        allPosts.unshift(result.data);
        postContainer.innerHTML = "";
        displayedCount = 0;
        renderPosts();
      }
    } catch (error) {
      console.error("Create post error:", error);
    } finally {
      postButton.textContent = originalText;
      postButton.disabled = false;
    }
  }

  function loadMorePosts() {
    fetchPosts();
  }

  // Post Menu Functions
  function togglePostMenu(postId, event) {
    event.stopPropagation();

    const menu = document.getElementById(`post-menu-${postId}`);

    // Close other open menus
    if (activePostMenu && activePostMenu !== menu) {
      activePostMenu.classList.remove("show");
    }

    // Toggle current menu
    menu.classList.toggle("show");
    activePostMenu = menu.classList.contains("show") ? menu : null;
  }

  async function editPost(postId) {
    if (!currentUser) {
      showToast("Please login to edit posts");
      return;
    }

    try {
      // Get post data
      const response = await fetch(
        `https://tarmeezacademy.com/api/v1/posts/${postId}`
      );
      const result = await response.json();

      if (result.data) {
        const post = result.data;

        // Create edit modal
        const modal = document.createElement("div");
        modal.className = "edit-modal-overlay show";
        modal.innerHTML = `
          <div class="edit-modal">
            <button class="close-modal-btn" onclick="closeEditModal()">
              <i class="fas fa-times"></i>
            </button>
            <h3>Edit Post</h3>
            <form id="editPostForm-${postId}">
              <div class="form-group">
                <label for="edit-title-${postId}">Title (Optional)</label>
                <input type="text" id="edit-title-${postId}" value="${
          post.title || ""
        }" placeholder="Enter post title">
              </div>
              <div class="form-group">
                <label for="edit-body-${postId}">Content *</label>
                <textarea id="edit-body-${postId}" rows="4" required placeholder="What's on your mind?">${
          post.body
        }</textarea>
              </div>
              <div class="image-preview" id="edit-image-preview-${postId}">
                ${
                  post.image
                    ? `<img src="${post.image}" alt="Current image" loading="lazy">`
                    : ""
                }
              </div>
              <div class="form-group">
                <label for="edit-image-${postId}">Change Image (Optional)</label>
                <input type="file" id="edit-image-${postId}" accept="image/*">
              </div>
              <div class="modal-actions">
                <button type="button" class="cancel-btn" onclick="closeEditModal()">Cancel</button>
                <button type="submit" class="save-btn">Save Changes</button>
              </div>
            </form>
          </div>
        `;

        document.body.appendChild(modal);

        // Handle form submission
        document
          .getElementById(`editPostForm-${postId}`)
          .addEventListener("submit", async (e) => {
            e.preventDefault();
            await updatePost(postId);
          });

        // Handle image preview
        document
          .getElementById(`edit-image-${postId}`)
          .addEventListener("change", function (e) {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = function (e) {
                const preview = document.getElementById(
                  `edit-image-preview-${postId}`
                );
                preview.innerHTML = `<img src="${e.target.result}" alt="New image">`;
              };
              reader.readAsDataURL(file);
            }
          });
      }
    } catch (error) {
      console.error("Error loading post for edit:", error);
      showToast("Failed to load post for editing");
    }
  }

  async function updatePost(postId) {
    const title = document.getElementById(`edit-title-${postId}`).value.trim();
    const body = document.getElementById(`edit-body-${postId}`).value.trim();
    const imageInput = document.getElementById(`edit-image-${postId}`);

    if (!body) {
      showToast("Please enter some content");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("body", body);

      if (imageInput.files[0]) {
        formData.append("image", imageInput.files[0]);
      }

      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://tarmeezacademy.com/api/v1/posts/${postId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        showToast("Post updated successfully!");
        closeEditModal();

        // Refresh the page to show updated post
        location.reload();
      } else {
        showToast(result.message || "Failed to update post");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      showToast("Failed to update post");
    }
  }

  function closeEditModal() {
    const modal = document.querySelector(".edit-modal-overlay");
    if (modal) {
      modal.remove();
    }
  }

  function showDeleteModal(postId) {
    postToDelete = postId;
    const modal = document.createElement("div");
    modal.className = "delete-modal-overlay show";
    modal.innerHTML = `
      <div class="delete-modal">
        <h3>Delete Post</h3>
        <p>Are you sure you want to delete this post? This action cannot be undone.</p>
        <div class="delete-modal-actions">
          <button class="delete-cancel-btn" onclick="closeDeleteModal()">Cancel</button>
          <button class="delete-confirm-btn" onclick="confirmDelete()">Delete</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function closeDeleteModal() {
    const modal = document.querySelector(".delete-modal-overlay");
    if (modal) {
      modal.remove();
    }
    postToDelete = null;
  }

  async function confirmDelete() {
    if (!postToDelete) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://tarmeezacademy.com/api/v1/posts/${postToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        showToast("Post deleted successfully!");

        // Remove post from DOM
        const postElement = document.getElementById(`post-${postToDelete}`);
        if (postElement) {
          postElement.remove();
        }

        closeDeleteModal();
      } else {
        const result = await response.json();
        showToast(result.message || "Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      showToast("Failed to delete post");
    }
  }

  function sharePost(postId) {
    const postUrl = `${window.location.origin}/post.html?id=${postId}`;
    const modal = document.createElement("div");
    modal.className = "share-modal-overlay show";
    modal.innerHTML = `
      <div class="share-modal">
        <button class="close-modal-btn" onclick="closeShareModal()">
          <i class="fas fa-times"></i>
        </button>
        <h3>Share Post</h3>
        <div class="share-options">
          <div class="share-option facebook" onclick="shareToFacebook(${postId})">
            <i class="fab fa-facebook"></i>
            <span>Facebook</span>
          </div>
          <div class="share-option twitter" onclick="shareToTwitter(${postId})">
            <i class="fab fa-twitter"></i>
            <span>Twitter</span>
          </div>
          <div class="share-option whatsapp" onclick="shareToWhatsApp(${postId})">
            <i class="fab fa-whatsapp"></i>
            <span>WhatsApp</span>
          </div>
          <div class="share-option copy" onclick="copyPostLink(${postId})">
            <i class="fas fa-copy"></i>
            <span>Copy Link</span>
          </div>
        </div>
        <div class="share-url-container">
          <label>Post URL:</label>
          <div class="share-url">
            <input type="text" value="${postUrl}" readonly id="share-url-${postId}">
            <button onclick="copyPostLink(${postId})">Copy</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function closeShareModal() {
    const modal = document.querySelector(".share-modal-overlay");
    if (modal) {
      modal.remove();
    }
  }

  function shareToFacebook(postId) {
    const url = encodeURIComponent(
      `${window.location.origin}/post.html?id=${postId}`
    );
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank"
    );
    closeShareModal();
  }

  function shareToTwitter(postId) {
    const url = encodeURIComponent(
      `${window.location.origin}/post.html?id=${postId}`
    );
    const text = encodeURIComponent("Check out this post on SocialVibe!");
    window.open(
      `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      "_blank"
    );
    closeShareModal();
  }

  function shareToWhatsApp(postId) {
    const url = encodeURIComponent(
      `${window.location.origin}/post.html?id=${postId}`
    );
    const text = encodeURIComponent("Check out this post on SocialVibe!");
    window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
    closeShareModal();
  }

  function copyPostLink(postId) {
    const url = `${window.location.origin}/post.html?id=${postId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        showToast("Link copied to clipboard!");
        closeShareModal();
      })
      .catch(() => {
        // Fallback for older browsers
        const input = document.getElementById(`share-url-${postId}`);
        if (input) {
          input.select();
          document.execCommand("copy");
          showToast("Link copied to clipboard!");
          closeShareModal();
        }
      });
  }

  function reportPost(postId) {
    showToast("Thank you for reporting this post. Our team will review it.");
  }

  // Export functions to window object
  window.toggleLike = toggleLike;
  window.addComment = addComment;
  window.toggleComments = toggleComments;
  window.handleCommentKeyPress = handleCommentKeyPress;
  window.openCreatePostForm = openCreatePostForm;
  window.closeCreatePostForm = closeCreatePostForm;
  window.previewPostImage = previewPostImage;
  window.removeImage = removeImage;
  window.createPost = createPost;
  window.loadMorePosts = loadMorePosts;
  window.logout = logout;
  window.openUserProfile = openUserProfile;
  window.openMyProfile = openMyProfile;
  window.togglePostMenu = togglePostMenu;
  window.editPost = editPost;
  window.sharePost = sharePost;
  window.showDeleteModal = showDeleteModal;
  window.closeDeleteModal = closeDeleteModal;
  window.confirmDelete = confirmDelete;
  window.closeShareModal = closeShareModal;
  window.shareToFacebook = shareToFacebook;
  window.shareToTwitter = shareToTwitter;
  window.shareToWhatsApp = shareToWhatsApp;
  window.copyPostLink = copyPostLink;
  window.reportPost = reportPost;
  window.closeEditModal = closeEditModal;
});
