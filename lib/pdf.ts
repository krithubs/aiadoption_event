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
  const text = value.trim();
  if (!text) return "None";
  return text.length > max ? `${text.slice(0, Math.max(0, max - 1))}...` : text;
}

function fontSizeToFit(font: PDFFont, text: string, maxWidth: number, preferred: number, minimum: number): number {
  let size = preferred;
  while (size > minimum && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.5;
  return size;
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

function drawFittedText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  preferred: number,
  minimum: number,
  font: PDFFont,
  color = "#0F172A",
) {
  const size = fontSizeToFit(font, text, maxWidth, preferred, minimum);
  drawText(page, text, x, y, size, font, color);
}

function drawCenteredText(
  page: PDFPage,
  text: string,
  centerX: number,
  y: number,
  maxWidth: number,
  preferred: number,
  minimum: number,
  font: PDFFont,
  color = "#0F172A",
) {
  const size = fontSizeToFit(font, text, maxWidth, preferred, minimum);
  const width = font.widthOfTextAtSize(text, size);
  drawText(page, text, centerX - width / 2, y, size, font, color);
}

function wrapByWidth(text: string, font: PDFFont, size: number, maxWidth: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
    if (lines.length === maxLines) break;
  }

  if (current && lines.length < maxLines) lines.push(current);
  return lines.slice(0, maxLines);
}

function drawHeaderArtwork(page: PDFPage, x: number, y: number, width: number, height: number) {
  page.drawRectangle({ x, y, width, height, color: hexColor("#151A55") });
  page.drawRectangle({
    x: x - 30,
    y: y + 52,
    width: width + 90,
    height: 72,
    color: hexColor("#1777C8"),
    opacity: 0.72,
    rotate: degrees(-10),
  });
  page.drawRectangle({
    x: x - 16,
    y: y - 10,
    width: width + 70,
    height: 74,
    color: hexColor("#E83E8C"),
    opacity: 0.88,
    rotate: degrees(8),
  });
  page.drawRectangle({
    x: x + width - 76,
    y: y + 6,
    width: 90,
    height: 82,
    color: hexColor("#F59B49"),
    opacity: 0.82,
    rotate: degrees(-14),
  });
  page.drawRectangle({
    x: x + 74,
    y: y + 40,
    width: width,
    height: 5,
    color: hexColor("#FFB84D"),
    opacity: 0.88,
    rotate: degrees(12),
  });
}

function drawQrPattern(page: PDFPage, value: string, x: number, y: number, size: number) {
  const modules = 9;
  const cell = size / modules;
  let seed = Array.from(value).reduce((sum, char) => sum + char.charCodeAt(0), 29);

  page.drawRectangle({ x, y, width: size, height: size, color: hexColor("#FFFFFF") });
  for (let row = 0; row < modules; row += 1) {
    for (let col = 0; col < modules; col += 1) {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      const finder =
        (row < 3 && col < 3) ||
        (row < 3 && col > modules - 4) ||
        (row > modules - 4 && col < 3);
      if (finder || seed % 3 === 0) {
        page.drawRectangle({
          x: x + col * cell,
          y: y + row * cell,
          width: Math.max(1, cell - 0.6),
          height: Math.max(1, cell - 0.6),
          color: hexColor("#111827"),
        });
      }
    }
  }
}

export async function makeNameTagPdf(registration: PublicRegistration): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([420, 620]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const eventName = process.env.EVENT_NAME || "CMD AI Adoption Exam 2026";
  const eventDate = process.env.EVENT_DATE || "2026-05-12";

  const cardX = 70;
  const cardY = 86;
  const cardW = 280;
  const cardH = 440;
  const headerH = 145;
  const headerY = cardY + cardH - headerH;
  const bodyY = cardY;
  const bodyH = cardH - headerH;
  const contentX = cardX + 28;
  const contentW = cardW - 56;

  page.drawRectangle({ x: 0, y: 0, width: 420, height: 620, color: hexColor("#101010") });

  page.drawRectangle({ x: 190, y: 503, width: 40, height: 117, color: hexColor("#CAB98E") });
  for (let x = 195; x < 228; x += 8) {
    page.drawRectangle({ x, y: 503, width: 1.2, height: 117, color: hexColor("#8B7C5B"), opacity: 0.52 });
  }
  page.drawRectangle({ x: 184, y: 492, width: 52, height: 22, color: hexColor("#111111") });
  page.drawRectangle({ x: 198, y: 498, width: 24, height: 10, color: hexColor("#050505") });

  page.drawRectangle({ x: cardX + 7, y: cardY - 9, width: cardW, height: cardH, color: hexColor("#050505"), opacity: 0.36 });
  page.drawRectangle({ x: cardX, y: cardY, width: cardW, height: cardH, color: hexColor("#FFFFFF") });
  drawHeaderArtwork(page, cardX, headerY, cardW, headerH);

  page.drawRectangle({ x: cardX + cardW / 2 - 20, y: cardY + cardH - 12, width: 40, height: 8, color: hexColor("#080808") });
  page.drawRectangle({ x: cardX, y: headerY - 1, width: cardW, height: 1.4, color: hexColor("#E8EAF0") });

  const eventLines = wrapByWidth(eventName.toUpperCase(), bold, 16, cardW - 64, 2);
  eventLines.forEach((line, index) => {
    drawCenteredText(page, line, cardX + cardW / 2, headerY + 84 - index * 20, cardW - 64, 16, 11, bold, "#FFFFFF");
  });
  drawCenteredText(page, eventDate, cardX + cardW / 2, headerY + 44, cardW - 84, 10, 8, regular, "#EAF2FF");

  page.drawRectangle({ x: cardX, y: bodyY, width: cardW, height: bodyH, color: hexColor("#F8FAFC") });
  page.drawRectangle({ x: cardX, y: bodyY + bodyH - 1, width: cardW, height: 1, color: hexColor("#E3E8F0") });

  drawFittedText(page, fit(registration.fullName, 34), contentX, bodyY + bodyH - 64, contentW, 27, 17, bold, "#111827");
  drawFittedText(page, fit(registration.jobTitle, 42), contentX, bodyY + bodyH - 96, contentW, 13, 9, bold, "#1F2937");
  drawFittedText(page, fit(registration.organization, 46), contentX, bodyY + bodyH - 128, contentW, 14, 9, regular, "#111827");

  drawQrPattern(page, registration.referenceCode, cardX + cardW - 64, bodyY + 130, 34);
  drawFittedText(page, registration.referenceCode, contentX, bodyY + 126, 160, 8.5, 6.5, regular, "#64748B");

  const roleText = registration.ticketType.toUpperCase();
  const roleW = Math.max(92, Math.min(164, bold.widthOfTextAtSize(roleText, 14) + 22));
  page.drawRectangle({
    x: contentX,
    y: bodyY + 36,
    width: roleW,
    height: 34,
    borderColor: hexColor("#111827"),
    borderWidth: 1.6,
    color: hexColor("#F8FAFC"),
  });
  drawCenteredText(page, roleText, contentX + roleW / 2, bodyY + 46, roleW - 14, 14, 9, bold, "#111827");

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
