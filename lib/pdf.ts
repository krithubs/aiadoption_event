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

function drawCodeMondayLogo(page: PDFPage, x: number, y: number, scale: number, bold: PDFFont) {
  page.drawRectangle({ x: x + 4 * scale, y: y + 40 * scale, width: 18 * scale, height: 48 * scale, color: hexColor("#F11E64") });
  page.drawRectangle({ x: x + 24 * scale, y: y + 40 * scale, width: 23 * scale, height: 48 * scale, color: hexColor("#2F3E8D") });
  page.drawRectangle({ x: x + 9 * scale, y: y + 51 * scale, width: 16 * scale, height: 31 * scale, color: hexColor("#B51B78"), opacity: 0.8 });
  drawText(page, "CODE", x, y + 19 * scale, 23 * scale, bold, "#F11E64");
  drawText(page, "MONDAY", x, y, 21 * scale, bold, "#2F3E8D");
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
  const page = pdf.addPage([420, 620]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const lookupUrl = `${appBaseUrl()}/registration/lookup?ref=${encodeURIComponent(registration.referenceCode)}`;
  const qrPng = await pdf.embedPng(await makeQrPngBytes(lookupUrl));

  const cardX = 70;
  const cardY = 66;
  const cardW = 280;
  const cardH = 468;
  const headerH = 144;
  const footerH = 56;
  const bodyY = cardY + footerH;
  const headerY = cardY + cardH - headerH;
  const contentX = cardX + 30;
  const textW = cardW - 60;
  const qrSize = 54;

  page.drawRectangle({ x: 0, y: 0, width: 420, height: 620, color: hexColor("#F2F4F8") });
  page.drawRectangle({ x: cardX + 8, y: cardY - 9, width: cardW, height: cardH, color: hexColor("#111827"), opacity: 0.18 });
  page.drawRectangle({ x: cardX, y: cardY, width: cardW, height: cardH, color: hexColor("#FFFFFF") });

  drawHeaderArtwork(page, cardX, headerY, cardW, headerH);
  drawCodeMondayLogo(page, cardX + 30, headerY + 32, 0.92, bold);
  drawText(page, "SUMMIT 2026", cardX + 144, headerY + 70, 18, bold, "#FFFFFF");

  page.drawRectangle({ x: cardX, y: bodyY, width: cardW, height: cardH - headerH - footerH, color: hexColor("#F8FAFC") });
  page.drawRectangle({ x: cardX, y: headerY - 1, width: cardW, height: 1.2, color: hexColor("#E5E7EB") });

  drawFittedText(page, fit(registration.fullName, 34), contentX, bodyY + 205, textW, 28, 17, bold, "#111827");
  drawFittedText(page, fit(registration.organization, 46), contentX, bodyY + 164, textW, 15, 10, regular, "#111827");
  drawFittedText(page, registration.referenceCode, contentX, bodyY + 36, textW - 76, 8.5, 6.5, regular, "#64748B");

  const qrX = cardX + cardW - 92;
  const qrY = bodyY + 28;
  page.drawRectangle({ x: qrX - 7, y: qrY - 7, width: qrSize + 14, height: qrSize + 14, color: hexColor("#FFFFFF") });
  page.drawImage(qrPng, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  page.drawRectangle({ x: cardX, y: cardY, width: cardW, height: footerH, color: hexColor("#111827") });
  drawCenteredText(page, registration.ticketType.toUpperCase(), cardX + cardW / 2, cardY + 13, cardW - 80, 21, 12, bold, "#FFFFFF");

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
