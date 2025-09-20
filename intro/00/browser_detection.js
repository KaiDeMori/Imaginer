// Browser detection utility for Firefox check
window.browser_detection = {
  is_firefox: function () {
    // Check user agent for Firefox
    const user_agent = navigator.userAgent.toLowerCase();
    return user_agent.includes("firefox") && !user_agent.includes("seamonkey");
  },

  get_browser_name: function () {
    const user_agent = navigator.userAgent.toLowerCase();

    if (user_agent.includes("firefox") && !user_agent.includes("seamonkey")) {
      return "firefox";
    } else if (user_agent.includes("chrome") && !user_agent.includes("edg")) {
      return "chrome";
    } else if (user_agent.includes("edg")) {
      return "edge";
    } else if (user_agent.includes("safari") && !user_agent.includes("chrome")) {
      return "safari";
    } else if (user_agent.includes("opera") || user_agent.includes("opr")) {
      return "opera";
    }

    return "unknown";
  },
};
