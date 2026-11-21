import { $, $$, escapeHtml } from "./ui.js";

export const SLIDE_AUTOPLAY_MS = 3000;

export const heroQuotes = {
  Shillong: "A little mist, a lot of character.",
  "Dawki & Umngot": "Clear water, limestone and a slower day.",
  Kaziranga: "Grasslands wake with the wild.",
  Majuli: "Island mornings move to a different rhythm.",
  Tawang: "Monastery bells beneath high Himalayan skies.",
  "Ziro Valley": "Terraced fields shaped by Apatani heritage.",
  "Dzükōu Valley": "Walk into a valley that opens underfoot.",
  "Loktak Lake": "Floating islands drift with the light.",
  Reiek: "Forest trails meet a warm Mizo welcome.",
  Unakoti: "Ancient stone stories in a green hillside.",
  Gangtok: "Monastery bells, hillside lanes and mountain air.",
  Lachung: "A quiet village on the road into the high Himalaya.",
};

export function heroSlideImageUrls(slide) {
  const desktop = slide.photo.src;
  return { desktop, mobile: desktop.replace(/\.webp$/, "-hero-mobile.webp") };
}

export function nextSlideIndex(index, total, direction = 1) {
  if (!Number.isInteger(total) || total < 1) return 0;
  return (index + direction + total) % total;
}

