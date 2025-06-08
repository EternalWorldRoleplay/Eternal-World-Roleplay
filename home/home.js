window.addEventListener("DOMContentLoaded", async () => {
  let currentUser = null;
  let backendUrl = null;
  let frontendUrl = null;

  // Fetch config to get dynamic URLs
  async function fetchConfig() {
    try {
      const res = await fetch('/api/config', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch config');
      const data = await res.json();
      backendUrl = data.backendUrl || 'https://website-fetching.onrender.com'; // Fallback to your Render URL
      frontendUrl = data.frontendUrl || 'https://yourusername.github.io'; // Fallback to your GitHub Pages URL
    } catch (err) {
      console.error('Failed to fetch config:', err);
      backendUrl = 'https://website-fetching.onrender.com'; // Fallback
      frontendUrl = 'https://yourusername.github.io'; // Fallback
    }
  }

  // Authentication Check
  try {
    await fetchConfig(); // Get URLs first
    const res = await fetch(`${backendUrl}/auth-check`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch auth status');
    const data = await res.json();
    currentUser = data;

    const profileContainer = document.getElementById("profile-container");
    const loginBox = document.getElementById("login-box");
    const profilePic = document.getElementById("profile-pic");
    const panelLink = document.getElementById("panel-link");

    if (data.loggedIn) {
      loginBox.style.display = "none";
      profileContainer.style.display = "inline-block";

      if (data.avatar) {
        profilePic.src = `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=128`;
      } else {
        const defaultAvatarIndex = parseInt(data.discriminator) % 5;
        profilePic.src = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
      }

      if (data.isAdmin) {
        panelLink.style.display = "block";
      }
    } else {
      profileContainer.style.display = "none";
      loginBox.style.display = "inline-block";
    }
  } catch (err) {
    console.error("Failed to fetch auth status:", err);
  }

  // Elements for Feedback Section
  const sendBtn = document.getElementById("send-feedback-btn");
  const feedbackInput = document.getElementById("feedback-input");
  const feedbackStatus = document.getElementById("feedback-status");
  const feedbackSection = document.getElementById("feedback-section");

  // Store user info after auth-check
  async function fetchUserInfo() {
    try {
      const res = await fetch(`${backendUrl}/auth-check`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch user info');
      const data = await res.json();

      if (data.loggedIn) {
        localStorage.setItem("username", data.username + "#" + data.discriminator);
        localStorage.setItem("userId", data.id);
        if (data.avatar) {
          localStorage.setItem(
            "avatarUrl",
            `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=128`
          );
        } else {
          localStorage.setItem("avatarUrl", "https://cdn.discordapp.com/embed/avatars/0.png");
        }
      } else {
        localStorage.removeItem("username");
        localStorage.removeItem("userId");
        localStorage.removeItem("avatarUrl");
      }
    } catch (err) {
      console.error("Failed to fetch user info:", err);
    }
  }

  // Initial fetch user info on page load
  fetchUserInfo();

  // Send feedback button click
  sendBtn.addEventListener("click", async () => {
    const message = feedbackInput.value.trim();
    if (!message) {
      alert("Please enter your feedback before sending.");
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";

    try {
      const username = localStorage.getItem("username") || "Unknown User";
      const userId = localStorage.getItem("userId") || "000000000000000000";
      const avatarUrl = localStorage.getItem("avatarUrl") || "https://cdn.discordapp.com/embed/avatars/0.png";
      const timestamp = new Date().toISOString();

      const payload = {
        section: "Feedback",
        username: username,
        message: message,
        userId: userId,
        avatarUrl: avatarUrl,
        user_agent: navigator.userAgent,
        timestamp: timestamp
      };

      const response = await fetch(`${backendUrl}/log-discord-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (response.ok) {
        feedbackStatus.textContent = "Thank you for your feedback!";
        feedbackStatus.classList.remove("error");
        feedbackStatus.classList.add("success");
        feedbackInput.value = "";
      } else {
        feedbackStatus.textContent = "Failed to send feedback. Please try again later.";
        feedbackStatus.classList.remove("success");
        feedbackStatus.classList.add("error");
        console.error("Failed to send feedback: response not ok");
      }
    } catch (error) {
      feedbackStatus.textContent = "An error occurred. Please try again later.";
      feedbackStatus.classList.remove("success");
      feedbackStatus.classList.add("error");
      console.error("Error sending feedback:", error);
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = "Send Feedback";
    }
  });

  function resetFeedbackForm() {
    feedbackStatus.textContent = "";
    feedbackStatus.classList.remove("success", "error");
    feedbackInput.value = "";
    sendBtn.disabled = false;
    sendBtn.textContent = "Send Feedback";
  }

  // Server Status Elements
  const serverStatusSpan = document.getElementById("server-status");
  const playerCountSpan = document.getElementById("player-count");
  const progressBar = document.getElementById("progress-bar");

  async function updateServerStatus() {
    try {
      const res = await fetch(`${backendUrl}/api/server-status`, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch server status");
      const data = await res.json();

      if (data.online) {
        serverStatusSpan.innerHTML = "<b>Online</b>";
        serverStatusSpan.style.color = "limegreen";

        const onlinePlayers = data.onlinePlayers || 0;
        let maxPlayers = onlinePlayers < 50 ? 50 : onlinePlayers <= 100 ? 100 : 250;

        playerCountSpan.textContent = `${onlinePlayers}/${maxPlayers}`;
        const percentage = Math.min((onlinePlayers / maxPlayers) * 100, 100);
        progressBar.style.width = `${percentage}%`;
        progressBar.style.backgroundColor = "limegreen";
      } else {
        serverStatusSpan.textContent = "Offline";
        serverStatusSpan.style.color = "red";
        playerCountSpan.textContent = `0/150`;
        progressBar.style.width = "0%";
        progressBar.style.backgroundColor = "red";
      }
    } catch (err) {
      console.error("Error updating server status:", err);
      serverStatusSpan.textContent = "Unknown";
      serverStatusSpan.style.color = "orange";
      playerCountSpan.textContent = `0/150`;
      progressBar.style.width = "0%";
      progressBar.style.backgroundColor = "orange";
    }
  }

  // Initial call and interval update every 10 seconds
  updateServerStatus();
  setInterval(updateServerStatus, 10000);
});

function handleAuthAction() {
  window.location.href = `${frontendUrl}/login`; // Redirect to frontend login
}

function handleLogout(event) {
  event.preventDefault();
  fetch(`${backendUrl}/logout`, {
    method: "POST",
    credentials: 'include' // Include cookies for session
  })
    .then(() => {
      window.location.href = `${frontendUrl}/`; // Redirect to frontend home
    })
    .catch(err => console.error("Logout failed:", err));
}