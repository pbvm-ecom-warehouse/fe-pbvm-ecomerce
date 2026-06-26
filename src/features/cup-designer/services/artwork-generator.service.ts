export function generateArtworkDataUrl(prompt: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not available");
  }

  const cleanPrompt = prompt.trim() || "Tea house classic";
  const seed = Array.from(cleanPrompt).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  const hue = seed % 360;
  const accent = `hsl(${hue} 48% 35%)`;
  const softAccent = `hsl(${(hue + 28) % 360} 36% 76%)`;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
  gradient.addColorStop(0.45, "rgba(255, 255, 255, 0.82)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = softAccent;
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.ellipse(520, 328, 320, 132, -0.08, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = accent;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(170, 330);
  ctx.bezierCurveTo(330, 210, 680, 232, 850, 330);
  ctx.bezierCurveTo(686, 418, 332, 430, 170, 330);
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.font = "800 68px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(cleanPrompt.toUpperCase().slice(0, 18), 512, 336);

  ctx.fillStyle = softAccent;
  ctx.beginPath();
  ctx.arc(512, 250, 52, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.stroke();

  return canvas.toDataURL("image/png");
}