export function initializeHeroSlideshow(slides, onOpenDestination) {
  let heroSlideIndex = 0,
    heroActiveLayer = "a",
    heroAutoplayTimer = 0,
    heroInteractionTimer = 0,
    heroRequestId = 0;
  const heroPauseReasons = new Set();
  function updateHeroSlideContent(slide) {
    $("#hero-slide-location").textContent = `${slide.name} · ${slide.state}`;
    $("#hero-slide-quote").textContent = slide.quote;
    $("#hero-slide-open").setAttribute(
      "aria-label",
      `Open ${slide.name}, ${slide.state} destination details`,
    );
    $("#hero-slide-credit").innerHTML =
      `Photo: <a href="${slide.photo.source}" target="_blank" rel="noopener noreferrer">${escapeHtml(slide.photo.author)}</a> · <a href="${slide.photo.licenseUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(slide.photo.license)}</a>${slide.photo.modification ? ` · ${escapeHtml(slide.photo.modification)}` : ""}`;
    $$("#hero-slide-dots button").forEach((dot, index) => {
      const active = index === heroSlideIndex;
      dot.classList.toggle("active", active);
      dot.setAttribute("aria-pressed", String(active));
      dot.setAttribute("aria-current", active ? "true" : "false");
    });
  }
  function preloadHeroImage(slide) {
    const urls = heroSlideImageUrls(slide),
      image = new Image();
    image.srcset = `${urls.mobile} 800w, ${urls.desktop} 1600w`;
    image.sizes = "(max-width: 650px) 100vw, 52vw";
    image.src = urls.desktop;
  }
  function setHeroSlide(index, { announce = true } = {}) {
    if (!slides.length) return;
    const nextIndex = (index + slides.length) % slides.length,
      slide = slides[nextIndex],
      urls = heroSlideImageUrls(slide),
      incomingLayer = heroActiveLayer === "a" ? "b" : "a",
      incoming = $(`#hero-image-${incomingLayer}`),
      requestId = ++heroRequestId;
    let settled = false;
    incoming.classList.remove("is-active");
    incoming.onload = null;
    incoming.onerror = null;
    incoming.onload = () => {
      if (settled || requestId !== heroRequestId) return;
      settled = true;
      $("#hero-slideshow").classList.remove("hero-photo-unavailable");
      $("#hero-image-retry")?.remove();
      incoming.classList.add("is-active");
      $(`#hero-image-${heroActiveLayer}`).classList.remove("is-active");
      heroActiveLayer = incomingLayer;
      heroSlideIndex = nextIndex;
      updateHeroSlideContent(slide);
      const next = slides[(nextIndex + 1) % slides.length];
      preloadHeroImage(next);
      if (announce)
        $("#hero-slideshow").setAttribute(
          "aria-label",
          `North East destinations. ${slide.name}, ${slide.state}. Slide ${nextIndex + 1} of ${slides.length}.`,
        );
    };
    incoming.onerror = () => {
      if (!settled && requestId === heroRequestId) {
        settled = true;
        showHeroImageRetry(nextIndex);
        console.warn(
          `Hero photograph could not be loaded for ${slide.name}; keeping the current slide.`,
        );
        if (
          !$("#hero-image-a").naturalWidth &&
          !$("#hero-image-b").naturalWidth
        )
          $("#hero-slideshow").classList.add("hero-photo-unavailable");
      }
    };
    incoming.setAttribute(
      "srcset",
      `${urls.mobile} 800w, ${urls.desktop} 1600w`,
    );
    incoming.setAttribute("sizes", "(max-width: 650px) 100vw, 52vw");
    incoming.src = urls.desktop;
    if (incoming.complete && incoming.naturalWidth) incoming.onload();
  }
  function pauseHeroAutoplay(reason) {
    heroPauseReasons.add(reason);
    clearTimeout(heroAutoplayTimer);
    heroAutoplayTimer = 0;
  }
  function scheduleHeroAutoplay() {
    clearTimeout(heroAutoplayTimer);
    if (
      heroPauseReasons.size ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    heroAutoplayTimer = setTimeout(() => {
      setHeroSlide(heroSlideIndex + 1);
      scheduleHeroAutoplay();
    }, SLIDE_AUTOPLAY_MS);
  }
  function showHeroImageRetry(index) {
    const region = $("#hero-slideshow");
    if (!region) return;
    const existing = $("#hero-image-retry");
    if (existing) {
      existing.disabled = false;
      existing.textContent = "Retry photo";
      return;
    }
    region.classList.add("hero-photo-unavailable");
    const button = document.createElement("button");
    button.type = "button";
    button.id = "hero-image-retry";
    button.className = "hero-image-retry";
    button.textContent = "Retry photo";
    button.setAttribute("aria-label", "Retry loading the destination photo");
    button.addEventListener("click", () => {
      button.disabled = true;
      button.textContent = "Loading photo…";
      setHeroSlide(index);
    });
    region.appendChild(button);
  }
  function markHeroInteraction() {
    pauseHeroAutoplay("interaction");
    clearTimeout(heroInteractionTimer);
    heroInteractionTimer = setTimeout(() => {
      heroPauseReasons.delete("interaction");
      scheduleHeroAutoplay();
    }, 7000);
  }
  function startSlideshow() {
    const region = $("#hero-slideshow");
    if (!region || !slides.length) return;
    const initial = slides[heroSlideIndex],
      urls = heroSlideImageUrls(initial),
      image = $("#hero-image-a");
    image.onerror = () => {
      if (!image.naturalWidth) showHeroImageRetry(heroSlideIndex);
    };
    image.onload = () => region.classList.remove("hero-photo-unavailable");
    image.srcset = `${urls.mobile} 800w, ${urls.desktop} 1600w`;
    image.sizes = "(max-width: 650px) 100vw, 52vw";
    image.src = urls.desktop;
    updateHeroSlideContent(initial);
    $("#hero-slide-dots").innerHTML = slides
      .map(
        (slide, index) =>
          `<button type="button" aria-label="Show ${escapeHtml(slide.name)}, ${escapeHtml(slide.state)}" aria-pressed="${index === heroSlideIndex}" aria-current="${index === heroSlideIndex ? "true" : "false"}" class="${index === heroSlideIndex ? "active" : ""}" data-hero-index="${index}"></button>`,
      )
      .join("");
    $("#hero-slide-prev").addEventListener("click", () => {
      markHeroInteraction();
      setHeroSlide(heroSlideIndex - 1);
    });
    $("#hero-slide-next").addEventListener("click", () => {
      markHeroInteraction();
      setHeroSlide(heroSlideIndex + 1);
    });
    $("#hero-slide-dots").addEventListener("click", (event) => {
      const dot = event.target.closest("[data-hero-index]");
      if (dot) {
        markHeroInteraction();
        setHeroSlide(Number(dot.dataset.heroIndex));
      }
    });
    $("#hero-slide-open").addEventListener("click", () => {
      markHeroInteraction();
      onOpenDestination(slides[heroSlideIndex].name);
    });
    region.addEventListener("keydown", (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        markHeroInteraction();
        setHeroSlide(heroSlideIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        markHeroInteraction();
        setHeroSlide(heroSlideIndex + 1);
      }
    });
    let touchStart = null;
    region.addEventListener(
      "touchstart",
      (event) => {
        if (event.touches.length === 1)
          touchStart = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
          };
      },
      { passive: true },
    );
    region.addEventListener(
      "touchend",
      (event) => {
        if (!touchStart) return;
        const dx = event.changedTouches[0].clientX - touchStart.x,
          dy = event.changedTouches[0].clientY - touchStart.y;
        touchStart = null;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
          markHeroInteraction();
          setHeroSlide(heroSlideIndex + (dx < 0 ? 1 : -1));
        }
      },
      { passive: true },
    );
    region.addEventListener("mouseenter", () => pauseHeroAutoplay("hover"));
    region.addEventListener("mouseleave", () => {
      heroPauseReasons.delete("hover");
      scheduleHeroAutoplay();
    });
    region.addEventListener("focusin", () => pauseHeroAutoplay("focus"));
    region.addEventListener("focusout", (event) => {
      if (!region.contains(event.relatedTarget)) {
        heroPauseReasons.delete("focus");
        scheduleHeroAutoplay();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) pauseHeroAutoplay("hidden");
      else {
        heroPauseReasons.delete("hidden");
        scheduleHeroAutoplay();
      }
    });
    const motionPreference = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ),
      syncMotion = () => {
        if (motionPreference.matches) pauseHeroAutoplay("reduced-motion");
        else {
          heroPauseReasons.delete("reduced-motion");
          scheduleHeroAutoplay();
        }
      };
    syncMotion();
    motionPreference.addEventListener?.("change", syncMotion);
    preloadHeroImage(slides[(heroSlideIndex + 1) % slides.length]);
    scheduleHeroAutoplay();
  }
  startSlideshow();
}
