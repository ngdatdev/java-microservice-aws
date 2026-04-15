/**
 * IAM module — Explicit IAM Roles + Policies cho từng service
 * Best Practice: Mỗi service có IAM Role riêng, quyền cụ thể
 */

export { createAuthServiceIAM, createAuthServiceExecutionRole } from './auth-service-iam';
export type { AuthServiceIAMProps } from './auth-service-iam';

export { createMemberServiceIAM, createMemberServiceExecutionRole } from './member-service-iam';
export type { MemberServiceIAMProps } from './member-service-iam';

export { createFileServiceIAM, createFileServiceExecutionRole } from './file-service-iam';
export type { FileServiceIAMProps } from './file-service-iam';

export { createMailServiceIAM, createMailServiceExecutionRole } from './mail-service-iam';
export type { MailServiceIAMProps } from './mail-service-iam';

export { createMasterServiceIAM, createMasterServiceExecutionRole } from './master-service-iam';
export type { MasterServiceIAMProps } from './master-service-iam';
