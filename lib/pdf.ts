import { degrees, PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PDFFont, PDFPage, RGB } from "pdf-lib";
import type { PublicRegistration } from "./types";

function hexColor(hex: string): RGB {
  const clean = hex.replace("#", "");
  return rgb(
    parseInt(clean.slice(0, 2), 16) / 255,
    parseInt(clean.slice(2, 4), 16) / 255,
    parseInt(clean.slice(4, 6), 16) / 255,
  );
}

function fit(value: string, max: number): string {
  if (!value) return "None";
  return value.length > max ? `${value.slice(0, Math.max(0, max - 1))}...` : value;
}

function wrap(value: string, maxChars: number, maxLines: number): string[] {
  const words = (value || "None").split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
    if (lines.length === maxLines) break;
  }

  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[lines.length - 1] = fit(lines[lines.length - 1], maxChars);
  }
  return lines;
}

function drawText(page: PDFPage, text: string, x: number, y: number, size: number, font: PDFFont, color = "#0F172A") {
  page.drawText(text, {
    x,
    y,
    size,
    font,
    color: hexColor(color),
  });
}

function drawRotatedText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color = "#FFFFFF",
) {
  page.drawText(text, {
    x,
    y,
    size,
    font,
    color: hexColor(color),
    rotate: degrees(90),
  });
}

function drawBarcode(page: PDFPage, value: string, x: number, y: number, width: number, height: number, color = "#FFFFFF") {
  let seed = Array.from(value).reduce((sum, char) => sum + char.charCodeAt(0), 31);
  let cursor = x;

  while (cursor < x + width) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const barWidth = 1 + (seed % 4);
    const gap = 1 + ((seed >> 3) % 3);
    if (cursor + barWidth <= x + width) {
      page.drawRectangle({
        x: cursor,
        y,
        width: barWidth,
        height,
        color: hexColor(color),
      });
    }
    cursor += barWidth + gap;
  }
}

export async function makeNameTagPdf(registration: PublicRegistration): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([420, 620]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const eventName = process.env.EVENT_NAME || "CMD AI Adoption Exam 2026";
  const eventDate = process.env.EVENT_DATE || "2026-05-12";
  const serial = registration.referenceCode.replace(/\D/g, "").slice(-2).padStart(2, "0");
  const badgeX = 60;
  const badgeY = 58;
  const badgeW = 300;
  const badgeH = 452;
  const top = badgeY + badgeH;
  const nameLines = wrap(registration.fullName, 15, 2);
  const eventLines = wrap(eventName.replace(" 2026", ""), 12, 3);

  page.drawRectangle({ x: 0, y: 0, width: 420, height: 620, color: hexColor("#0A0A0C") });

  page.drawRectangle({ x: 183, y: 501, width: 54, height: 119, color: hexColor("#DDE5EF") });
  for (let x = 186; x < 236; x += 5) {
    page.drawRectangle({ x, y: 501, width: 1, height: 119, color: hexColor("#C2CBD9"), opacity: 0.55 });
  }
  drawRotatedText(page, "CMD EVENT 2026", 204, 526, 9, bold, "#111B54");

  page.drawRectangle({ x: 178, y: 486, width: 64, height: 20, color: hexColor("#050509") });
  page.drawRectangle({ x: 185, y: 493, width: 50, height: 6, color: hexColor("#111111") });

  page.drawRectangle({ x: badgeX + 7, y: badgeY - 8, width: badgeW, height: badgeH, color: hexColor("#030306"), opacity: 0.45 });
  page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeW,
    height: badgeH,
    color: hexColor("#1015D8"),
    borderColor: hexColor("#1624FF"),
    borderWidth: 1.2,
  });
  page.drawRectangle({ x: badgeX, y: badgeY + 306, width: badgeW, height: 146, color: hexColor("#151CFF"), opacity: 0.95 });
  page.drawRectangle({ x: badgeX, y: badgeY + 200, width: badgeW, height: 106, color: hexColor("#1117DB"), opacity: 0.95 });
  page.drawRectangle({ x: badgeX, y: badgeY, width: badgeW, height: 200, color: hexColor("#070BC0"), opacity: 0.98 });

  drawBarcode(page, registration.referenceCode, badgeX + 36, top - 73, badgeW - 72, 38);
  page.drawRectangle({ x: badgeX, y: top - 93, width: badgeW, height: 1, color: hexColor("#7385FF"), opacity: 0.7 });

  nameLines.forEach((line, index) => {
    drawText(page, line, badgeX + 36, top - 125 - index * 28, 27, regular, "#FFFFFF");
  });
  drawText(page, serial, badgeX + badgeW - 68, top - 126, 26, regular, "#FFFFFF");

  page.drawRectangle({ x: badgeX, y: top - 176, width: badgeW, height: 1, color: hexColor("#7385FF"), opacity: 0.7 });
  drawText(page, fit(registration.organization, 28), badgeX + 36, top - 203, 13, regular, "#D9E1FF");
  drawText(page, registration.ticketType.toUpperCase(), badgeX + badgeW - 98, top - 203, 13, bold, "#FFFFFF");
  drawText(page, "*", badgeX + badgeW - 54, top - 209, 24, bold, "#F28A2F");
  page.drawRectangle({ x: badgeX, y: top - 226, width: badgeW, height: 1, color: hexColor("#7385FF"), opacity: 0.7 });

  eventLines.forEach((line, index) => {
    drawText(page, line.toUpperCase(), badgeX + 36, badgeY + 125 - index * 43, 42, regular, "#FFFFFF");
  });
  drawText(page, "2026", badgeX + 36, badgeY + 23, 18, bold, "#C9D4FF");
  drawText(page, "L", badgeX + 229, badgeY + 70, 52, bold, "#FFFFFF");
  page.drawRectangle({ x: badgeX + 257, y: badgeY + 83, width: 32, height: 8, color: hexColor("#FFFFFF") });

  drawText(page, registration.referenceCode, badgeX + 36, badgeY + 12, 7.4, regular, "#BBD0FF");
  drawText(page, eventDate, badgeX + 247, badgeY + 12, 7.4, regular, "#BBD0FF");

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
