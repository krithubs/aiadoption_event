export type RegistrationStatus = "submitted" | "reviewing" | "approved";

export type SupportingDocument = {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
};

export type Registration = {
  id: string;
  referenceCode: string;
  passwordHash: string;
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  jobTitle: string;
  ticketType: string;
  dietaryNeeds: string;
  accessibilityNeeds: string;
  notes: string;
  status: RegistrationStatus;
  documents: SupportingDocument[];
  createdAt: string;
  updatedAt: string;
};

export type PublicRegistration = Omit<Registration, "passwordHash">;

export type RegistrationInput = {
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  jobTitle: string;
  ticketType: string;
  dietaryNeeds: string;
  accessibilityNeeds: string;
  notes: string;
  password: string;
};
