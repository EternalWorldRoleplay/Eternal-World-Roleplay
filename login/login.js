document.getElementById("loginBtn").addEventListener("click", async () => {
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
      return data.redirectUri;
    } catch (err) {
      console.error('Failed to fetch config:', err);
      backendUrl = 'https://website-fetching.onrender.com'; // Fallback
      frontendUrl = 'https://yourusername.github.io'; // Fallback
      return `${backendUrl}/callback`;
    }
  }

  try {
    const redirectUri = await fetchConfig();
    const CLIENT_ID = "1347855844359934012";
    const scopes = ["identify", "email", "guilds", "guilds.members.read"];
    const responseType = "code";

    const oauthUrl = new URL("https://discord.com/api/oauth2/authorize");
    oauthUrl.searchParams.set("client_id", CLIENT_ID);
    oauthUrl.searchParams.set("redirect_uri", redirectUri);
    oauthUrl.searchParams.set("response_type", responseType);
    oauthUrl.searchParams.set("scope", scopes.join(" "));
    console.log("OAuth URL:", oauthUrl.toString());

    window.location.href = oauthUrl.toString();
  } catch (error) {
    console.error("Failed to initiate OAuth flow:", error.message);
    alert("Error initiating login. Please try again later.");
  }
});