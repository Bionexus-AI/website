(function () {
  const canvas = document.getElementById("nexus-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0.68, y: 0.44, active: false };
  let width = 0;
  let height = 0;
  let particles = [];
  let strands = [];
  let raf = 0;

  function resize() {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    buildScene();
  }

  function buildScene() {
    const count = Math.max(90, Math.min(190, Math.floor(width / 7)));
    particles = Array.from({ length: count }, (_, index) => {
      const band = index / count;
      const angle = band * Math.PI * 8.8;
      const radius = 92 + Math.sin(band * Math.PI * 6) * 44 + Math.random() * 110;
      return {
        baseX: width * 0.72 + Math.cos(angle) * radius + (Math.random() - 0.5) * 90,
        baseY: height * 0.46 + Math.sin(angle * 0.72) * radius * 0.78 + (Math.random() - 0.5) * 80,
        x: 0,
        y: 0,
        r: 1.1 + Math.random() * 2.7,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.8,
        charge: Math.random() > 0.52 ? 1 : -1
      };
    });

    strands = Array.from({ length: 18 }, (_, index) => ({
      y: height * (0.18 + index * 0.036),
      phase: Math.random() * Math.PI * 2,
      tone: index % 3
    }));
  }

  function drawGradient() {
    const glow = ctx.createRadialGradient(width * 0.74, height * 0.43, 40, width * 0.74, height * 0.43, width * 0.48);
    glow.addColorStop(0, "rgba(52, 213, 197, 0.22)");
    glow.addColorStop(0.42, "rgba(76, 141, 255, 0.12)");
    glow.addColorStop(1, "rgba(7, 16, 20, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  function drawStrands(time) {
    strands.forEach((strand) => {
      ctx.beginPath();
      for (let x = width * 0.34; x < width * 1.02; x += 14) {
        const progress = x / width;
        const wave = Math.sin(progress * 14 + strand.phase + time * 0.00028) * 18;
        const pull = Math.sin(progress * Math.PI) * 70;
        const y = strand.y + wave + pull;
        if (x === width * 0.34) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const colors = [
        "rgba(52, 213, 197, 0.16)",
        "rgba(76, 141, 255, 0.13)",
        "rgba(255, 111, 97, 0.11)"
      ];
      ctx.strokeStyle = colors[strand.tone];
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  function drawParticles(time) {
    const focusX = width * pointer.x;
    const focusY = height * pointer.y;

    particles.forEach((particle, index) => {
      const drift = time * 0.00035 * particle.speed;
      particle.x = particle.baseX + Math.cos(drift + particle.phase) * 18;
      particle.y = particle.baseY + Math.sin(drift * 1.6 + particle.phase) * 14;

      if (pointer.active) {
        const dx = focusX - particle.x;
        const dy = focusY - particle.y;
        const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const influence = Math.max(0, 1 - distance / 360) * 24;
        particle.x += (dx / distance) * influence;
        particle.y += (dy / distance) * influence;
      }

      for (let j = index + 1; j < particles.length; j += 1) {
        const other = particles[j];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 88) {
          const alpha = (1 - distance / 88) * 0.18;
          ctx.strokeStyle = `rgba(138, 233, 255, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }

      const color = particle.charge > 0 ? "255, 111, 97" : "76, 141, 255";
      ctx.fillStyle = `rgba(${color}, 0.72)`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    drawGradient();
    drawStrands(time);
    drawParticles(time);

    if (!reduceMotion.matches) {
      raf = requestAnimationFrame(draw);
    }
  }

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width;
    pointer.y = (event.clientY - rect.top) / rect.height;
    pointer.active = true;
  });

  canvas.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  window.addEventListener("resize", resize, { passive: true });
  resize();
  draw(0);

  if (!reduceMotion.matches) {
    raf = requestAnimationFrame(draw);
  }

  reduceMotion.addEventListener("change", () => {
    cancelAnimationFrame(raf);
    draw(0);
    if (!reduceMotion.matches) {
      raf = requestAnimationFrame(draw);
    }
  });
})();
