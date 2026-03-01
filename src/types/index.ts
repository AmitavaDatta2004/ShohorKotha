import { GeoPoint, Timestamp } from 'firebase/firestore';

export type TicketComment = {
  userId: string;
  userName: string;
  userPhotoURL?: string;
  text: string;
  createdAt: any;
};

export type Ticket = {
  id: string;
  userId: string;
  userPhotoURL?: string; // Creator's profile image
  title: string;
  category: string;
  notes?: string;
  audioTranscription?: string;
  audioUrl?: string; // URL to the recorded voice signal
  imageUrls: string[];
  location: GeoPoint | null;
  address: string;
  pincode?: string;
  status: 'Submitted' | 'In Progress' | 'Pending Approval' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High';
  submittedDate: Date;
  estimatedResolutionDate: Date;
  deadlineDate?: Date;
  severityScore?: number;
  severityReasoning?: string;
  assignedSupervisorId?: string;
  assignedSupervisorName?: string;
  reportCount: number;
  reportedBy: string[];
  likes?: string[];
  comments?: TicketComment[];
  completionNotes?: string;
  rejectionReason?: string;
  completionImageUrls?: string[];
  completionAnalysis?: string | {
    analysis: string;
    isSatisfactory: boolean;
    summary: string;
  };
  feedback?: { [userId: string]: { rating: number; comment?: string } };
  isPublicFeed?: boolean;
  isVoiceReport?: boolean;
  callerNumber?: string;
};

export type Supervisor = {
    id: string;
    userId: string;
    name: string;
    password?: string;
    department: string;
    phoneNumber: string;
    municipalId: string;
    aiImageWarningCount?: number;
    trustPoints?: number;
    efficiencyPoints?: number;
}

export type Municipality = {
    id: string;
    name: string;
    userId: string;
}

export type UserProfile = {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  utilityPoints: number;
  trustPoints: number;
  reportCount: number;
  joinedDate: Timestamp | Date;
  badges: string[];
  phoneNumber?: string;
}
