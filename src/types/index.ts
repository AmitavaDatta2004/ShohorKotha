
import { GeoPoint, Timestamp } from 'firebase/firestore';

export type Ticket = {
  id: string;
  userId: string;
  title: string;
  category: string;
  notes?: string;
  audioTranscription?: string;
  imageUrls: string[];
  location: GeoPoint;
  address: string;
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
  completionNotes?: string;
  rejectionReason?: string;
  completionImageUrls?: string[];
  completionAnalysis?: string;
  feedback?: { [userId: string]: { rating: number; comment?: string } };
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
  joinedDate: Timestamp;
  badges: string[];
}
