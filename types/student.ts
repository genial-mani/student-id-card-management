export interface Student {
  id: string;
  name: string;
  idNo?: string;
  camSno?: string;
  fatherName?: string;
  fatherPhone?: string;
  address?: string;
  profilePictureUrl?: string;
  className?: string; // Attached dynamically on client
  classId?: string; // Attached dynamically on client
  customValues?: any;
}

