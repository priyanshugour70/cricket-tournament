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

21. [FIXED] Balls faced includes illegal deliveries — Career stats `ballsAsBatsman` now excludes balls where the delivery was a WIDE or NO_BALL, giving accurate strike rate denominators.

MEDIUM: Missing Validations
31. No email format validation on registration. Only checks non-empty string. No RFC validation, no lowercasing. With a case-sensitive unique constraint, A@b.com and a@b.com can be separate accounts.

32. Password policy is length-only. >= 8 characters, no complexity, no breach-list check, no special character requirement.

33. Enum values are cast without validation. PlayerRole, BattingStyle, BowlingStyle, SystemRole, tournament status — all accepted as strings and cast with as. Invalid values reach Prisma and cause 500 errors instead of 400.

34. Tournament creation doesn't validate constraints. minSquadSize > maxSquadSize, negative maxTeams, powerplayOvers > matchOvers, past dates — all accepted.

35. Team creation doesn't enforce maxTeams. You can create a 9th team on a tournament configured for maxTeams: 8.

36. updateSettings doesn't validate ranges. powerplayEnd can be negative, maxOversPerBowler can exceed match overs, penalties can be negative.

37. [FIXED] updateMatch allows arbitrary winningTeamId — Now validated against match's homeTeamId/awayTeamId.

38. isOverseas/isWicketKeeper default to false on update. Using Boolean(body.isOverseas) means omitting the field clears it to false — existing overseas players lose their flag on any update that doesn't re-send it.

MEDIUM: Frontend / UX Bugs
39. Dashboard notifications page is completely broken. It calls GET /api/tournaments/${tournamentId}/notifications (doesn't exist — real route is GET /api/notifications?tournamentId=...) and uses POST for mark-as-read (real route is PATCH). The entire notifications tab 404s.

40. Notification bell badge is hardcoded to 3. The header shows a static "3" badge regardless of actual unread count — never wired to the API.

41. Error states are swallowed across all dashboard pages. Auction, matches, teams, players, settings, points-table, email-logs — all catch errors silently. Users see blank data with no indication of failure.

42. Match detail page: save failures are invisible. patchMatch, addBall, handleCreateInnings all catch errors with no toast/message — the scorer can think a ball was recorded when it wasn't.

43. Player approval button has no error feedback. handleApproval doesn't check res.ok; failed approval still re-fetches the list, making it look successful.

44. RBAC page renders nothing on load failure. If the GET fails, payload stays null and the page returns null — blank screen with no error message.

45. Dashboard layout doesn't handle missing tournament access. Direct URL to a tournament the user hasn't been granted access to shows an empty header with no "no access" message or redirect.

46. fetchJson on public pages treats errors as "not found". Network failures and success: false both return null — users can't distinguish "tournament doesn't exist" from "server is down."

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
