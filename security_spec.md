# Security Specification & Hardening Plan

## 1. Data Invariants
1. **Competition & Scores Integrity**: Only verified Admins (`isAdmin()`) may create, update, or reset `/competition/{configId}`, `/teams/{teamId}`, or `/roundAwards/{awardId}`. Standard authenticated users have strictly read-only (`get`, `list`) access to live competition state, teams, and round awards.
2. **No Self-Assigned Admin Privilege**: A standard user creating `/users/{userId}` can ONLY set `role: 'user'` and `uid == request.auth.uid`, and cannot write to `/admins/{userId}` unless they are already a verified Admin or the bootstrapped owner email (`22is-suhail0077@yit.edu.in` with `email_verified == true`).
3. **PII Isolation**: User email addresses are stored exclusively in `/users/{userId}/private/info`, readable only by the owner (`request.auth.uid == userId`) or an Admin (`isAdmin()`). Public `/users/{userId}` contains zero email/PII fields.
4. **Strict Schema & Size Bounds**: Every write validates exact required + allowed keys (`hasAll` + `hasOnly`), string `.size()` bounds, numeric range bounds (`score >= 0`, `activeRoundId >= 1 && activeRoundId <= 8`), regex ID formats (`^[a-zA-Z0-9_\-]+$`), and server timestamps (`request.time`).
5. **Email Verification Mandate**: All standard write operations require `request.auth.token.email_verified == true`.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated Read of Teams**: Unauthenticated `list` on `/teams` -> DENIED.
2. **Unauthenticated Write to Competition**: Unauthenticated `setDoc` on `/competition/main` -> DENIED.
3. **Non-Admin Score Tampering**: Standard user `update` on `/teams/team-1` changing `score` to `999999` -> DENIED.
4. **Non-Admin Round Award Injection**: Standard user `create` on `/roundAwards/fake-1` -> DENIED.
5. **Privilege Escalation in User Profile**: Standard user `create` on `/users/{uid}` with `role: 'admin'` -> DENIED.
6. **Profile Role Mutation**: Standard user `update` on `/users/{uid}` attempting to change `role` from `'user'` to `'admin'` -> DENIED.
7. **Shadow Ghost Field Injection**: Admin `create` on `/teams/team-1` including extra field `ghostFlag: true` -> DENIED (`hasOnly` rejects).
8. **Invalid Document ID Poisoning**: Admin `create` on `/teams/bad$id!with*spaces` -> DENIED (`isValidId` rejects).
9. **Client-Spoofed Timestamp**: Admin `create` on `/roundAwards/a1` with client `createdAt` instead of `serverTimestamp()` (`request.time`) -> DENIED.
10. **Out-of-Bounds Negative Score**: Admin `update` on `/teams/team-1` with `score: -500` -> DENIED.
11. **PII Cross-User Read**: User A attempting `get` on `/users/{userB}/private/info` -> DENIED.
12. **Unverified Email Spoof**: User with `email: '22is-suhail0077@yit.edu.in'` and `email_verified: false` attempting admin write -> DENIED.
