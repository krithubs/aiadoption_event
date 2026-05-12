import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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
  page.drawText(text, { x, y, size, font, color: hexColor(color) });
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

function drawHeaderArtwork(page: PDFPage, x: number, y: number, width: number, height: number) {
  page.drawRectangle({ x, y, width, height, color: hexColor("#10164D") });
  page.drawRectangle({ x, y: y + 56, width: width * 0.72, height: 38, color: hexColor("#1F63B7"), opacity: 0.72 });
  page.drawRectangle({ x: x + width * 0.52, y: y + 48, width: width * 0.48, height: 46, color: hexColor("#6D5DF6"), opacity: 0.5 });
  page.drawRectangle({ x, y: y + 18, width, height: 46, color: hexColor("#B3339B"), opacity: 0.82 });
  page.drawRectangle({ x: x + width * 0.64, y: y + 18, width: width * 0.36, height: 46, color: hexColor("#56D7FF"), opacity: 0.22 });
  page.drawRectangle({ x, y: y + 14, width, height: 5, color: hexColor("#8D7CFF"), opacity: 0.95 });
}

function appBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (!configured) return "https://cmd-ai-event-registration.vercel.app";
  const withProtocol = configured.startsWith("http") ? configured : `https://${configured}`;
  return withProtocol.replace(/\/$/, "");
}

async function makeQrPngBytes(value: string): Promise<Uint8Array> {
  const dataUrl = await QRCode.toDataURL(value, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 144,
    color: {
      dark: "#111827",
      light: "#FFFFFF",
    },
  });
  return Uint8Array.from(Buffer.from(dataUrl.split(",")[1], "base64"));
}

export async function makeNameTagPdf(registration: PublicRegistration): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([560, 360]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const eventName = process.env.EVENT_NAME || "CMD AI Adoption Exam 2026";
  const lookupUrl = `${appBaseUrl()}/registration/lookup?ref=${encodeURIComponent(registration.referenceCode)}`;
  const qrPng = await pdf.embedPng(await makeQrPngBytes(lookupUrl));

  const cardX = 48;
  const cardY = 46;
  const cardW = 464;
  const cardH = 268;
  const headerH = 94;
  const footerH = 44;
  const bodyY = cardY + footerH;
  const headerY = cardY + cardH - headerH;
  const contentX = cardX + 34;
  const textW = 292;
  const qrSize = 58;

  page.drawRectangle({ x: 0, y: 0, width: 560, height: 360, color: hexColor("#F2F4F8") });
  page.drawRectangle({ x: cardX + 7, y: cardY - 8, width: cardW, height: cardH, color: hexColor("#111827"), opacity: 0.18 });
  page.drawRectangle({ x: cardX, y: cardY, width: cardW, height: cardH, color: hexColor("#FFFFFF") });

  drawHeaderArtwork(page, cardX, headerY, cardW, headerH);
  drawCenteredText(page, eventName.toUpperCase(), cardX + cardW / 2, headerY + 44, cardW - 70, 19, 11, bold, "#FFFFFF");

  page.drawRectangle({ x: cardX, y: bodyY, width: cardW, height: cardH - headerH - footerH, color: hexColor("#F8FAFC") });
  page.drawRectangle({ x: cardX, y: headerY - 1, width: cardW, height: 1.2, color: hexColor("#E5E7EB") });

  drawFittedText(page, fit(registration.fullName, 36), contentX, bodyY + 86, textW, 28, 17, bold, "#111827");
  drawFittedText(page, fit(registration.organization, 48), contentX, bodyY + 52, textW, 15, 10, regular, "#111827");
  drawFittedText(page, registration.referenceCode, contentX, bodyY + 24, textW, 8.5, 6.5, regular, "#64748B");

  const qrX = cardX + cardW - 96;
  const qrY = bodyY + 42;
  page.drawRectangle({ x: qrX - 7, y: qrY - 7, width: qrSize + 14, height: qrSize + 14, color: hexColor("#FFFFFF") });
  page.drawImage(qrPng, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  page.drawRectangle({ x: cardX, y: cardY, width: cardW, height: footerH, color: hexColor("#111827") });
  drawCenteredText(page, registration.ticketType.toUpperCase(), cardX + cardW / 2, cardY + 13, cardW - 80, 21, 12, bold, "#FFFFFF");

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
