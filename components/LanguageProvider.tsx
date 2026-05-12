"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Language = "en" | "th";

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const translations: Record<Language, Record<string, string>> = {
  en: {
    register: "Register",
    myRegistration: "My Registration",
    adminConsole: "Admin Console",
    attendeeDetails: "Attendee details",
    editSubmission: "Edit submission",
    requiredUsage: "All required fields are used for admission, name tag, and event communications.",
    fullName: "Full name",
    email: "Email",
    phone: "Phone",
    organization: "Organization",
    jobTitle: "Job title",
    ticketType: "Ticket type",
    dietaryNeeds: "Food allergies",
    accessibilityNeeds: "Accessibility needs",
    notes: "Additional notes",
    documents: "Supporting documents",
    phoneHint: "Numbers only, 9 to 15 digits. Do not include spaces, dashes, or +.",
    documentHint: "Upload PDF, PNG, JPG, or DOCX files. Each file can be up to 8 MB.",
    documentMode: "Document update mode",
    appendDocuments: "Add uploaded documents to current file set",
    replaceDocuments: "Replace current documents with uploaded files",
    setPassword: "Set password",
    confirmPassword: "Confirm password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    passwordHint: "At least 8 characters, with one letter and one number.",
    submitRegistration: "Submit registration",
    saveChanges: "Save changes",
    saving: "Saving...",
    attachedDocuments: "Documents are attached to this registration record.",
    fixHighlighted: "Please fix the highlighted fields",
    registrationNotSaved: "Registration not saved",
    registrationUpdated: "Registration updated",
    updateSaved: "Your latest details and document changes have been saved.",
    reviewStatus: "Review status",
    reviewDashboard: "Review dashboard",
    totalSubmissions: "total submissions",
    refresh: "Refresh",
    signOut: "Sign out",
    attendeeQueue: "Attendee queue",
    queueSearchHelp: "Search by name, email, company, code, ticket, or status.",
    searchRegistrations: "Search registrations",
    loadingRegistrations: "Loading registrations...",
    noRegistrations: "No registrations match this view.",
    attendeeProfile: "Attendee profile",
    selectSubmission: "Select a submission",
    selectToReview: "Select a registration to review details.",
    tagPdf: "Tag PDF",
    name: "Name",
    ticket: "Ticket",
    dietary: "Food allergies",
    accessibility: "Accessibility",
    supportingDocuments: "Supporting documents",
    download: "Download",
    statusNotUpdated: "Status not updated",
    statusUpdated: "Status updated",
    signedOut: "Signed out",
    sessionClosed: "Admin session has been closed.",
    none: "None",
  },
  th: {
    register: "ลงทะเบียน",
    myRegistration: "ข้อมูลลงทะเบียนของฉัน",
    adminConsole: "แผงผู้ดูแล",
    attendeeDetails: "ข้อมูลผู้เข้าร่วม",
    editSubmission: "แก้ไขข้อมูลลงทะเบียน",
    requiredUsage: "ข้อมูลที่จำเป็นใช้สำหรับการเข้างาน ป้ายชื่อ และการติดต่อจากทีมงาน",
    fullName: "ชื่อ-นามสกุล",
    email: "อีเมล",
    phone: "เบอร์โทร",
    organization: "องค์กร",
    jobTitle: "ตำแหน่งงาน",
    ticketType: "ประเภทบัตร",
    dietaryNeeds: "ข้อมูลแพ้อาหาร",
    accessibilityNeeds: "ความช่วยเหลือพิเศษ",
    notes: "หมายเหตุเพิ่มเติม",
    documents: "เอกสารประกอบ",
    phoneHint: "ใส่เฉพาะตัวเลข 9-15 หลัก ห้ามมีเว้นวรรค ขีด หรือเครื่องหมาย +",
    documentHint: "อัปโหลดไฟล์ PDF, PNG, JPG หรือ DOCX ขนาดไม่เกิน 8 MB ต่อไฟล์",
    documentMode: "วิธีจัดการเอกสาร",
    appendDocuments: "เพิ่มเอกสารใหม่ต่อจากชุดเดิม",
    replaceDocuments: "แทนที่เอกสารเดิมทั้งหมดด้วยไฟล์ใหม่",
    setPassword: "ตั้งรหัสผ่าน",
    confirmPassword: "ยืนยันรหัสผ่าน",
    showPassword: "แสดงรหัสผ่าน",
    hidePassword: "ซ่อนรหัสผ่าน",
    passwordHint: "อย่างน้อย 8 ตัวอักษร และต้องมีตัวอักษรกับตัวเลข",
    submitRegistration: "ส่งข้อมูลลงทะเบียน",
    saveChanges: "บันทึกการแก้ไข",
    saving: "กำลังบันทึก...",
    attachedDocuments: "เอกสารถูกแนบไว้กับข้อมูลลงทะเบียนนี้",
    fixHighlighted: "กรุณาแก้ไขช่องที่ถูกไฮไลต์",
    registrationNotSaved: "ยังบันทึกข้อมูลไม่ได้",
    registrationUpdated: "อัปเดตข้อมูลแล้ว",
    updateSaved: "บันทึกรายละเอียดและเอกสารล่าสุดเรียบร้อยแล้ว",
    reviewStatus: "สถานะการตรวจสอบ",
    reviewDashboard: "แดชบอร์ดตรวจสอบ",
    totalSubmissions: "รายการลงทะเบียนทั้งหมด",
    refresh: "รีเฟรช",
    signOut: "ออกจากระบบ",
    attendeeQueue: "คิวผู้เข้าร่วม",
    queueSearchHelp: "ค้นหาด้วยชื่อ อีเมล บริษัท รหัส ประเภทบัตร หรือสถานะ",
    searchRegistrations: "ค้นหารายการลงทะเบียน",
    loadingRegistrations: "กำลังโหลดรายการ...",
    noRegistrations: "ไม่พบรายการที่ตรงกับเงื่อนไข",
    attendeeProfile: "โปรไฟล์ผู้เข้าร่วม",
    selectSubmission: "เลือกรายการลงทะเบียน",
    selectToReview: "เลือกรายการลงทะเบียนเพื่อดูรายละเอียด",
    tagPdf: "ดาวน์โหลดป้าย PDF",
    name: "ชื่อ",
    ticket: "บัตร",
    dietary: "แพ้อาหาร",
    accessibility: "ความช่วยเหลือ",
    supportingDocuments: "เอกสารประกอบ",
    download: "ดาวน์โหลด",
    statusNotUpdated: "ยังอัปเดตสถานะไม่ได้",
    statusUpdated: "อัปเดตสถานะแล้ว",
    signedOut: "ออกจากระบบแล้ว",
    sessionClosed: "ปิด session ผู้ดูแลเรียบร้อยแล้ว",
    none: "ไม่มี",
  },
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("cmd-event-language");
    if (stored === "th" || stored === "en") setLanguageState(stored);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    return {
      language,
      setLanguage: (nextLanguage) => {
        setLanguageState(nextLanguage);
        window.localStorage.setItem("cmd-event-language", nextLanguage);
      },
      t: (key) => translations[language][key] || translations.en[key] || key,
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within LanguageProvider");
  return context;
}

export function translateServerError(message: string, language: Language): string {
  if (language === "en") return message;

  const map: Record<string, string> = {
    "Enter the attendee full name.": "กรุณากรอกชื่อ-นามสกุลผู้เข้าร่วม",
    "Full name must be 80 characters or less.": "ชื่อ-นามสกุลต้องไม่เกิน 80 ตัวอักษร",
    "Enter a valid email address, for example name@example.com.": "กรุณากรอกอีเมลให้ถูกต้อง เช่น name@example.com",
    "Phone must contain numbers only, 9 to 15 digits.": "เบอร์โทรต้องเป็นตัวเลขเท่านั้น ความยาว 9-15 หลัก",
    "Enter the attendee organization.": "กรุณากรอกชื่อองค์กร",
    "Organization must be 100 characters or less.": "ชื่อองค์กรต้องไม่เกิน 100 ตัวอักษร",
    "Enter the attendee job title.": "กรุณากรอกตำแหน่งงาน",
    "Job title must be 80 characters or less.": "ตำแหน่งงานต้องไม่เกิน 80 ตัวอักษร",
    "Choose a valid ticket type.": "กรุณาเลือกประเภทบัตรให้ถูกต้อง",
    "Password must be at least 8 characters.": "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
    "Password must include at least one letter and one number.": "รหัสผ่านต้องมีตัวอักษรและตัวเลขอย่างน้อยอย่างละหนึ่งตัว",
    "Food allergies must be 120 characters or less.": "ข้อมูลแพ้อาหารต้องไม่เกิน 120 ตัวอักษร",
    "Accessibility needs must be 120 characters or less.": "ข้อมูลความช่วยเหลือพิเศษต้องไม่เกิน 120 ตัวอักษร",
    "Notes must be 800 characters or less.": "หมายเหตุต้องไม่เกิน 800 ตัวอักษร",
    "Upload at least one supporting document.": "กรุณาอัปโหลดเอกสารประกอบอย่างน้อยหนึ่งไฟล์",
    "Uploaded documents cannot be empty.": "ไฟล์เอกสารต้องไม่เป็นไฟล์ว่าง",
    "Each document must be 8 MB or smaller.": "เอกสารแต่ละไฟล์ต้องมีขนาดไม่เกิน 8 MB",
    "Documents must be PDF, PNG, JPG, or DOCX.": "เอกสารต้องเป็นไฟล์ PDF, PNG, JPG หรือ DOCX",
  };

  return map[message] || message;
}
