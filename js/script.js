/**
 * Horní Hrad — hlavní skript
 * GSAP · ScrollTrigger · Lenis
 */

(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({
    lerp: 0.08,
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.5,
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add(function (time) {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  ScrollTrigger.defaults({
    markers: false,
  });

  function initFogVideo(video) {
    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    if (video.classList.contains("history-scene__bg--video-slide2")) {
      video.pause();
      return;
    }

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        window.addEventListener(
          "pointerdown",
          function startFogVideo() {
            video.play();
          },
          { once: true }
        );
      });
    }
  }

  function initFogVideos(container) {
    if (!container) return;
    container.querySelectorAll("video").forEach(initFogVideo);
  }

  /**
   * Úvodní hero scéna — přiblížení, mlha, druhý slide s navigací
   */
  function initHeroFogScene() {
    const scene = document.querySelector(".hero-fog-scene");
    if (!scene) return null;

    const layerBg = scene.querySelector(".layer-bg");
    const layerCastle = scene.querySelector(".layer-castle");
    const layerFogDepth = scene.querySelector(".layer-fog-depth");
    const videoFogDepth = scene.querySelector(".video-fog-depth");
    const layerFog = scene.querySelector(".layer-fog-overlay");
    const videoFog = scene.querySelector(".video-fog");
    const videoFogPath = scene.querySelector(".video-fog-path");
    const heroIntro = scene.querySelector(".hero-intro");
    const heroScrollDown = scene.querySelector(".hero-scroll-down");
    const pathSlide = scene.querySelector(".path-slide");
    const pathSlideInner = scene.querySelector(".path-slide__inner");
    const layerCastleImg = scene.querySelector(".layer-castle__img");

    let castleFogPulse = null;
    let castleFogPulseActive = false;

    initFogVideos(scene);

    gsap.set(heroIntro, { xPercent: -50, yPercent: -50, opacity: 1, y: 0 });
    gsap.set(pathSlide, { opacity: 0 });
    gsap.set(pathSlideInner, { opacity: 0, y: 28 });

    function getHeroScrollProgress() {
      return scrollTimeline.scrollTrigger
        ? scrollTimeline.scrollTrigger.progress
        : 0;
    }

    function heroTweenValue(progress, start, duration, from, to) {
      if (progress <= start) return from;
      if (progress >= start + duration) return to;
      const t = (progress - start) / duration;
      return from + (to - from) * t;
    }

    function heroSmoothstep(t) {
      const clamped = Math.min(Math.max(t, 0), 1);
      return clamped * clamped * (3 - 2 * clamped);
    }

    const CASTLE_FADE_START = 0.68;
    const CASTLE_FADE_END = 0.88;
    const CASTLE_FADE_DURATION = CASTLE_FADE_END - CASTLE_FADE_START;
    const MENU_TRANSITION_SOUND_AT = 0.54;

    function syncHeroVisualLayers(progress) {
      const layerBgScale = heroTweenValue(progress, 0, 0.72, 1, 1.28);
      const layerBgOpacity = heroTweenValue(progress, 0.28, 0.4, 1, 0);
      const layerFogDepthScale = heroTweenValue(progress, 0, 0.72, 1, 1.14);
      const layerFogScaleEarly = heroTweenValue(progress, 0.16, 0.48, 1, 1.12);
      const layerFogScaleLate = heroTweenValue(progress, 0.58, 0.35, 1.12, 1.06);
      const layerFogScale = progress < 0.58 ? layerFogScaleEarly : layerFogScaleLate;

      let videoFogOpacity = heroTweenValue(progress, 0.12, 0.52, 0.3, 1);
      if (progress >= 0.58) {
        videoFogOpacity = heroTweenValue(progress, 0.58, 0.35, 1, 0.38);
      }

      const videoFogDepthOpacity = heroTweenValue(progress, 0.32, 0.35, 0.38, 0);
      const videoFogPathOpacity = heroTweenValue(progress, 0.76, 0.24, 0, 0.22);
      const sceneBgProgress = heroTweenValue(progress, 0.58, 0.35, 0, 1);
      const castleRawT = heroTweenValue(
        progress,
        CASTLE_FADE_START,
        CASTLE_FADE_DURATION,
        0,
        1
      );
      const castleT = heroSmoothstep(castleRawT);
      const castleOpacity = castleT;
      const castleScale = gsap.utils.interpolate(1.12, 1.06, castleT);
      const castleImgOpacity = gsap.utils.interpolate(0.72, 1, castleT);
      const castleImgBrightness = gsap.utils.interpolate(0.72, 0.78, castleT);
      const castleFogBoost = gsap.utils.interpolate(0, 0.22, castleT);

      gsap.set(layerBg, { opacity: layerBgOpacity, scale: layerBgScale });
      gsap.set(layerFogDepth, { scale: layerFogDepthScale });
      gsap.set(layerFog, { scale: layerFogScale });
      gsap.set(videoFogDepth, { opacity: videoFogDepthOpacity });

      if (!castleFogPulse) {
        gsap.set(videoFog, {
          opacity: videoFogOpacity + castleFogBoost * 0.35,
        });
        gsap.set(videoFogPath, {
          opacity: videoFogPathOpacity + castleFogBoost,
        });
      }
      gsap.set(scene, {
        backgroundColor: gsap.utils.interpolate("#0d0f12", "#1a1f26", sceneBgProgress),
      });

      if (!castleFogPulse) {
        gsap.set(layerCastle, {
          opacity: castleOpacity,
          scale: castleScale,
          visibility: castleOpacity > 0.01 ? "visible" : "hidden",
        });

        if (layerCastleImg) {
          if (castleT <= 0) {
            gsap.set(layerCastleImg, { opacity: 0, clearProps: "filter" });
          } else {
            gsap.set(layerCastleImg, {
              opacity: castleImgOpacity,
              filter: `brightness(${castleImgBrightness}) contrast(1.06)`,
            });
          }
        }
      }
    }

    function syncHeroSceneFromProgress(progress) {
      syncHeroVisualLayers(progress);
      syncHeroTextLayers(progress);
    }

    function syncHeroTextLayers(progress) {
      const introFadeEnd = 0.32;
      const pathFadeStart = 0.68;
      const pathFadeEnd = 0.88;

      let introOpacity = 0;
      let introY = -16;
      if (progress <= introFadeEnd) {
        const introT = progress / introFadeEnd;
        introOpacity = 1 - introT;
        introY = -16 * introT;
      }

      let pathOpacity = 0;
      let pathInnerY = 28;
      if (progress >= pathFadeStart) {
        const pathT = Math.min(
          (progress - pathFadeStart) / (pathFadeEnd - pathFadeStart),
          1
        );
        pathOpacity = pathT;
        pathInnerY = 28 * (1 - pathT);
      }

      gsap.set(heroIntro, {
        opacity: introOpacity,
        y: introY,
        visibility: introOpacity > 0.02 ? "visible" : "hidden",
      });
      gsap.set(pathSlide, {
        opacity: pathOpacity,
        visibility: pathOpacity > 0.02 ? "visible" : "hidden",
        pointerEvents: pathOpacity > 0.45 ? "auto" : "none",
      });
      gsap.set(pathSlideInner, {
        opacity: pathOpacity,
        y: pathInnerY,
      });
      pathSlide.setAttribute(
        "aria-hidden",
        pathOpacity < 0.35 ? "true" : "false"
      );
    }
    gsap.set(layerCastle, { opacity: 0, scale: 1.12 });
    gsap.set(videoFogPath, { opacity: 0 });

    function stopCastleFogPulse() {
      if (castleFogPulse) {
        castleFogPulse.kill();
        castleFogPulse = null;
      }
      gsap.killTweensOf([videoFog, videoFogPath, layerCastle, layerCastleImg]);
    }

    function startCastleFogPulse() {
      if (castleFogPulse || !layerCastleImg) return;

      castleFogPulse = gsap.timeline({ repeat: -1 });
      castleFogPulse
        .to(layerCastle, { opacity: 0.58, duration: 4.2, ease: "sine.inOut" }, 0)
        .to(
          layerCastleImg,
          {
            opacity: 0.72,
            filter: "brightness(0.72) contrast(1.04)",
            duration: 4.2,
            ease: "sine.inOut",
          },
          0
        )
        .to(videoFogPath, { opacity: 0.3, duration: 4.2, ease: "sine.inOut" }, 0)
        .to(videoFog, { opacity: 0.62, duration: 4.2, ease: "sine.inOut" }, 0)
        .to(layerCastle, { opacity: 0.96, duration: 5.8, ease: "sine.inOut" })
        .to(
          layerCastleImg,
          {
            opacity: 1,
            filter: "brightness(0.78) contrast(1.06)",
            duration: 5.8,
            ease: "sine.inOut",
          },
          "<"
        )
        .to(videoFogPath, { opacity: 0.16, duration: 5.8, ease: "sine.inOut" }, "<")
        .to(videoFog, { opacity: 0.34, duration: 5.8, ease: "sine.inOut" }, "<")
        .to(layerCastle, { opacity: 0.64, duration: 3.6, ease: "sine.inOut" })
        .to(
          layerCastleImg,
          {
            opacity: 0.78,
            filter: "brightness(0.74) contrast(1.05)",
            duration: 3.6,
            ease: "sine.inOut",
          },
          "<"
        )
        .to(videoFogPath, { opacity: 0.26, duration: 3.6, ease: "sine.inOut" }, "<")
        .to(videoFog, { opacity: 0.56, duration: 3.6, ease: "sine.inOut" }, "<")
        .to(layerCastle, { opacity: 1, duration: 6.4, ease: "sine.inOut" })
        .to(
          layerCastleImg,
          {
            opacity: 1,
            filter: "brightness(0.78) contrast(1.06)",
            duration: 6.4,
            ease: "sine.inOut",
          },
          "<"
        )
        .to(videoFogPath, { opacity: 0.2, duration: 6.4, ease: "sine.inOut" }, "<")
        .to(videoFog, { opacity: 0.38, duration: 6.4, ease: "sine.inOut" }, "<");
    }

    function maybeStartCastleFogPulse() {
      if (castleFogPulseActive || castleFogPulse) return;
      castleFogPulseActive = true;
      startCastleFogPulse();
    }

    const menuTransitionAudio = new Audio("assets/menu-transition.mp3");
    menuTransitionAudio.preload = "auto";
    menuTransitionAudio.volume = 0.72;

    let lastHeroScrollProgress = 0;
    let menuTransitionArmed = true;

    function playMenuTransitionSound() {
      menuTransitionAudio.currentTime = 0;
      const playPromise = menuTransitionAudio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    }

    const scrollTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: scene,
        start: "top top",
        end: "+=165%",
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        onUpdate: function (self) {
          const progress = self.progress;

          if (
            menuTransitionArmed &&
            lastHeroScrollProgress < MENU_TRANSITION_SOUND_AT &&
            progress >= MENU_TRANSITION_SOUND_AT
          ) {
            playMenuTransitionSound();
            menuTransitionArmed = false;
          }

          if (progress < MENU_TRANSITION_SOUND_AT - 0.06) {
            menuTransitionArmed = true;
          }

          lastHeroScrollProgress = progress;
          syncHeroSceneFromProgress(progress);

          if (heroScrollDown) {
            heroScrollDown.classList.toggle("is-visible", progress < 0.22);
          }

          if (progress >= CASTLE_FADE_END) {
            maybeStartCastleFogPulse();
          } else {
            if (castleFogPulse || castleFogPulseActive) {
              stopCastleFogPulse();
              castleFogPulseActive = false;
              syncHeroVisualLayers(progress);
            }
          }
        },
      },
    });

    syncHeroSceneFromProgress(0);

    scrollTimeline
      .to(
        layerBg,
        {
          scale: 1.28,
          ease: "power1.in",
          duration: 0.72,
        },
        0
      )
      .to(
        layerFogDepth,
        {
          scale: 1.14,
          ease: "power1.in",
          duration: 0.72,
        },
        0
      )
      .to(
        videoFog,
        {
          opacity: 1,
          ease: "power2.in",
          duration: 0.52,
        },
        0.12
      )
      .to(
        layerFog,
        {
          scale: 1.12,
          ease: "power2.in",
          duration: 0.48,
        },
        0.16
      )
      .to(
        layerBg,
        {
          opacity: 0,
          ease: "power2.in",
          duration: 0.4,
        },
        0.28
      )
      .to(
        videoFogDepth,
        {
          opacity: 0,
          ease: "power2.in",
          duration: 0.35,
        },
        0.32
      )
      .to(
        videoFog,
        {
          opacity: 0.38,
          ease: "power2.inOut",
          duration: 0.35,
        },
        0.58
      )
      .to(
        scene,
        {
          backgroundColor: "#1a1f26",
          ease: "power2.inOut",
          duration: 0.35,
        },
        0.58
      )
      .to(
        layerFog,
        {
          scale: 1.06,
          ease: "power2.inOut",
          duration: 0.35,
        },
        0.58
      )
      .to(
        videoFogPath,
        {
          opacity: 0.22,
          ease: "power2.out",
          duration: 0.24,
        },
        0.76
      )
      .addLabel("pathSlideReady", 1);

    return {
      scene: scene,
      layerBg: layerBg,
      layerCastle: layerCastle,
      layerFogDepth: layerFogDepth,
      layerFog: layerFog,
      videoFogDepth: videoFogDepth,
      videoFog: videoFog,
      videoFogPath: videoFogPath,
      pathSlide: pathSlide,
      pathSlideInner: pathSlideInner,
      scrollTimeline: scrollTimeline,
      syncHeroTextLayers: syncHeroTextLayers,
      syncHeroVisualLayers: syncHeroVisualLayers,
      syncHeroSceneFromProgress: syncHeroSceneFromProgress,
      getScrollProgress: getHeroScrollProgress,
      startCastleFogPulse: startCastleFogPulse,
      stopCastleFogPulse: stopCastleFogPulse,
    };
  }

  /**
   * Přechod z menu — mlha se stáhne, kamera najede, mlha se rozestoupí, pak obsah
   */
  function initCategoryFogBridge(heroApi) {
    if (!heroApi) {
      return {
        playEnter: function (onFogPeak) {
          if (typeof onFogPeak === "function") {
            onFogPeak();
          }
        },
        playExit: function (onComplete) {
          if (typeof onComplete === "function") {
            onComplete();
          }
        },
        isBusy: function () {
          return false;
        },
      };
    }

    const {
      scene,
      layerBg,
      layerCastle,
      layerFogDepth,
      layerFog,
      videoFogDepth,
      videoFog,
      videoFogPath,
      pathSlide,
      pathSlideInner,
      syncHeroTextLayers,
      syncHeroSceneFromProgress,
      getScrollProgress,
      stopCastleFogPulse,
    } = heroApi;

    const heroCategoryVeil = scene.querySelector(".hero-category-fog-veil");
    const FOG_EASE = "power1.inOut";
    const ENTER_CONVERGE = 1.25;
    const ENTER_HOLD = 0.18;
    const ENTER_PART = 1.05;

    let busy = false;
    let savedHeroState = null;

    function captureHeroState() {
      return {
        sceneScale: gsap.getProperty(scene, "scale") || 1,
        sceneBg: gsap.getProperty(scene, "backgroundColor") || "#1a1f26",
        layerFogScale: gsap.getProperty(layerFog, "scale") || 1,
        videoFogOpacity: gsap.getProperty(videoFog, "opacity") ?? 0.38,
        videoFogPathOpacity: gsap.getProperty(videoFogPath, "opacity") ?? 0.22,
        layerFogDepthScale: gsap.getProperty(layerFogDepth, "scale") || 1,
        videoFogDepthOpacity: gsap.getProperty(videoFogDepth, "opacity") ?? 0,
        layerCastleOpacity: gsap.getProperty(layerCastle, "opacity") ?? 1,
        layerBgOpacity: gsap.getProperty(layerBg, "opacity") ?? 0,
        pathSlideOpacity: gsap.getProperty(pathSlide, "opacity") ?? 1,
        pathSlideInnerOpacity: gsap.getProperty(pathSlideInner, "opacity") ?? 1,
        pathSlideInnerY: gsap.getProperty(pathSlideInner, "y") ?? 0,
      };
    }

    function restoreHeroState() {
      if (!savedHeroState) return;
      const state = savedHeroState;
      const progress =
        typeof getScrollProgress === "function" ? getScrollProgress() : 1;

      gsap.set(scene, { scale: state.sceneScale });
      gsap.set(layerCastle, { opacity: state.layerCastleOpacity });

      scene.classList.remove("is-category-rush", "is-category-rush--dark");
      if (heroCategoryVeil) {
        gsap.set(heroCategoryVeil, { opacity: 0 });
      }

      if (typeof syncHeroSceneFromProgress === "function") {
        syncHeroSceneFromProgress(progress);
      } else if (typeof syncHeroTextLayers === "function") {
        syncHeroTextLayers(progress);
        gsap.set(layerBg, { opacity: state.layerBgOpacity });
        gsap.set(layerFog, { scale: state.layerFogScale });
        gsap.set(videoFog, { opacity: state.videoFogOpacity });
        gsap.set(videoFogPath, { opacity: state.videoFogPathOpacity });
        gsap.set(layerFogDepth, { scale: state.layerFogDepthScale });
        gsap.set(videoFogDepth, { opacity: state.videoFogDepthOpacity });
        gsap.set(scene, { backgroundColor: state.sceneBg });
      }
    }

    function playEnter(onFogPeak) {
      if (busy) return;
      busy = true;
      savedHeroState = captureHeroState();

      if (typeof stopCastleFogPulse === "function") {
        stopCastleFogPulse();
      }

      gsap.killTweensOf([
        scene,
        layerBg,
        layerCastle,
        layerFogDepth,
        layerFog,
        videoFogDepth,
        videoFog,
        videoFogPath,
        pathSlide,
        pathSlideInner,
        heroCategoryVeil,
      ]);

      scene.classList.add("is-category-rush", "is-category-rush--dark");
      pathSlide.style.pointerEvents = "none";

      if (heroCategoryVeil) {
        gsap.set(heroCategoryVeil, { opacity: 0 });
      }

      const tl = gsap.timeline({
        onComplete: function () {
          scene.classList.remove("is-category-rush--dark");
          busy = false;
        },
      });

      const convergeStart = 0.12;

      tl.to(pathSlideInner, {
        opacity: 0,
        y: -10,
        duration: 0.55,
        ease: FOG_EASE,
      })
        .to(pathSlide, { opacity: 0, duration: 0.5, ease: FOG_EASE }, 0.1)
        .to(
          scene,
          {
            scale: 1.12,
            duration: ENTER_CONVERGE,
            ease: FOG_EASE,
            transformOrigin: "50% 40%",
          },
          convergeStart
        )
        .to(
          layerFog,
          { scale: 1.4, duration: ENTER_CONVERGE, ease: FOG_EASE },
          convergeStart
        )
        .to(
          videoFog,
          { opacity: 0.58, duration: ENTER_CONVERGE, ease: FOG_EASE },
          convergeStart
        )
        .to(
          videoFogPath,
          { opacity: 0.42, duration: ENTER_CONVERGE, ease: FOG_EASE },
          convergeStart
        )
        .to(
          layerFogDepth,
          { scale: 1.26, duration: ENTER_CONVERGE, ease: FOG_EASE },
          convergeStart
        )
        .to(
          videoFogDepth,
          { opacity: 0.52, duration: ENTER_CONVERGE, ease: FOG_EASE },
          convergeStart
        )
        .to(
          heroCategoryVeil,
          { opacity: 1, duration: ENTER_CONVERGE * 0.92, ease: FOG_EASE },
          convergeStart + 0.08
        )
        .to(
          layerBg,
          { opacity: 0, scale: 1.28, duration: ENTER_CONVERGE * 0.75, ease: FOG_EASE },
          convergeStart + 0.1
        )
        .to(
          layerCastle,
          { opacity: 0, duration: ENTER_CONVERGE * 0.7, ease: FOG_EASE },
          convergeStart + 0.15
        )
        .to(
          scene,
          { backgroundColor: "#020304", duration: ENTER_CONVERGE, ease: FOG_EASE },
          convergeStart
        )
        .to({}, { duration: ENTER_HOLD })
        .addLabel("peak")
        .add(function () {
          if (typeof onFogPeak === "function") {
            onFogPeak();
          }
        }, "peak")
        .to(
          heroCategoryVeil,
          { opacity: 0, duration: ENTER_PART, ease: FOG_EASE },
          "peak"
        )
        .to(
          videoFog,
          {
            opacity: savedHeroState ? savedHeroState.videoFogOpacity : 0,
            duration: ENTER_PART,
            ease: FOG_EASE,
          },
          "peak+=0.06"
        )
        .to(
          videoFogPath,
          {
            opacity: savedHeroState ? savedHeroState.videoFogPathOpacity : 0,
            duration: ENTER_PART,
            ease: FOG_EASE,
          },
          "peak+=0.06"
        )
        .to(
          videoFogDepth,
          {
            opacity: savedHeroState ? savedHeroState.videoFogDepthOpacity : 0,
            duration: ENTER_PART,
            ease: FOG_EASE,
          },
          "peak+=0.08"
        )
        .to(
          layerFog,
          {
            scale: savedHeroState ? savedHeroState.layerFogScale : 1,
            duration: ENTER_PART,
            ease: FOG_EASE,
          },
          "peak+=0.06"
        )
        .to(
          layerFogDepth,
          {
            scale: savedHeroState ? savedHeroState.layerFogDepthScale : 1,
            duration: ENTER_PART,
            ease: FOG_EASE,
          },
          "peak+=0.06"
        )
        .to(
          scene,
          {
            scale: savedHeroState ? savedHeroState.sceneScale : 1,
            backgroundColor: savedHeroState ? savedHeroState.sceneBg : "#1a1f26",
            duration: ENTER_PART,
            ease: FOG_EASE,
          },
          "peak+=0.1"
        );
    }

    function playExit(onComplete) {
      if (busy) {
        if (typeof onComplete === "function") {
          onComplete();
        }
        return;
      }

      busy = true;
      scene.classList.add("is-category-rush", "is-category-rush--dark");

      gsap.killTweensOf([
        scene,
        layerFog,
        videoFog,
        videoFogPath,
        layerFogDepth,
        videoFogDepth,
        pathSlide,
        pathSlideInner,
        heroCategoryVeil,
      ]);

      if (heroCategoryVeil) {
        gsap.set(heroCategoryVeil, { opacity: 0 });
      }

      const tl = gsap.timeline({
        onComplete: function () {
          restoreHeroState();
          busy = false;
          if (typeof onComplete === "function") {
            onComplete();
          }
        },
      });

      tl.to(videoFog, { opacity: 0.5, duration: 0.55, ease: FOG_EASE }, 0)
        .to(videoFogPath, { opacity: 0.38, duration: 0.55, ease: FOG_EASE }, 0)
        .to(layerFog, { scale: 1.32, duration: 0.58, ease: FOG_EASE }, 0)
        .to(scene, { scale: 1.06, duration: 0.58, ease: FOG_EASE }, 0)
        .to(
          heroCategoryVeil,
          { opacity: 1, duration: 0.58, ease: FOG_EASE },
          0.03
        )
        .to(scene, { backgroundColor: "#020304", duration: 0.55, ease: FOG_EASE }, 0.05)
        .to({}, { duration: 0.12 })
        .to(heroCategoryVeil, { opacity: 0, duration: 0.75, ease: FOG_EASE })
        .to(videoFog, {
          opacity: savedHeroState ? savedHeroState.videoFogOpacity : 0.38,
          duration: 0.78,
          ease: FOG_EASE,
        }, "-=0.68")
        .to(
          videoFogPath,
          {
            opacity: savedHeroState ? savedHeroState.videoFogPathOpacity : 0.22,
            duration: 0.75,
            ease: FOG_EASE,
          },
          "-=0.72"
        )
        .to(
          layerFog,
          {
            scale: savedHeroState ? savedHeroState.layerFogScale : 1.06,
            duration: 0.78,
            ease: FOG_EASE,
          },
          "-=0.72"
        )
        .to(
          scene,
          {
            scale: savedHeroState ? savedHeroState.sceneScale : 1,
            backgroundColor: savedHeroState ? savedHeroState.sceneBg : "#1a1f26",
            duration: 0.82,
            ease: FOG_EASE,
          },
          "-=0.68"
        )
        .to(pathSlide, { opacity: 1, duration: 0.38, ease: FOG_EASE }, "-=0.35")
        .to(
          pathSlideInner,
          {
            opacity: 1,
            y: savedHeroState ? savedHeroState.pathSlideInnerY : 0,
            duration: 0.42,
            ease: FOG_EASE,
          },
          "-=0.32"
        );
    }

    return {
      playEnter: playEnter,
      playExit: playExit,
      isBusy: function () {
        return busy;
      },
    };
  }

  /**
   * Klik na Historie — tma a vynoření scény
   */
  function initParchmentHistorie(lenisInstance, fogBridge) {
    const link = document.querySelector(".path-slide__link--historie");
    const overlay = document.getElementById("parchment-overlay");
    if (!link || !overlay) return;

    const sceneVideo = overlay.querySelector(".history-scene__bg--video");
    const sceneVideoSlide2 = overlay.querySelector(".history-scene__bg--video-slide2");
    const sceneLightWaves = overlay.querySelector(".history-scene__light-waves");
    const sceneVeil = overlay.querySelector(".history-scene__veil");
    const panel = overlay.querySelector(".parchment-overlay__panel");
    const contentSlide1 = overlay.querySelector(".parchment-overlay__content--slide1");
    const contentSlide2 = overlay.querySelector(".parchment-overlay__content--slide2");
    let isOpen = false;
    let isAnimating = false;
    let scrollEnabled = false;
    let isOnSlide2 = false;
    let historyTransition = null;

    initFogVideos(overlay);

    function resetHistoryScrollState() {
      overlay.classList.remove("is-scrollable", "is-history-slide-2");
      scrollEnabled = false;
      isOnSlide2 = false;

      if (historyTransition) {
        historyTransition.kill();
        historyTransition = null;
      }

      gsap.set(sceneVideo, { clearProps: "opacity,transform" });
      gsap.set(sceneVideoSlide2, { clearProps: "opacity,transform" });
      if (sceneVideoSlide2) {
        sceneVideoSlide2.pause();
        sceneVideoSlide2.currentTime = 0;
      }
      gsap.set(sceneLightWaves, { clearProps: "opacity" });
      gsap.set(contentSlide1, { clearProps: "opacity" });
      gsap.set(contentSlide2, { clearProps: "opacity" });
      gsap.set(panel, { clearProps: "opacity,transform" });
    }

    function enableHistoryScroll() {
      overlay.classList.add("is-scrollable");
      scrollEnabled = true;
    }

    function playHistorySlide2() {
      if (isOnSlide2 || !scrollEnabled || historyTransition) return;

      scrollEnabled = false;

      historyTransition = gsap
        .timeline({
          onComplete: function () {
            isOnSlide2 = true;
            historyTransition = null;
            scrollEnabled = true;
            overlay.classList.add("is-history-slide-2");
            gsap.set(sceneVideoSlide2, { scale: 1, clearProps: "transform" });
            if (sceneVideo) {
              sceneVideo.pause();
            }
            if (sceneVideoSlide2) {
              sceneVideoSlide2.currentTime = 0;
              sceneVideoSlide2.play();
            }
          },
        })
        .to(contentSlide1, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.in",
        })
        .to(
          sceneVideo,
          {
            opacity: 0,
            scale: 1.06,
            duration: 1.1,
            ease: "power2.inOut",
          },
          0.1
        )
        .fromTo(
          sceneVideoSlide2,
          { opacity: 0, scale: 1.03 },
          {
            opacity: 1,
            scale: 1,
            duration: 1.35,
            ease: "power2.out",
          },
          0.35
        )
        .fromTo(
          sceneLightWaves,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1.5,
            ease: "power2.out",
          },
          0.5
        )
        .fromTo(
          contentSlide2,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.75,
            ease: "power2.out",
          },
          0.85
        );
    }

    function playHistorySlide1() {
      if (!isOnSlide2 || !scrollEnabled || historyTransition) return;

      scrollEnabled = false;
      overlay.classList.remove("is-history-slide-2");

      if (sceneVideoSlide2) {
        sceneVideoSlide2.pause();
      }
      if (sceneVideo) {
        sceneVideo.play();
      }

      historyTransition = gsap
        .timeline({
          onComplete: function () {
            isOnSlide2 = false;
            historyTransition = null;
            scrollEnabled = true;
          },
        })
        .to(sceneVideoSlide2, {
          opacity: 0,
          scale: 1.05,
          duration: 0.85,
          ease: "power2.in",
        })
        .to(
          contentSlide2,
          {
            opacity: 0,
            duration: 0.45,
            ease: "power2.in",
          },
          0
        )
        .to(
          sceneLightWaves,
          {
            opacity: 0,
            duration: 0.55,
            ease: "power2.in",
          },
          0
        )
        .to(
          sceneVideo,
          {
            opacity: 1,
            scale: 1,
            duration: 1.1,
            ease: "power2.out",
          },
          0.2
        )
        .to(
          contentSlide1,
          {
            opacity: 1,
            duration: 0.65,
            ease: "power2.out",
          },
          0.45
        );
    }

    function onHistoryWheel(event) {
      if (!scrollEnabled || historyTransition || !overlay.classList.contains("is-ready")) return;

      if (event.deltaY > 0 && !isOnSlide2) {
        event.preventDefault();
        event.stopPropagation();
        playHistorySlide2();
        return;
      }

      if (event.deltaY < 0) {
        event.preventDefault();
        event.stopPropagation();
        if (isOnSlide2) {
          playHistorySlide1();
        } else {
          closeParchment();
        }
      }
    }

    function revealParchment() {
      isAnimating = true;
      isOpen = true;
      resetHistoryScrollState();

      if (lenisInstance && typeof lenisInstance.stop === "function") {
        lenisInstance.stop();
      }

      overlay.hidden = false;
      overlay.setAttribute("aria-hidden", "false");
      overlay.classList.add("is-active");
      overlay.classList.remove("is-ready");
      document.body.classList.add("parchment-open");

      gsap.set(sceneVideo, { opacity: 0, scale: 1.05 });
      gsap.set(sceneVideoSlide2, { opacity: 0, scale: 1.05 });
      gsap.set(sceneLightWaves, { opacity: 0 });
      gsap.set(sceneVeil, { opacity: 1 });
      gsap.set(contentSlide1, { opacity: 0 });
      gsap.set(contentSlide2, { opacity: 0 });
      gsap.set(panel, { opacity: 1, y: 0 });

      if (sceneVideo) {
        sceneVideo.currentTime = 0;
        sceneVideo.play();
      }

      gsap
        .timeline({
          onComplete: function () {
            overlay.classList.add("is-ready");
            isAnimating = false;
            enableHistoryScroll();
          },
        })
        .to(sceneVeil, {
          opacity: 0,
          duration: 1.75,
          ease: "power1.inOut",
        })
        .to(
          sceneVideo,
          {
            opacity: 1,
            scale: 1,
            duration: 2.4,
            ease: "power1.inOut",
          },
          0.35
        )
        .to(
          contentSlide1,
          {
            opacity: 1,
            duration: 0.95,
            ease: "power1.inOut",
          },
          0.75
        );
    }

    function openParchment() {
      if (isOpen || isAnimating || fogBridge.isBusy()) return;
      fogBridge.playEnter(revealParchment);
    }

    function closeParchment() {
      if (!isOpen || isAnimating) return;
      isAnimating = true;
      scrollEnabled = false;
      overlay.classList.remove("is-ready");

      if (historyTransition) {
        historyTransition.kill();
        historyTransition = null;
      }

      gsap
        .timeline({
          onComplete: function () {
            fogBridge.playExit(function () {
              resetHistoryScrollState();
              overlay.classList.remove("is-active");
              overlay.hidden = true;
              overlay.setAttribute("aria-hidden", "true");
              document.body.classList.remove("parchment-open");

              if (lenisInstance && typeof lenisInstance.start === "function") {
                lenisInstance.start();
              }

              isOpen = false;
              isAnimating = false;
            });
          },
        })
        .to(contentSlide1, {
          opacity: 0,
          duration: 0.35,
          ease: "power2.in",
        })
        .to(
          contentSlide2,
          {
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
          },
          0
        )
        .to(
          sceneVideoSlide2,
          {
            opacity: 0,
            scale: 1.03,
            duration: 0.55,
            ease: "power2.in",
          },
          0
        )
        .to(
          sceneLightWaves,
          {
            opacity: 0,
            duration: 0.35,
            ease: "power2.in",
          },
          0
        )
        .to(
          sceneVideo,
          {
            opacity: 0,
            scale: 1.03,
            duration: 0.7,
            ease: "power2.in",
          },
          0.05
        )
        .to(
          sceneVeil,
          {
            opacity: 1,
            duration: 0.55,
            ease: "power2.in",
          },
          0.25
        )
        .add(function () {
          if (sceneVideo) {
            sceneVideo.pause();
          }
          if (sceneVideoSlide2) {
            sceneVideoSlide2.pause();
          }
        });
    }

    overlay.addEventListener("wheel", onHistoryWheel, { passive: false });

    link.addEventListener("click", function (event) {
      event.preventDefault();
      openParchment();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen) {
        closeParchment();
      }
    });
  }

  /**
   * Klik na Pro školy — tma, béžová scéna a scroll zoom dovnitř
   */
  function initSchoolOverlay(lenisInstance, fogBridge) {
    const link = document.querySelector(".path-slide__link--skoly");
    const overlay = document.getElementById("school-overlay");
    if (!link || !overlay) return;

    const sceneBg = overlay.querySelector(".school-scene__bg");
    const sceneVeil = overlay.querySelector(".school-scene__veil");
    const zoomLayer = overlay.querySelector(".school-stage__zoom");
    const intro = overlay.querySelector(".school-overlay__intro");
    const schoolTitle = intro
      ? intro.querySelector(".school-intro-panel__title")
      : null;
    const schoolCategories = intro
      ? intro.querySelector(".school-intro__categories")
      : null;
    const schoolLead = intro
      ? intro.querySelector(".school-intro__text--lead")
      : null;
    const inner = overlay.querySelector(".school-inner");
    const treasures = overlay.querySelectorAll(".school-treasure");
    const closeBtn = overlay.querySelector(".school-overlay__close");
    let isOpen = false;
    let isAnimating = false;
    let scrollEnabled = false;
    let isOnInnerSlide = false;
    let innerTransition = null;
    let schoolVideoFreezeHandler = null;
    let schoolVideoCoastTween = null;

    const SCHOOL_VIDEO_FREEZE_RATIO = 0.5;
    const SCHOOL_VIDEO_COAST_DURATION = 0.95;
    const SCHOOL_VIDEO_COAST_LEAD = 0.12;

    initFogVideos(overlay);

    function clearSchoolVideoFreezeListener() {
      if (schoolVideoFreezeHandler && sceneBg) {
        sceneBg.removeEventListener("timeupdate", schoolVideoFreezeHandler);
        schoolVideoFreezeHandler = null;
      }
    }

    function stopSchoolVideoCoast() {
      if (schoolVideoCoastTween) {
        schoolVideoCoastTween.kill();
        schoolVideoCoastTween = null;
      }
    }

    function resetSchoolVideoPlayback() {
      stopSchoolVideoCoast();
      clearSchoolVideoFreezeListener();
    }

    function freezeSchoolVideoAtMiddle() {
      if (!sceneBg || !sceneBg.duration || !isFinite(sceneBg.duration)) return;
      stopSchoolVideoCoast();
      clearSchoolVideoFreezeListener();
      sceneBg.currentTime = sceneBg.duration * SCHOOL_VIDEO_FREEZE_RATIO;
      sceneBg.pause();
    }

    function beginSchoolVideoCoast() {
      if (!sceneBg || schoolVideoCoastTween) return;

      const freezeTime = sceneBg.duration * SCHOOL_VIDEO_FREEZE_RATIO;
      if (sceneBg.currentTime >= freezeTime - 0.01) {
        freezeSchoolVideoAtMiddle();
        return;
      }

      clearSchoolVideoFreezeListener();
      sceneBg.pause();

      schoolVideoCoastTween = gsap.to(sceneBg, {
        currentTime: freezeTime,
        duration: SCHOOL_VIDEO_COAST_DURATION,
        ease: "power2.out",
        onComplete: function () {
          schoolVideoCoastTween = null;
          freezeSchoolVideoAtMiddle();
        },
      });
    }

    function startSchoolVideo() {
      if (!sceneBg) return;

      resetSchoolVideoPlayback();
      sceneBg.currentTime = 0;

      schoolVideoFreezeHandler = function () {
        if (!sceneBg.duration || !isFinite(sceneBg.duration)) return;
        const freezeTime = sceneBg.duration * SCHOOL_VIDEO_FREEZE_RATIO;
        if (sceneBg.currentTime >= freezeTime - SCHOOL_VIDEO_COAST_LEAD) {
          beginSchoolVideoCoast();
        }
      };

      sceneBg.addEventListener("timeupdate", schoolVideoFreezeHandler);

      if (sceneBg.readyState >= 1) {
        const playPromise = sceneBg.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {});
        }
        return;
      }

      sceneBg.addEventListener(
        "loadedmetadata",
        function onMetadata() {
          sceneBg.removeEventListener("loadedmetadata", onMetadata);
          const playPromise = sceneBg.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(function () {});
          }
        },
        { once: true }
      );
    }

    function resetSchoolScrollState() {
      overlay.classList.remove("is-scrollable", "is-inner-visible", "is-zoom-hidden");
      overlay.scrollTop = 0;
      scrollEnabled = false;
      isOnInnerSlide = false;

      if (innerTransition) {
        innerTransition.kill();
        innerTransition = null;
      }

      gsap.set(zoomLayer, { clearProps: "transform,opacity,visibility" });
      gsap.set(intro, { clearProps: "transform,opacity" });
      gsap.set(sceneBg, { clearProps: "opacity,transform,visibility" });
      gsap.set(inner, { clearProps: "opacity" });
      gsap.set(treasures, { clearProps: "opacity" });
      resetSchoolVideoPlayback();
    }

    function playInnerTransition() {
      if (isOnInnerSlide || !scrollEnabled || innerTransition) return;

      scrollEnabled = false;

      innerTransition = gsap
        .timeline({
          onComplete: function () {
            isOnInnerSlide = true;
            innerTransition = null;
            scrollEnabled = true;
            overlay.classList.add("is-inner-visible", "is-zoom-hidden");
            gsap.set(zoomLayer, { visibility: "hidden" });
          },
        })
        .to(zoomLayer, {
          scale: 2.15,
          duration: 1.75,
          ease: "power2.inOut",
          transformOrigin: "50% 50%",
        })
        .to(
          zoomLayer,
          {
            opacity: 0,
            duration: 0.75,
            ease: "power2.in",
          },
          1.05
        )
        .to(
          intro,
          {
            opacity: 0,
            duration: 0.55,
            ease: "power2.in",
          },
          1
        )
        .to(
          inner,
          {
            opacity: 1,
            duration: 0.85,
            ease: "power2.out",
          },
          1.25
        )
        .to(
          treasures,
          {
            opacity: 1,
            duration: 0.65,
            stagger: 0.08,
            ease: "power2.out",
          },
          1.4
        );
    }

    function playOuterTransition() {
      if (!isOnInnerSlide || !scrollEnabled || innerTransition) return;

      scrollEnabled = false;
      overlay.classList.remove("is-inner-visible", "is-zoom-hidden");
      gsap.set(zoomLayer, { visibility: "visible", scale: 2.15, opacity: 0 });
      gsap.set(intro, { opacity: 1, y: 0 });
      gsap.set(schoolTitle, { opacity: 0, y: 14 });
      gsap.set(schoolCategories, { opacity: 0, y: 10 });
      gsap.set(schoolLead, { opacity: 0, y: 10 });

      innerTransition = gsap
        .timeline({
          onComplete: function () {
            isOnInnerSlide = false;
            innerTransition = null;
            scrollEnabled = true;
            gsap.set(zoomLayer, { scale: 1, opacity: 1 });
          },
        })
        .to(treasures, {
          opacity: 0,
          duration: 0.35,
          stagger: { each: 0.04, from: "end" },
          ease: "power2.in",
        })
        .to(
          inner,
          {
            opacity: 0,
            duration: 0.35,
            ease: "power2.in",
          },
          0
        )
        .to(
          zoomLayer,
          {
            opacity: 1,
            duration: 0.55,
            ease: "power2.out",
          },
          0.2
        )
        .to(
          zoomLayer,
          {
            scale: 1,
            duration: 1.35,
            ease: "power2.inOut",
            transformOrigin: "50% 50%",
          },
          0.2
        )
        .to(
          schoolTitle,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power1.inOut",
          },
          0.55
        )
        .to(
          schoolLead,
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: "power1.inOut",
          },
          0.95
        )
        .to(
          schoolCategories,
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: "power1.inOut",
          },
          1.35
        );
    }

    function onSchoolWheel(event) {
      if (!scrollEnabled || innerTransition || !overlay.classList.contains("is-ready")) return;

      if (event.deltaY > 0 && !isOnInnerSlide) {
        event.preventDefault();
        event.stopPropagation();
        playInnerTransition();
        return;
      }

      if (event.deltaY < 0) {
        event.preventDefault();
        event.stopPropagation();
        if (isOnInnerSlide) {
          playOuterTransition();
        } else {
          closeSchool();
        }
      }
    }

    function enableSchoolScroll() {
      overlay.classList.add("is-scrollable");
      scrollEnabled = true;
    }

    function revealSchool() {
      isAnimating = true;
      isOpen = true;
      resetSchoolScrollState();

      if (lenisInstance && typeof lenisInstance.stop === "function") {
        lenisInstance.stop();
      }

      overlay.hidden = false;
      overlay.setAttribute("aria-hidden", "false");
      overlay.classList.add("is-active");
      overlay.classList.remove("is-ready");
      document.body.classList.add("school-open");

      startSchoolVideo();

      gsap.set(sceneBg, { opacity: 0, scale: 1.05 });
      gsap.set(sceneVeil, { opacity: 1 });
      gsap.set(intro, { opacity: 1, y: 0 });
      gsap.set(schoolTitle, { opacity: 0, y: 20 });
      gsap.set(schoolCategories, { opacity: 0, y: 14 });
      gsap.set(schoolLead, { opacity: 0, y: 14 });
      gsap.set(zoomLayer, { scale: 1, opacity: 1 });
      gsap.set(inner, { opacity: 0 });
      gsap.set(treasures, { opacity: 0 });

      gsap
        .timeline({
          onComplete: function () {
            overlay.classList.add("is-ready");
            isAnimating = false;
            enableSchoolScroll();
          },
        })
        .to(sceneVeil, {
          opacity: 0,
          duration: 1.75,
          ease: "power1.inOut",
        })
        .to(sceneBg, {
          opacity: 1,
          scale: 1,
          duration: 2.4,
          ease: "power1.inOut",
        }, 0.35)
        .to(
          schoolTitle,
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: "power1.inOut",
          },
          1.2
        )
        .to(
          schoolLead,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power1.inOut",
          },
          1.85
        )
        .to(
          schoolCategories,
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: "power1.inOut",
          },
          2.45
        );
    }

    function openSchool() {
      if (isOpen || isAnimating || fogBridge.isBusy()) return;
      fogBridge.playEnter(revealSchool);
    }

    function closeSchool() {
      if (!isOpen || isAnimating) return;
      isAnimating = true;
      scrollEnabled = false;
      isOnInnerSlide = false;

      if (innerTransition) {
        innerTransition.kill();
        innerTransition = null;
      }

      overlay.classList.remove("is-ready", "is-inner-visible", "is-zoom-hidden");

      gsap
        .timeline({
          onComplete: function () {
            fogBridge.playExit(function () {
              resetSchoolScrollState();
              overlay.classList.remove("is-active");
              overlay.hidden = true;
              overlay.setAttribute("aria-hidden", "true");
              document.body.classList.remove("school-open");

              if (sceneBg) {
                resetSchoolVideoPlayback();
                sceneBg.pause();
              }

              if (lenisInstance && typeof lenisInstance.start === "function") {
                lenisInstance.start();
              }

              isOpen = false;
              isAnimating = false;
            });
          },
        })
        .to(intro, {
          opacity: 0,
          y: 12,
          duration: 0.35,
          ease: "power2.in",
        })
        .to(
          inner,
          {
            opacity: 0,
            duration: 0.35,
            ease: "power2.in",
          },
          0
        )
        .to(
          treasures,
          {
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
          },
          0
        )
        .to(
          zoomLayer,
          {
            opacity: 0,
            scale: 1,
            duration: 0.35,
            ease: "power2.in",
          },
          0
        )
        .to(
          sceneBg,
          {
            opacity: 0,
            duration: 0.7,
            ease: "power2.in",
          },
          0.05
        )
        .to(
          sceneVeil,
          {
            opacity: 1,
            duration: 0.55,
            ease: "power2.in",
          },
          0.25
        );
    }

    overlay.addEventListener("wheel", onSchoolWheel, { passive: false });

    link.addEventListener("click", function (event) {
      event.preventDefault();
      openSchool();
    });

    closeBtn.addEventListener("click", closeSchool);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen) {
        closeSchool();
      }
    });
  }

  /**
   * Pro návštěvníky — overlay s aktualitami (text)
   */
  function initVisitorsOverlay(lenisInstance, fogBridge) {
    const link = document.querySelector(".path-slide__link--navstevnici");
    const overlay = document.getElementById("visitors-overlay");
    if (!link || !overlay) return;

    const video = overlay.querySelector(".visitors-overlay__video");
    const veil = overlay.querySelector(".visitors-overlay__veil");
    const scrollEl = overlay.querySelector(".visitors-overlay__scroll");
    const introStage = overlay.querySelector(".visitors-intro-stage");
    const boardHead = overlay.querySelector(".visitors-board__head");
    const boardBody = overlay.querySelector(".visitors-board__body");
    const cards = overlay.querySelectorAll(".visitors-card");
    const closeBtn = overlay.querySelector(".visitors-overlay__close");

    let isOpen = false;
    let isAnimating = false;
    let scrollEnabled = false;
    let contentRevealTimer = null;

    initFogVideos(overlay);

    function resetVisitorsState() {
      overlay.classList.remove("is-scrollable");
      scrollEnabled = false;

      if (contentRevealTimer) {
        clearTimeout(contentRevealTimer);
        contentRevealTimer = null;
      }

      gsap.killTweensOf([introStage, boardHead, boardBody, cards]);

      if (introStage) {
        gsap.set(introStage, { clearProps: "height,minHeight" });
      }

      if (boardHead) {
        gsap.set(boardHead, { clearProps: "opacity,visibility,transform" });
      }

      if (boardBody) {
        gsap.set(boardBody, { clearProps: "opacity,transform" });
      }

      gsap.set(cards, { clearProps: "opacity,transform" });

      if (scrollEl) {
        scrollEl.scrollTop = 0;
      }
    }

    function prepareVisitorsContent() {
      if (boardHead) {
        gsap.set(boardHead, {
          opacity: 0,
          visibility: "hidden",
          xPercent: -50,
          y: 20,
        });
      }

      if (boardBody) {
        gsap.set(boardBody, { opacity: 1, y: 0 });
      }

      gsap.set(cards, { opacity: 0, y: 26 });

      if (introStage) {
        gsap.set(introStage, { height: "100vh", minHeight: "100vh" });
      }
    }

    function revealVisitorsContent() {
      overlay.classList.add("is-scrollable");
      scrollEnabled = true;

      const revealTimeline = gsap.timeline();

      if (introStage) {
        revealTimeline.to(
          introStage,
          {
            height: 0,
            minHeight: 0,
            duration: 1.35,
            ease: "power2.inOut",
          },
          0
        );
      }

      if (boardHead) {
        revealTimeline.set(
          boardHead,
          { visibility: "visible", pointerEvents: "auto" },
          0.15
        );
        revealTimeline.to(
          boardHead,
          {
            opacity: 1,
            y: 0,
            duration: 1.15,
            ease: "power2.out",
          },
          0.15
        );
      }

      revealTimeline.to(
        cards,
        {
          opacity: 1,
          y: 0,
          duration: 0.95,
          stagger: 0.18,
          ease: "power2.out",
        },
        0.5
      );
    }

    function revealVisitors() {
      isAnimating = true;
      isOpen = true;
      resetVisitorsState();

      if (lenisInstance && typeof lenisInstance.stop === "function") {
        lenisInstance.stop();
      }

      overlay.hidden = false;
      overlay.setAttribute("aria-hidden", "false");
      overlay.classList.add("is-active");
      document.body.classList.add("visitors-open");

      if (video) {
        video.currentTime = 0;
        video.play();
      }

      gsap.set(veil, { opacity: 1 });
      prepareVisitorsContent();

      gsap
        .timeline({
          onComplete: function () {
            isAnimating = false;
            contentRevealTimer = window.setTimeout(function () {
              revealVisitorsContent();
              contentRevealTimer = null;
            }, 1000);
          },
        })
        .to(veil, { opacity: 0, duration: 1.75, ease: "power1.inOut" });
    }

    function openVisitors() {
      if (isOpen || isAnimating || fogBridge.isBusy()) return;
      fogBridge.playEnter(revealVisitors);
    }

    function closeVisitors() {
      if (!isOpen || isAnimating) return;
      isAnimating = true;
      resetVisitorsState();

      gsap
        .timeline({
          onComplete: function () {
            fogBridge.playExit(function () {
              overlay.classList.remove("is-active");
              overlay.hidden = true;
              overlay.setAttribute("aria-hidden", "true");
              document.body.classList.remove("visitors-open");

              if (video) {
                video.pause();
              }

              if (lenisInstance && typeof lenisInstance.start === "function") {
                lenisInstance.start();
              }

              isOpen = false;
              isAnimating = false;
            });
          },
        })
        .to(veil, { opacity: 1, duration: 0.45, ease: "power2.in" });
    }

    function onVisitorsWheel(event) {
      if (!isOpen || isAnimating || !scrollEnabled || !scrollEl) return;

      if (scrollEl.scrollTop <= 2 && event.deltaY < 0) {
        event.preventDefault();
        event.stopPropagation();
        closeVisitors();
      }
    }

    if (scrollEl) {
      scrollEl.addEventListener("wheel", onVisitorsWheel, { passive: false });
    }

    link.addEventListener("click", function (event) {
      event.preventDefault();
      openVisitors();
    });

    closeBtn.addEventListener("click", closeVisitors);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen) {
        closeVisitors();
      }
    });
  }

  /**
   * Zážitky — overlay s 3D modelem zbraní
   */
  function initExperiencesOverlay(lenisInstance, fogBridge) {
    const link = document.querySelector(".path-slide__link--zazitky");
    const overlay = document.getElementById("experiences-overlay");
    if (!link || !overlay) return;

    const veil = overlay.querySelector(".experiences-overlay__veil");
    const panel = overlay.querySelector(".experiences-overlay__panel");
    const board = overlay.querySelector(".experiences-board");
    const viewer = overlay.querySelector(".experiences-viewer");
    const canvas = document.getElementById("experiences-3d-canvas");
    const statusEl = document.getElementById("experiences-3d-status");
    const closeBtn = overlay.querySelector(".experiences-overlay__close");
    let isOpen = false;
    let isAnimating = false;
    let threeApi = null;
    let threeLoading = null;

    function showExperiences3DError(message) {
      if (!statusEl) return;
      statusEl.hidden = false;
      statusEl.textContent = message;
      statusEl.classList.add("experiences-viewer__status--error");
    }

    async function ensureThree() {
      if (threeApi) return threeApi;

      if (!window.HorniHradExperiences3D) {
        throw new Error("Three.js se nenačetl.");
      }

      if (!threeLoading) {
        threeLoading = window.HorniHradExperiences3D.mountExperiences3D(
          canvas,
          statusEl
        ).then(function () {
          return window.HorniHradExperiences3D;
        });
      }

      threeApi = await threeLoading;
      return threeApi;
    }

    async function revealExperiences() {
      isAnimating = true;
      isOpen = true;

      if (lenisInstance && typeof lenisInstance.stop === "function") {
        lenisInstance.stop();
      }

      overlay.hidden = false;
      overlay.setAttribute("aria-hidden", "false");
      overlay.classList.add("is-active");
      document.body.classList.add("experiences-open");

      if (statusEl && !threeApi) {
        statusEl.hidden = false;
        statusEl.textContent = "Načítám 3D model…";
        statusEl.classList.remove("experiences-viewer__status--error");
      }

      gsap.set(veil, { opacity: 1 });
      gsap.set(panel, { opacity: 0, y: 18 });
      gsap.set(board, { opacity: 0, y: 24 });
      gsap.set(viewer, { opacity: 0, y: 16 });

      try {
        const threeModule = await ensureThree();
        window.requestAnimationFrame(function () {
          threeModule.resizeExperiences3D();
          threeModule.startExperiences3D();
        });
      } catch (error) {
        console.error("Nepodařilo se načíst 3D model zážitků.", error);
        showExperiences3DError(
          "3D model se nepodařilo načíst. Spusť start-server.bat a otevři http://localhost:8080"
        );
      }

      gsap
        .timeline({
          onComplete: function () {
            if (threeApi && typeof threeApi.resizeExperiences3D === "function") {
              threeApi.resizeExperiences3D();
              threeApi.startExperiences3D();
            }
            isAnimating = false;
          },
        })
        .to(veil, { opacity: 0, duration: 1.75, ease: "power1.inOut" })
        .to(panel, { opacity: 1, y: 0, duration: 0.7, ease: "power1.inOut" }, 0.2)
        .to(board, { opacity: 1, y: 0, duration: 0.85, ease: "power1.inOut" }, 0.45)
        .to(
          viewer,
          { opacity: 1, y: 0, duration: 0.85, ease: "power1.inOut" },
          0.55
        );
    }

    function openExperiences() {
      if (isOpen || isAnimating || fogBridge.isBusy()) return;
      fogBridge.playEnter(revealExperiences);
    }

    function closeExperiences() {
      if (!isOpen || isAnimating) return;
      isAnimating = true;

      if (threeApi && typeof threeApi.stopExperiences3D === "function") {
        threeApi.stopExperiences3D();
      }

      gsap
        .timeline({
          onComplete: function () {
            fogBridge.playExit(function () {
              overlay.classList.remove("is-active");
              overlay.hidden = true;
              overlay.setAttribute("aria-hidden", "true");
              document.body.classList.remove("experiences-open");

              if (lenisInstance && typeof lenisInstance.start === "function") {
                lenisInstance.start();
              }

              isOpen = false;
              isAnimating = false;
            });
          },
        })
        .to(viewer, {
          opacity: 0,
          y: 12,
          duration: 0.28,
          ease: "power2.in",
        })
        .to(
          board,
          {
            opacity: 0,
            y: 16,
            duration: 0.3,
            ease: "power2.in",
          },
          0.04
        )
        .to(
          panel,
          {
            opacity: 0,
            y: 10,
            duration: 0.3,
            ease: "power2.in",
          },
          0.08
        )
        .to(veil, { opacity: 1, duration: 0.35, ease: "power2.in" }, 0.12);
    }

    function onExperiencesWheel(event) {
      if (!isOpen || isAnimating) return;

      if (event.deltaY < 0) {
        event.preventDefault();
        event.stopPropagation();
        closeExperiences();
      }
    }

    overlay.addEventListener("wheel", onExperiencesWheel, { passive: false });

    link.addEventListener("click", function (event) {
      event.preventDefault();
      openExperiences();
    });

    closeBtn.addEventListener("click", closeExperiences);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen) {
        closeExperiences();
      }
    });
  }

  /**
   * Kontakty — video na pozadí a kontaktní údaje
   */
  function initContactsOverlay(lenisInstance, fogBridge) {
    const link = document.querySelector(".path-slide__link--kontakty");
    const overlay = document.getElementById("contacts-overlay");
    if (!link || !overlay) return;

    const videos = overlay.querySelectorAll(
      ".contacts-overlay__video, .contacts-overlay__fog-video"
    );
    const veil = overlay.querySelector(".contacts-overlay__veil");
    const panel = overlay.querySelector(".contacts-overlay__panel");
    const sheet = overlay.querySelector(".contacts-sheet");
    const closeBtn = overlay.querySelector(".contacts-overlay__close");
    let isOpen = false;
    let isAnimating = false;

    function playContactsVideos() {
      videos.forEach(function (video) {
        const startPlayback = function () {
          video.currentTime = 0;
          const playPromise = video.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(function () {});
          }
        };

        if (video.readyState >= 2) {
          startPlayback();
          return;
        }

        video.addEventListener("loadeddata", startPlayback, { once: true });
        video.load();
      });
    }

    function pauseContactsVideos() {
      videos.forEach(function (video) {
        video.pause();
      });
    }

    function preloadContactsVideos() {
      videos.forEach(function (video) {
        if (video.readyState >= 1) return;
        video.preload = "auto";
        video.load();
      });
    }

    initFogVideos(overlay);
    window.addEventListener("load", preloadContactsVideos, { once: true });

    function revealContacts() {
      isAnimating = true;
      isOpen = true;

      if (lenisInstance && typeof lenisInstance.stop === "function") {
        lenisInstance.stop();
      }

      overlay.hidden = false;
      overlay.setAttribute("aria-hidden", "false");
      overlay.classList.add("is-active");
      document.body.classList.add("contacts-open");

      playContactsVideos();

      gsap.set(veil, { opacity: 1 });
      gsap.set(panel, { opacity: 0 });
      gsap.set(sheet, { opacity: 0, y: 20 });

      gsap
        .timeline({
          onComplete: function () {
            isAnimating = false;
          },
        })
        .to(veil, { opacity: 0, duration: 1.75, ease: "power1.inOut" })
        .to(panel, { opacity: 1, duration: 0.6, ease: "power1.inOut" }, 0.25)
        .to(sheet, { opacity: 1, y: 0, duration: 0.85, ease: "power1.inOut" }, 0.45);
    }

    function closeContacts() {
      if (!isOpen || isAnimating) return;
      isAnimating = true;

      gsap
        .timeline({
          onComplete: function () {
            fogBridge.playExit(function () {
              overlay.classList.remove("is-active");
              overlay.hidden = true;
              overlay.setAttribute("aria-hidden", "true");
              document.body.classList.remove("contacts-open");

              pauseContactsVideos();

              if (lenisInstance && typeof lenisInstance.start === "function") {
                lenisInstance.start();
              }

              isOpen = false;
              isAnimating = false;
            });
          },
        })
        .to(sheet, { opacity: 0, y: 14, duration: 0.3, ease: "power2.in" })
        .to(panel, { opacity: 0, duration: 0.28, ease: "power2.in" }, 0.05)
        .to(veil, { opacity: 1, duration: 0.4, ease: "power2.in" }, 0.1);
    }

    function openContacts() {
      if (isOpen || isAnimating || fogBridge.isBusy()) return;
      fogBridge.playEnter(revealContacts);
    }

    function onContactsWheel(event) {
      if (!isOpen || isAnimating) return;

      if (event.deltaY < 0) {
        event.preventDefault();
        event.stopPropagation();
        closeContacts();
      }
    }

    overlay.addEventListener("wheel", onContactsWheel, { passive: false });

    link.addEventListener("click", function (event) {
      event.preventDefault();
      openContacts();
    });

    link.addEventListener("mouseenter", preloadContactsVideos, { once: true });
    link.addEventListener("focus", preloadContactsVideos, { once: true });

    closeBtn.addEventListener("click", closeContacts);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen) {
        closeContacts();
      }
    });
  }

  /**
   * Zvuk kliknutí na tlačítka a odkazy
   */
  function initClickSound() {
    const clickSrc = "assets/click.mp3";
    const poolSize = 6;
    const pool = [];
    let poolIndex = 0;

    for (let i = 0; i < poolSize; i += 1) {
      const audio = new Audio(clickSrc);
      audio.preload = "auto";
      audio.volume = 0.5;
      pool.push(audio);
    }

    function playClickSound() {
      const audio = pool[poolIndex];
      poolIndex = (poolIndex + 1) % poolSize;
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    }

    document.addEventListener(
      "pointerdown",
      function (event) {
        if (event.button !== 0) return;

        const target = event.target.closest(
          "button, a[href], .path-slide__link, .school-intro__btn"
        );
        if (!target) return;
        playClickSound();
      },
      true
    );
  }

  /**
   * Zvuk při najetí myší na položky menu „Vyber si svou cestu“
   */
  function initMenuHoverSound() {
    const links = document.querySelectorAll(".path-slide__link");
    if (!links.length) return;

    const poolSize = 4;
    const pool = [];
    let poolIndex = 0;
    let lastPlayAt = 0;

    for (let i = 0; i < poolSize; i += 1) {
      const audio = new Audio("assets/menu-hover.mp3");
      audio.preload = "auto";
      audio.volume = 0.42;
      pool.push(audio);
    }

    function playHoverSound() {
      const now = Date.now();
      if (now - lastPlayAt < 80) return;
      lastPlayAt = now;

      const audio = pool[poolIndex];
      poolIndex = (poolIndex + 1) % poolSize;
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    }

    links.forEach(function (link) {
      link.addEventListener("mouseenter", playHoverSound);
    });
  }

  /**
   * Ambientní hudba — hraje na úvodu (rytíř) a v menu „Vyber si svou cestu“
   */
  function initAmbientMusic(heroApi, fogBridge) {
    const ambient = new Audio("assets/ambient.mp3");
    ambient.preload = "auto";
    ambient.loop = true;
    ambient.volume = 0.38;

    let soundEnabled = false;

    function isSectionOpen() {
      return (
        document.body.classList.contains("parchment-open") ||
        document.body.classList.contains("school-open") ||
        document.body.classList.contains("visitors-open") ||
        document.body.classList.contains("experiences-open") ||
        document.body.classList.contains("contacts-open")
      );
    }

    function shouldPlayAmbient() {
      return soundEnabled && !isSectionOpen();
    }

    function playAmbient() {
      const playPromise = ambient.play();
      if (!playPromise || typeof playPromise.catch !== "function") return;
      playPromise.catch(function () {});
    }

    function pauseAmbient() {
      ambient.pause();
    }

    function syncAmbient() {
      if (shouldPlayAmbient()) {
        playAmbient();
      } else {
        pauseAmbient();
      }
    }

    function setSoundEnabled(enabled) {
      soundEnabled = enabled;
      syncAmbient();
    }

    function retryOnGesture() {
      if (shouldPlayAmbient() && ambient.paused) {
        playAmbient();
      }
    }

    window.addEventListener("pointerdown", retryOnGesture, { passive: true });
    window.addEventListener("keydown", retryOnGesture, { passive: true });

    if (fogBridge) {
      if (typeof fogBridge.playEnter === "function") {
        const originalPlayEnter = fogBridge.playEnter.bind(fogBridge);
        fogBridge.playEnter = function (onFogPeak) {
          pauseAmbient();
          originalPlayEnter(onFogPeak);
        };
      }

      if (typeof fogBridge.playExit === "function") {
        const originalPlayExit = fogBridge.playExit.bind(fogBridge);
        fogBridge.playExit = function (onComplete) {
          originalPlayExit(function () {
            if (typeof onComplete === "function") {
              onComplete();
            }
            syncAmbient();
          });
        };
      }
    }

    if (
      heroApi &&
      heroApi.scrollTimeline &&
      typeof heroApi.scrollTimeline.eventCallback === "function"
    ) {
      heroApi.scrollTimeline.eventCallback("onUpdate", syncAmbient);
    }

    return {
      setSoundEnabled: setSoundEnabled,
      sync: syncAmbient,
      tryStart: function () {
        setSoundEnabled(true);
      },
      stop: function () {
        setSoundEnabled(false);
      },
    };
  }

  /**
   * Přepínač zvuku na úvodní scéně
   */
  function initHeroScrollDown(heroApi, lenisInstance) {
    const button = document.getElementById("hero-scroll-down");
    if (!button || !heroApi || !heroApi.scrollTimeline) return;

    button.addEventListener("click", function () {
      const scrollTrigger = heroApi.scrollTimeline.scrollTrigger;
      if (!scrollTrigger || !lenisInstance) return;

      const targetScroll = scrollTrigger.end;
      lenisInstance.scrollTo(targetScroll, {
        duration: 2.6,
        easing: function (t) {
          return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        },
      });
    });
  }

  function initHeroSoundToggle(ambientApi) {
    const toggle = document.getElementById("hero-sound-toggle");
    if (!toggle) return;

    const iconMuted = toggle.querySelector(".hero-sound-toggle__icon--muted");
    const iconOn = toggle.querySelector(".hero-sound-toggle__icon--on");
    let soundOn = false;

    function setSoundState(enabled) {
      soundOn = enabled;
      toggle.classList.toggle("is-unmuted", soundOn);
      toggle.setAttribute("aria-pressed", String(soundOn));
      toggle.setAttribute(
        "aria-label",
        soundOn ? "Vypnout zvuk" : "Zapnout zvuk"
      );

      if (iconMuted) iconMuted.hidden = soundOn;
      if (iconOn) iconOn.hidden = !soundOn;

      document.querySelectorAll("video").forEach(function (video) {
        video.muted = !soundOn;
        if (soundOn) {
          const playPromise = video.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(function () {});
          }
        }
      });

      if (soundOn && ambientApi && typeof ambientApi.setSoundEnabled === "function") {
        ambientApi.setSoundEnabled(true);
      } else if (!soundOn && ambientApi && typeof ambientApi.setSoundEnabled === "function") {
        ambientApi.setSoundEnabled(false);
      }
    }

    toggle.addEventListener("click", function () {
      setSoundState(!soundOn);
    });
  }

  /**
   * Kurzor — rytířská rukavice sledující myš
   */
  function initLampCursor() {
    const cursor = document.getElementById("lamp-cursor");
    if (!cursor || !window.matchMedia("(pointer: fine)").matches) return;

    document.body.classList.add("has-lamp-cursor");

    let targetX = window.innerWidth * 0.5;
    let targetY = window.innerHeight * 0.5;
    let currentX = targetX;
    let currentY = targetY;

    const cursorHotspotX = -61;
    const cursorHotspotY = -2;

    gsap.set(cursor, {
      x: currentX,
      y: currentY,
      xPercent: cursorHotspotX,
      yPercent: cursorHotspotY,
    });

    window.addEventListener("mousemove", function (event) {
      targetX = event.clientX;
      targetY = event.clientY;
    });

    window.addEventListener("mousedown", function () {
      gsap.to(cursor, { scale: 0.94, duration: 0.12, ease: "power2.out" });
    });

    window.addEventListener("mouseup", function () {
      gsap.to(cursor, { scale: 1, duration: 0.2, ease: "power2.out" });
    });

    gsap.ticker.add(function () {
      currentX += (targetX - currentX) * 0.2;
      currentY += (targetY - currentY) * 0.2;
      gsap.set(cursor, {
        x: currentX,
        y: currentY,
        xPercent: cursorHotspotX,
        yPercent: cursorHotspotY,
      });
    });
  }

  /**
   * Hledat — otevře řádek pro vyhledání sekcí v menu
   */
  function initPathSlideSearch() {
    const toggleBtn = document.querySelector(".path-slide__search-toggle");
    const searchPanel = document.getElementById("path-slide-search");
    const searchInput = document.getElementById("path-slide-search-input");
    const searchResults = document.getElementById("path-slide-search-results");

    if (!toggleBtn || !searchPanel || !searchInput || !searchResults) return;

    toggleBtn.addEventListener(
      "pointerdown",
      function (event) {
        event.stopPropagation();
      },
      true
    );

    const sections = [
      {
        label: "Pro školy",
        linkSelector: ".path-slide__link--skoly",
        terms: ["pro skoly", "skoly", "skola", "apartmany", "apartmány", "pdf", "pruvodce"],
      },
      {
        label: "Pro návštěvníky",
        linkSelector: ".path-slide__link--navstevnici",
        terms: ["pro navstevniky", "navstevnici", "navstevnik", "aktuality", "novinky"],
      },
      {
        label: "Zážitky",
        linkSelector: ".path-slide__link--zazitky",
        terms: ["zazitky", "zazitek", "3d", "zbrane", "zbraně"],
      },
      {
        label: "Historie",
        linkSelector: ".path-slide__link--historie",
        terms: ["historie", "hrad", "papyrus", "pergamen"],
      },
      {
        label: "Kontakty",
        linkSelector: ".path-slide__link--kontakty",
        terms: ["kontakty", "kontakt", "telefon", "email", "e-mail"],
      },
    ];

    let isOpen = false;

    function normalizeSearchText(value) {
      return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    }

    function closeSearch() {
      isOpen = false;
      toggleBtn.classList.remove("is-active");
      toggleBtn.setAttribute("aria-expanded", "false");
      searchPanel.classList.remove("is-open");
      searchPanel.hidden = true;
      searchInput.value = "";
      searchResults.innerHTML = "";
      searchResults.hidden = true;
    }

    function openSearch() {
      isOpen = true;
      toggleBtn.classList.add("is-active");
      toggleBtn.setAttribute("aria-expanded", "true");
      searchPanel.hidden = false;
      requestAnimationFrame(function () {
        searchPanel.classList.add("is-open");
        searchInput.focus();
      });
    }

    function filterSections(query) {
      const normalizedQuery = normalizeSearchText(query);
      if (!normalizedQuery) return [];

      return sections.filter(function (section) {
        const label = normalizeSearchText(section.label);
        if (label.includes(normalizedQuery)) return true;
        return section.terms.some(function (term) {
          return term.includes(normalizedQuery) || normalizedQuery.includes(term);
        });
      });
    }

    function renderResults(matches) {
      searchResults.innerHTML = "";

      if (!matches.length) {
        searchResults.hidden = true;
        return;
      }

      matches.forEach(function (section) {
        const item = document.createElement("li");
        item.className = "path-slide__search-result";
        item.setAttribute("role", "option");

        const button = document.createElement("button");
        button.type = "button";
        button.className = "path-slide__search-result-btn";
        button.textContent = section.label;
        button.addEventListener("click", function () {
          const targetLink = document.querySelector(section.linkSelector);
          closeSearch();
          if (targetLink) {
            targetLink.click();
          }
        });

        item.appendChild(button);
        searchResults.appendChild(item);
      });

      searchResults.hidden = false;
    }

    function handleSearchInput() {
      renderResults(filterSections(searchInput.value));
    }

    toggleBtn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (isOpen) {
        closeSearch();
      } else {
        openSearch();
      }
    });

    searchInput.addEventListener("input", handleSearchInput);

    searchInput.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSearch();
        toggleBtn.focus();
        return;
      }

      if (event.key !== "Enter") return;

      const firstResult = searchResults.querySelector(".path-slide__search-result-btn");
      if (firstResult) {
        event.preventDefault();
        firstResult.click();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen) {
        closeSearch();
        toggleBtn.focus();
      }
    });
  }

  window.addEventListener("load", function () {
    ScrollTrigger.refresh();
  });

  const heroFogScene = initHeroFogScene();
  const categoryFogBridge = initCategoryFogBridge(heroFogScene);
  const ambientMusic = initAmbientMusic(heroFogScene, categoryFogBridge);
  initParchmentHistorie(lenis, categoryFogBridge);
  initSchoolOverlay(lenis, categoryFogBridge);
  initVisitorsOverlay(lenis, categoryFogBridge);
  initExperiencesOverlay(lenis, categoryFogBridge);
  initContactsOverlay(lenis, categoryFogBridge);
  initPathSlideSearch();

  document
    .querySelectorAll(
      ".path-slide__link:not(.path-slide__link--historie):not(.path-slide__link--skoly):not(.path-slide__link--navstevnici):not(.path-slide__link--zazitky):not(.path-slide__link--kontakty)"
    )
    .forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        if (categoryFogBridge.isBusy()) return;
        categoryFogBridge.playEnter(function () {
          categoryFogBridge.playExit();
        });
      });
    });

  initClickSound();
  initMenuHoverSound();
  initHeroSoundToggle(ambientMusic);
  initHeroScrollDown(heroFogScene, lenis);
  initLampCursor();

  window.HorniHrad = {
    gsap: gsap,
    ScrollTrigger: ScrollTrigger,
    lenis: lenis,
    heroFogScene: heroFogScene,
  };
})();
