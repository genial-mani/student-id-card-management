export interface Student {
  id: string;
  name: string;
  idNo?: string;
  camSno?: string;
  fatherName?: string;
  motherName?: string;
  fatherPhone?: string;
  motherPhone?: string;
  address?: string;
  profilePictureUrl?: string;
  className?: string; // Attached dynamically on client
  classId?: string; // Attached dynamically on client
}
