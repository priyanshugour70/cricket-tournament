CRITICAL: Security & Authentication
1. [FIXED] Most API routes have ZERO authentication — ALL mutation routes (POST/PATCH) now require `requireAuth()`. GET routes for public data (tournaments, matches, teams, players, points table, innings, balls, commentary, squads) remain public reads. All admin, notification, mail, S3, registration approval, auction, scoring, and settings mutation routes are now protected.

2. [FIXED] Access token and refresh token are interchangeable — Both now carry a `typ` claim ("access" or "refresh"). `verifyAccessToken` rejects tokens with `typ: "refresh"`. `verifyRefreshToken` rejects tokens without `typ: "refresh"`. A refresh token can no longer be used as a Bearer access token.

3. [FIXED] /api/auth/me echoes whatever raw string is in the Bearer header — Now reissues a fresh access token via `signAccessToken()` instead of echoing the raw header value.

4. [NOTED — ARCHITECTURAL] Tokens stored in localStorage. Any XSS vulnerability exfiltrates both access and refresh tokens. httpOnly cookies would be safer for the refresh token at minimum. This requires a significant architectural change (cookie-based auth flow, CSRF protection, etc.) and is deferred as a future improvement.

5. [FIXED] No rate limiting anywhere — Login, register, and refresh endpoints now use in-memory rate limiting (20 requests/minute per IP). Returns 429 when exceeded.

6. [FIXED] Logout logic has a fall-through gap — Changed from `else if` to sequential logic: if refresh token deletion fails or deletes nothing, the access token branch always runs as a fallback.

7. [FIXED] Notifications API leaks other users' data — GET /api/notifications now requires auth and uses `session.userId` from the token instead of accepting `userId` from query params. Same for /api/notifications/unread-count.

8. [FIXED] Email logs exposed without auth — GET /api/tournaments/[id]/email-logs now requires authentication.

9. [FIXED — INTENTIONALLY PUBLIC] SSE live match stream has no auth — Documented as intentionally public for spectator access. Only exposes match score data, no PII.

HIGH: Cricket Domain Logic Bugs
10. [FIXED] Wickets can exceed 10 — `addBall` now validates `innings.totalWickets >= 10` and rejects with a 400 error before recording.

11. [FIXED] Run-outs credited to the bowler — Career stats (`wicketsAsBowler`) now exclude non-bowler dismissals: RUN_OUT, RETIRED_HURT, RETIRED_OUT, OBSTRUCTING_FIELD, TIMED_OUT, HANDLED_BALL.

12. [FIXED] Dot ball classification is wrong for wickets — `isDot` now requires `ballTotalRuns === 0 AND !isWicket`. A wicket with 0 runs is no longer classified as a dot ball.

13. [FIXED] Extras breakdown never updated — `addBall` now increments the per-type columns (`wides`, `noBalls`, `byes`, `legByes`, `penalties`) on the Innings model alongside the aggregate `extras` total.

14. [FIXED] No validation of extraType vs runs/extraRuns — `extraType` is now validated against the enum set. `extraRuns` is validated as non-negative. Wide/no-ball extra runs are capped at 7 (penalty + max overthrows).

15. [FIXED] Over 0 is rejected, ball 0 is accepted — `overNo` now accepts >= 0 (first over = 0). `ballNo` is validated to be between 1 and 10.

16. [FIXED] TournamentSettings are never read during scoring — The scoring engine now loads `TournamentSettings` for the match's tournament. `wideRunPenalty`, `noBallRunPenalty`, and `maxOversPerBowler` are enforced during `addBall`. Bowler over limits block further deliveries when exceeded.

17. [FIXED] No innings completion logic — Innings auto-completes (status → COMPLETED) when: (a) 10 wickets fall (ALL OUT), or (b) legal balls reach `matchOvers × 6`. Balls cannot be added to completed innings or completed matches.

18. [NOTED — FUTURE WORK] No DLS implementation. DLS (Duckworth-Lewis-Stern) requires a complex statistical model with standard resource tables. The `matchDlsEnabled` flag exists but full target/par calculation is deferred as a major future feature.

19. [FIXED] createInnings allows arbitrary team IDs — `battingTeamId` and `bowlingTeamId` are now validated against the match's `homeTeamId` / `awayTeamId`. Rejects with 400 if teams don't belong to the match.

