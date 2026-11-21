export function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
}

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [
  ...root.querySelectorAll(selector),
];

export function bindIfPresent(selector, eventName, handler, root = document) {
  const element = root.querySelector(selector);
  if (!element) return null;
  element.addEventListener(eventName, handler);
  return element;
}
