# Security Specification - KDKMP Digital

## Data Invariants
1. A user profile (`users/{uid}`) must have a valid role and match the authenticated user's UID.
2. A registration (`registrations/{id}`) can be created by anyone but must start with 'pending' status and have valid contact/cooperative data.
3. Koperasi data (`koperasi/{id}`) can only be modified by its owner (admin_koperasi) or a Super Admin.
4. Membership and transactional data (anggota, simpanan, pembayaran) belong to a specific Koperasi and access is derived from the user's role and Koperasi affiliation.
5. Critical status fields (approved, active) can only be set/modified by Super Admins.

## The Dirty Dozen Payloads (Target: Rejection)

1. **Identity Spoofing**: Creating a user profile with a different UID than `auth.uid`.
2. **Privilege Escalation**: Creating/Updating a user profile with `role: 'super_admin'`.
3. **Ghost Fields**: Adding `isVerified: true` to a user profile or registration.
4. **State Shortcut**: Creating a registration with `status: 'approved'`.
5. **Relation Hijacking**: Updating a Koperasi with a different `ownerId`.
6. **Unauthorized Read**: An 'anggota' trying to read 'pembayaran' of another 'anggota'.
7. **Resource Poisoning**: Document IDs with 2KB junk strings (must fail `isValidId`).
8. **PII Leak**: Reading `users` collection without proper authentication or as a non-owner/non-admin.
9. **Mutation Gap**: Changing `createdAt` on a user profile.
10. **Type Poisoning**: Sending `namaKoperasi: true` (boolean instead of string).
11. **Boundary Breach**: Sending a 1MB string in a field limited to 200 chars.
12. **Unverified Write**: Writing to `koperasi` as an unverified email user (if strictly enforced).

## Field-Level Validation Helper

```javascript
function isValidUser(data) {
  return data.keys().hasAll(['uid', 'email', 'displayName', 'role', 'status', 'createdAt']) &&
         data.uid is string && data.uid.size() <= 128 &&
         data.email is string && data.email.size() <= 256 &&
         data.displayName is string && data.displayName.size() <= 100 &&
         data.role in ['super_admin', 'admin_koperasi', 'anggota', 'bendahara', 'bendahara_koperasi'] &&
         data.status in ['active', 'inactive', 'pending'] &&
         data.createdAt is timestamp;
}
```
