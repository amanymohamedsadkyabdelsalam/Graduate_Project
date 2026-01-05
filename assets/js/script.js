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
    document.getElementById("formUsername").textContent = currentUser.username || "User";
    
    const nav = document.querySelector(".navigation ul");
    nav.innerHTML = `
      <li><a href="index.html"><i class="fa-solid fa-house-user"></i> Home</a></li>
      <li><a href="profile.html"><i class="fa-solid fa-user"></i> Profile</a></li>
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
  }

  function setupNavigation() {
    document.addEventListener("click", (e) => {
      if (e.target.closest("a[href='#']") && e.target.closest("a").textContent.includes("Logout")) {
        e.preventDefault();
        logout();
      }
    });
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
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
        "Accept": "application/json"
      }
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
          loadMoreBtn.style.display = allPosts.length >= postsPerPage ? "block" : "none";
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
    const formattedDate = 
    (currentUser && currentUser.id === post.user_id)?
    postDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : post.created_at;
   
    let commentsHTML = '';
    if (comments.length > 0) {
      commentsHTML = comments.map(comment => `
        <div class="comment-item">
          <img src="${comment.author.profile_image || 'assets/images/error.jpeg'}" 
               alt="${comment.author.username}" 
               class="comment-avatar"
               onerror="this.src='assets/images/error.jpeg'">
          <div class="comment-content">
            <div class="comment-bubble">
              <div class="comment-author">${comment.author.username}</div>
              <div class="comment-text">${comment.body}</div>
            </div>
          </div>
        </div>
      `).join('');
    }
    
    div.innerHTML = `
      <div class="post-header">
        <img src="${post.author.profile_image || 'assets/images/error.jpeg'}" 
             alt="${post.author.username}" 
             class="user-avatar"
             onerror="this.src='assets/images/error.jpeg'">
        <div class="post-author-info">
          <h3>${post.author.name}</h3>
          <p>${post.author.username}</p>
          <p>${formattedDate}</p>
        </div>
      </div>
      
      <div class="post-content">
        ${post.title ? `<h4 class="post-title">${post.title}</h4>` : ''}
        <div class="post-body">${post.body}</div>
        ${post.image ? `<img src="${post.image || 'assets/images/error.jpeg'}" class="post-image" alt="Post image">` : ''}
      </div>
      
      <div class="post-stats">
        <span class="likes-count">${likesCount} likes</span>
        <span class="comments-count">${commentsCount} comments</span>
      </div>
      
      <div class="post-actions">
        <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
          <i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart"></i>
          <span>Like</span>
        </button>
        <button class="action-btn comment-btn" onclick="toggleComments(${post.id})">
          <i class="fa-regular fa-comment"></i>
          <span>Comment</span>
        </button>
      </div>
      
      <div class="comments-section" id="comments-${post.id}" style="display: none;">
        <div class="comments-list" id="comments-list-${post.id}">
          ${commentsHTML}
        </div>
        
        ${currentUser ? `
          <div class="add-comment">
            <img src="${currentUser.profile_image || 'assets/images/error.jpeg'}" 
                 alt="You" 
                 class="myImg"
                 onerror="this.src='assets/images/error.jpeg'">
            <div class="comment-input-wrapper">
              <input type="text" 
                     id="comment-input-${post.id}" 
                     placeholder="Write a comment..."
                     onkeypress="handleCommentKeyPress(event, ${post.id})">
              <button class="send-comment-btn" onclick="addComment(${post.id})" id="send-comment-${post.id}">
                <i class="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        ` : `
          <div class="login-prompt">
            <a href="login.html">Log in</a> to comment
          </div>
        `}
      </div>
    `;
    
    return div;
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
    const likeBtn = postElement.querySelector('.like-btn');
    const likeIcon = likeBtn.querySelector('i');
    const likesCountElement = postElement.querySelector('.likes-count');
    
    const isLiked = likeBtn.classList.contains('liked');
    const currentLikes = parseInt(likesCountElement.textContent) || 0;
    
    if (isLiked) {
      likeBtn.classList.remove('liked');
      likeIcon.classList.remove('fa-solid');
      likeIcon.classList.add('fa-regular');
      likesCountElement.textContent = `${currentLikes - 1} likes`;
    } else {
      likeBtn.classList.add('liked');
      likeIcon.classList.remove('fa-regular');
      likeIcon.classList.add('fa-solid');
      likesCountElement.textContent = `${currentLikes + 1} likes`;
    }
    
    const method = isLiked ? "DELETE" : "POST";
    const result = await apiRequest(
      `https://tarmeezacademy.com/api/v1/posts/${postId}/like`,
      method
    );
    
    if (!result) {
      if (isLiked) {
        likeBtn.classList.add('liked');
        likeIcon.classList.add('fa-solid');
        likeIcon.classList.remove('fa-regular');
        likesCountElement.textContent = `${currentLikes} likes`;
      } else {
        likeBtn.classList.remove('liked');
        likeIcon.classList.add('fa-regular');
        likeIcon.classList.remove('fa-solid');
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
      const newComment = document.createElement('div');
      newComment.className = 'comment-item';
      newComment.innerHTML = `
        <img src="${currentUser.profile_image || 'assets/images/error.jpeg'}" 
             alt="${currentUser.username}" 
             class="comment-avatar"
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
      const commentsCountElement = postElement.querySelector('.comments-count');
      const currentCount = parseInt(commentsCountElement.textContent) || 0;
      commentsCountElement.textContent = `${currentCount + 1} comments`;
      
      newComment.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function handleCommentKeyPress(event, postId) {
    if (event.key === 'Enter' && !event.shiftKey) {
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
      
      reader.onload = function(e) {
        preview.src = e.target.result;
        previewContainer.style.display = "block";
      }
      
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
});