20. [FIXED] Points table is never auto-updated — `updateMatchResult` now triggers `recalculatePointsTable(tournamentId)` when match status is set to COMPLETED. The recalculate endpoint also now requires authentication.

21. [FIXED] Balls faced includes illegal deliveries — `ballsAsBatsman` in career stats now excludes WIDE and NO_BALL deliveries, counting only legal balls faced.

HIGH: Data Integrity & Race Conditions
22. [FIXED] Auction bidding has no transaction or purse check — `placeBid` now runs inside `prisma.$transaction` with serializable reads. Validates team belongs to tournament, checks purse balance, enforces `minBidIncrement` above the current highest bid, and validates round belongs to the active series.

23. [FIXED] sellPlayer allows negative purse — `newRemaining` is now checked >= 0 before proceeding. Returns 400 "insufficient purse" if the purchase would overdraw.

24. [FIXED] sellPlayer doesn't verify team belongs to tournament — `team.findFirst` now filters by both `id` and `tournamentId`. Cross-tournament squad entries are no longer possible.

25. [FIXED] Registration doesn't check tournament dates or settings — `registerTournamentPlayer` now checks `registrationOpen`, `registrationClose`, and `TournamentSettings.allowLateReg`. Rejects with 400 if registration window hasn't opened or is closed (unless late reg is enabled).

26. [FIXED] Registration number collision under load — Registration number suffix changed from `upsertedPlayer.id.slice(0, 6)` to `Math.random().toString(36).slice(2, 8)` for better entropy. The P2002 unique constraint error is still handled as a 409 fallback.

27. [FIXED] User registration is not transactional — User + Player creation now wrapped in `prisma.$transaction`. If player creation fails, the user is also rolled back.

28. [FIXED] createLinkedPlayerProfile race condition — Catch block now handles Prisma P2002 error, returning 409 "Player profile already linked (concurrent request)" instead of 500.

29. [FIXED] Approve/reject registration has no workflow guard — State machine guard added: only registrations with status `SUBMITTED` or `UNDER_REVIEW` can be approved/rejected. Already-processed registrations return 400 with the current status.

30. [FIXED] setPlayingXI accepts duplicate players — Now validates: (a) teamId is one of the match's teams, (b) all 11 playerIds are unique, (c) all players belong to the team's active squad.

MEDIUM: Missing Validations
31. [FIXED] No email format validation on registration — Email is now validated against RFC-style regex pattern. Email is normalized to lowercase before storage and lookup, preventing case-duplicate accounts.

32. [FIXED] Password policy is length-only — Password now requires: at least 8 characters, at least one uppercase letter, at least one lowercase letter, and at least one digit.

33. [FIXED] Enum values are cast without validation — `createTournament` validates `format` against TournamentFormat enum and `status` against TournamentStatus enum. `createPlayer` validates `role` against PlayerRole, `battingStyle` against BattingStyle, and `bowlingStyle` against BowlingStyle. Invalid values return 400 instead of reaching Prisma.

34. [FIXED] Tournament creation doesn't validate constraints — `maxTeams` must be >= 2. `minSquadSize` cannot exceed `maxSquadSize`. Returns 400 with descriptive message.

35. [FIXED] Team creation doesn't enforce maxTeams — `createTournamentTeam` now queries current team count and rejects with 400 if the tournament's `maxTeams` limit is reached.

36. [FIXED] updateSettings doesn't validate ranges — `powerplayEnd`, `middleOversEnd`, `wideRunPenalty`, `noBallRunPenalty` cannot be negative. `maxOversPerBowler` and `auctionBidTimeSec` must be at least 1. Returns 400 for violations.

37. [FIXED] updateMatch allows arbitrary winningTeamId — Now validated against match's homeTeamId/awayTeamId.

38. [FIXED] isOverseas/isWicketKeeper default to false on update — `updatePlayer` now uses `safeBool()` and only includes these fields in the update data when they are explicitly provided. Omitting them preserves the existing database values.

MEDIUM: Frontend / UX Bugs
39. [FIXED] Dashboard notifications page is completely broken — Fixed API path to `GET /api/notifications?tournamentId=...` and mark-as-read to `PATCH /api/notifications/${id}/read`. Added error state with retry button.

