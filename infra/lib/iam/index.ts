/**
 * IAM module — Explicit IAM Roles + Policies cho từng service
 * Best Practice: Mỗi service có IAM Role riêng, quyền cụ thể
 */

export { createAuthServiceIAM, createAuthServiceExecutionRole } from './auth-service-iam';
export type { AuthServiceIAMProps, AuthServiceExecutionRoleProps } from './auth-service-iam';

export { createMemberServiceIAM, createMemberServiceExecutionRole } from './member-service-iam';
export type { MemberServiceIAMProps, MemberServiceExecutionRoleProps } from './member-service-iam';

export { createFileServiceIAM, createFileServiceExecutionRole } from './file-service-iam';
export type { FileServiceIAMProps, FileServiceExecutionRoleProps } from './file-service-iam';

export { createMailServiceIAM, createMailServiceExecutionRole } from './mail-service-iam';
export type { MailServiceIAMProps, MailServiceExecutionRoleProps } from './mail-service-iam';

export { createMasterServiceIAM, createMasterServiceExecutionRole } from './master-service-iam';
export type { MasterServiceIAMProps, MasterServiceExecutionRoleProps } from './master-service-iam';
