/** Run the application bootstrap once the page DOM is available. */
export function startApp(bootstrap) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
    return;
  }

  bootstrap();
}
