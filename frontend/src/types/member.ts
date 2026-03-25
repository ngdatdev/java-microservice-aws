export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface MemberRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  status: "ACTIVE" | "INACTIVE";
}
