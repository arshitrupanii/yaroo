const LOGO_PATHS = {
  bubble:
    "M16 17h32c5.5 0 10 4.2 10 9.4v13.2c0 5.2-4.5 9.4-10 9.4H34.9l-9.5 7.2c-1.7 1.3-4.1.1-4.1-2.1V49H16c-5.5 0-10-4.2-10-9.4V26.4C6 21.2 10.5 17 16 17Z",
  check: "M20.5 27.5 31.9 39 43.5 27.5",
  stem: "M32 39v7.5",
};

const getColorFromTheme = (theme, className) => {
  const probe = document.createElement("span");
  probe.dataset.theme = theme;
  probe.className = "fixed pointer-events-none invisible";
  probe.innerHTML = `<span class="${className}"></span>`;
  document.body.appendChild(probe);

  const colorNode = probe.firstElementChild;
  colorNode.style.display = "block";
  colorNode.style.width = "1px";
  colorNode.style.height = "1px";

  const color = window.getComputedStyle(colorNode).backgroundColor;
  probe.remove();

  return color;
};

const buildFaviconSvg = ({ primary, primaryContent, success, base }) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="${primary}"/>
  <path d="${LOGO_PATHS.bubble}" fill="${primaryContent}"/>
  <path d="${LOGO_PATHS.check}" fill="none" stroke="${primary}" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${LOGO_PATHS.stem}" fill="none" stroke="${primary}" stroke-width="5.2" stroke-linecap="round"/>
  <circle cx="50" cy="14" r="7" fill="${success}" stroke="${base}" stroke-width="3"/>
</svg>`;

export const updateThemeBrand = (theme) => {
  if (typeof document === "undefined" || !document.body) return;

  const colors = {
    primary: getColorFromTheme(theme, "bg-primary"),
    primaryContent: getColorFromTheme(theme, "bg-primary-content"),
    success: getColorFromTheme(theme, "bg-success"),
    base: getColorFromTheme(theme, "bg-base-100"),
  };

  const favicon = document.querySelector("#theme-favicon") || document.querySelector("link[rel='icon']");
  const themeColor = document.querySelector("#theme-color");

  if (favicon) {
    favicon.setAttribute("href", `data:image/svg+xml,${encodeURIComponent(buildFaviconSvg(colors))}`);
  }

  if (themeColor) {
    themeColor.setAttribute("content", colors.primary);
  }
};
