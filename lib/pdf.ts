import { degrees, PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PDFFont, PDFPage, RGB } from "pdf-lib";
import type { PublicRegistration } from "./types";

type FontSet = {
  regular: PDFFont;
  bold: PDFFont;
};

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

function drawSmallDetail(page: PDFPage, fonts: FontSet, label: string, value: string, x: number, y: number, width: number) {
  drawText(page, label.toUpperCase(), x, y + 12, 5.8, fonts.bold, "#BBD0FF");
  drawText(page, fit(value || "None", Math.floor(width / 5.2)), x, y, 7.3, fonts.bold, "#FFFFFF");
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
  const fonts = { regular, bold };
  const eventName = process.env.EVENT_NAME || "CMD AI Adoption Exam 2026";
  const eventDate = process.env.EVENT_DATE || "2026-05-12";
  const serial = registration.referenceCode.replace(/\D/g, "").slice(-2).padStart(2, "0");
  const badgeX = 60;
  const badgeY = 58;
  const badgeW = 300;
  const badgeH = 452;
  const top = badgeY + badgeH;
  const nameLines = wrap(registration.fullName, 15, 2);

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
  page.drawRectangle({ x: badgeX, y: badgeY + 206, width: badgeW, height: 100, color: hexColor("#1117DB"), opacity: 0.95 });
  page.drawRectangle({ x: badgeX, y: badgeY, width: badgeW, height: 206, color: hexColor("#070BC0"), opacity: 0.98 });

  drawBarcode(page, registration.referenceCode, badgeX + 36, top - 73, badgeW - 72, 38);
  page.drawRectangle({ x: badgeX, y: top - 93, width: badgeW, height: 1, color: hexColor("#7385FF"), opacity: 0.7 });

  nameLines.forEach((line, index) => {
    drawText(page, line, badgeX + 36, top - 122 - index * 26, 25, regular, "#FFFFFF");
  });
  drawText(page, serial, badgeX + badgeW - 68, top - 124, 25, regular, "#FFFFFF");

  page.drawRectangle({ x: badgeX, y: top - 166, width: badgeW, height: 1, color: hexColor("#7385FF"), opacity: 0.7 });
  drawText(page, fit(registration.jobTitle, 25), badgeX + 36, top - 190, 11.5, regular, "#D9E1FF");
  drawText(page, "*", badgeX + badgeW - 60, top - 195, 24, bold, "#F28A2F");
  page.drawRectangle({ x: badgeX, y: top - 214, width: badgeW, height: 1, color: hexColor("#7385FF"), opacity: 0.7 });

  drawSmallDetail(page, fonts, "Organization", registration.organization, badgeX + 36, top - 247, 120);
  drawSmallDetail(page, fonts, "Ticket", registration.ticketType, badgeX + 177, top - 247, 65);
  drawSmallDetail(page, fonts, "Status", registration.status, badgeX + 252, top - 247, 60);
  drawSmallDetail(page, fonts, "Email", registration.email, badgeX + 36, top - 286, 145);
  drawSmallDetail(page, fonts, "Phone", registration.phone, badgeX + 200, top - 286, 100);
  drawSmallDetail(page, fonts, "Dietary", registration.dietaryNeeds || "None", badgeX + 36, top - 325, 82);
  drawSmallDetail(page, fonts, "Access", registration.accessibilityNeeds || "None", badgeX + 132, top - 325, 82);
  drawSmallDetail(page, fonts, "Docs", `${registration.documents.length}`, badgeX + 229, top - 325, 38);

  drawText(page, "CMD AI", badgeX + 36, badgeY + 89, 43, regular, "#FFFFFF");
  drawText(page, "ADOPTION", badgeX + 36, badgeY + 49, 42, regular, "#FFFFFF");
  drawText(page, "EXAM 2026", badgeX + 36, badgeY + 25, 16, bold, "#C9D4FF");
  drawText(page, "L", badgeX + 229, badgeY + 50, 52, bold, "#FFFFFF");
  page.drawRectangle({ x: badgeX + 257, y: badgeY + 63, width: 32, height: 8, color: hexColor("#FFFFFF") });

  drawText(page, fit(eventName, 34), badgeX + 36, badgeY + 12, 6.8, regular, "#BBD0FF");
  drawText(page, eventDate, badgeX + 247, badgeY + 12, 6.8, regular, "#BBD0FF");

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
