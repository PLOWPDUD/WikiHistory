# WikiHistory Security Specification

## Data Invariants
1. Articles must have a title (max 200 chars), summary (max 2000 chars), and a valid type.
2. Every article must have an `authorId` matching the creator.
3. `createdAt` must be set to the server time on creation and remain immutable.
4. Infobox data must be an array of label/value objects.
5. Sections must be an array of title/content objects.

## Relationship Mapping
- **Articles**: Self-contained. Owned by the creator (`authorId`).

## The Dirty Dozen Payloads (Negative Tests)
1. **Identity Spoof**: Create article with `authorId` = "someone_else".
2. **Identity Spoof (Update)**: Change `authorId` of an existing article.
3. **Malicious ID**: Use a 2KB string as document ID.
4. **Massive Payload**: Article summary > 10,000 characters.
5. **Shadow Field**: Add `isVerified: true` to article.
6. **Immutable Breach**: Attempt to change `createdAt` timestamp.
7. **Type Poisoning**: Set `sections` to a string instead of an array.
8. **Invalid Enum**: Set `type` to "malware".
9. **Timestamp Fraud**: Provide a client-side timestamp instead of `request.time`.
10. **Unauthorized Delete**: Non-author attempts to delete article.
11. **Unauthorized Update**: Non-author attempts to edit article.
12. **Orphan Search**: Unauthenticated user trying to write to a non-existent collection.