40. [FIXED] Notification bell badge is hardcoded to 3 — Badge now fetches `GET /api/notifications/unread-count` on mount and polls every 60 seconds. Shows actual count (capped display at "9+"), hidden when 0.

41. [FIXED] Error states are swallowed across all dashboard pages — Added `actionError` / `pageError` state to auction, matches, settings, and match detail pages. All mutation failures now surface descriptive error banners with dismiss buttons. Load failures also show error messages.

42. [FIXED] Match detail page: save failures are invisible — `patchMatch`, `addBall`, and `handleCreateInnings` now parse error responses and set `actionError` state. A dismissible error banner is displayed above the innings cards.

43. [FIXED] Player approval button has no error feedback — `handleApproval` now checks `res.ok` and `data.success`. Failed approvals/rejections show an alert with the server's error message. Network errors also surface feedback.

44. [FIXED] RBAC page renders nothing on load failure — When `!payload` and `error` is set, the page now shows a card with the error message and a "Retry" button instead of rendering null.

45. [FIXED] Dashboard layout doesn't handle missing tournament access — When the user is not a system admin and has no `UserTournamentAccess` for the URL's tournament, an "Access Denied" screen is shown with a link back to the dashboard.

46. [FIXED] fetchJson on public pages treats errors as "not found" — Updated all three public pages (tournament detail, match detail, team detail). `fetchJson` now throws typed errors: network failures surface "check your connection", 404 returns null for not-found, and server errors surface the API's error message. The tournament detail page shows a contextual message distinguishing network issues from missing data.

MEDIUM: Schema & Data Model Gaps
47. MatchPlayingXI has no foreign key relations. matchId, teamId, playerId are plain strings with no @relation — database cannot enforce referential integrity.

48. Notification has no FK to User or Tournament. userId and tournamentId are optional strings — stale or invalid IDs are silently allowed.

49. BallByBall player references are unlinked. batsmanId, bowlerId, nonStrikerId, dismissedId, fielderId — five player references with no @relation, no FK enforcement.

50. No cascade delete on tournament subtree. Deleting a tournament doesn't cascade to teams, matches, registrations, etc. — operations fail or leave orphans.

51. No DB constraint for "one winning bid per player per auction". Multiple isWinningBid: true rows for the same player/series are possible.

52. TeamPurseLedger.direction/transactionType/referenceType are free-form strings. No enum or constraint — data quality degrades over time.

53. Missing indexes for common queries. No direct index on BallByBall.matchId (only via innings join), no index on TournamentPlayerRegistration.playerId for cross-tournament queries, no per-tournament points sort index.

54. Enum gaps for real cricket. DismissalType is missing Mankad/hit-the-ball-twice. MatchStage has no Group Stage / Super 4 / Playoff. BowlingStyle has no slow-medium variants.

LOW: Seed Data Inconsistencies
55. Seed Team.purseSpent stays 0 despite ledger debits. Teams are created with purseSpent: 0, purseRemaining: 12000, but the ledger has DEBIT entries. Runtime auction logic updates Team.purseSpent — seed data contradicts this.

56. Innings totalWickets: 7 vs only 1 isWicket in 30 seed balls. Aggregate stats and ball-by-ball data don't reconcile.

57. setPlayingXI requires 11 players but seed creates 3 per team. Seed data would fail the service's own validation.

58. Squad players exist for players with no winning auction bid. Several squad entries reference players whose bids are not marked isWinningBid: true — impossible under real auction rules.

59. LIVE match has narrative highlights ("65/1 after 8 overs") but no innings/ball data. The match detail page would show a blank scorecard.

60. maxTeams: 10 but only 8 IPL teams seeded. Minor inconsistency.

Architecture / Scalability Improvements
61. TournamentDetails type is much narrower than the schema. The API never returns description, logoUrl, bannerUrl, registrationOpen/Close, auctionStartDate, matchOvers, powerplayOvers, isPublic, etc. — the frontend can't display or edit fields that the schema supports.

62. Permission check does an extra DB round-trip on every request. getPermissionKeysForRole queries SystemRolePermission per call with no per-request cache — under load, this multiplies DB hits significantly.

63. No request body size limits. All req.json() calls have no guard — large payloads can cause memory pressure.
