import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const hash = bcrypt.hashSync("Password123!", 12);

async function main() {
  console.log("Seeding database...");

  await prisma.ballByBall.deleteMany();
  await prisma.commentary.deleteMany();
  await prisma.innings.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.pointsTableEntry.deleteMany();
  await prisma.auctionBid.deleteMany();
  await prisma.auctionRound.deleteMany();
  await prisma.auctionSeries.deleteMany();
  await prisma.teamSquadPlayer.deleteMany();
  await prisma.teamPurseLedger.deleteMany();
  await prisma.tournamentPlayerRegistration.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.player.deleteMany();
  await prisma.userTournamentAccess.deleteMany();
  await prisma.session.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.user.deleteMany();

  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@cricketpro.com",
      passwordHash: hash,
      firstName: "Rahul",
      lastName: "Sharma",
      displayName: "Rahul Sharma",
      phone: "+91-9876543210",
      systemRole: "SUPER_ADMIN",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      loginCount: 42,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: "organizer@cricketpro.com",
      passwordHash: hash,
      firstName: "Priya",
      lastName: "Patel",
      displayName: "Priya Patel",
      phone: "+91-9876543211",
      systemRole: "ADMIN",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      loginCount: 18,
    },
  });

  const ipl = await prisma.tournament.create({
    data: {
      code: "IPL2026",
      name: "Indian Premier League",
      shortName: "IPL",
      description: "The biggest T20 cricket league in the world",
      season: 2026,
      format: "T20",
      status: "LIVE",
      organizerName: "BCCI",
      organizerEmail: "ipl@bcci.tv",
      venueCity: "Mumbai",
      country: "India",
      timezone: "Asia/Kolkata",
      registrationOpen: new Date("2025-11-01"),
      registrationClose: new Date("2025-12-31"),
      auctionStartDate: new Date("2026-01-15"),
      startsOn: new Date("2026-03-22"),
      endsOn: new Date("2026-05-30"),
      maxTeams: 10,
      minSquadSize: 18,
      maxSquadSize: 25,
      overseasLimit: 4,
      retentionLimit: 5,
      pursePerTeam: 12000,
      matchOvers: 20,
      powerplayOvers: 6,
      pointsForWin: 2,
      pointsForTie: 1,
      pointsForNR: 1,
      nrrEnabled: true,
      isPublic: true,
    },
  });

  const bbl = await prisma.tournament.create({
    data: {
      code: "BBL2026",
      name: "Big Bash League",
      shortName: "BBL",
      description: "Australia's premier T20 cricket competition",
      season: 2026,
      format: "T20",
      status: "REGISTRATION_OPEN",
      organizerName: "Cricket Australia",
      organizerEmail: "bbl@cricket.com.au",
      venueCity: "Melbourne",
      country: "Australia",
      timezone: "Australia/Melbourne",
      registrationOpen: new Date("2026-06-01"),
      registrationClose: new Date("2026-08-31"),
      auctionStartDate: new Date("2026-09-15"),
      startsOn: new Date("2026-12-05"),
      endsOn: new Date("2027-02-04"),
      maxTeams: 8,
      minSquadSize: 15,
      maxSquadSize: 21,
      overseasLimit: 3,
      retentionLimit: 4,
      pursePerTeam: 8000,
      matchOvers: 20,
      powerplayOvers: 4,
      pointsForWin: 2,
      pointsForTie: 1,
      pointsForNR: 1,
      nrrEnabled: true,
      isPublic: true,
    },
  });

  const iplTeamData = [
    { code: "MI", name: "Mumbai Indians", shortName: "MI", city: "Mumbai", homeGround: "Wankhede Stadium", primaryColor: "#004BA0", secondaryColor: "#D4AF37", ownerName: "Nita Ambani" },
    { code: "CSK", name: "Chennai Super Kings", shortName: "CSK", city: "Chennai", homeGround: "MA Chidambaram Stadium", primaryColor: "#FFCC00", secondaryColor: "#FF6600", ownerName: "N Srinivasan" },
    { code: "RCB", name: "Royal Challengers Bengaluru", shortName: "RCB", city: "Bengaluru", homeGround: "M Chinnaswamy Stadium", primaryColor: "#EC1C24", secondaryColor: "#2B2A29", ownerName: "Prathmesh Mishra" },
    { code: "KKR", name: "Kolkata Knight Riders", shortName: "KKR", city: "Kolkata", homeGround: "Eden Gardens", primaryColor: "#3A225D", secondaryColor: "#B3A123", ownerName: "Shah Rukh Khan" },
    { code: "DC", name: "Delhi Capitals", shortName: "DC", city: "Delhi", homeGround: "Arun Jaitley Stadium", primaryColor: "#0078BC", secondaryColor: "#EF1B23", ownerName: "Parth Jindal" },
    { code: "SRH", name: "Sunrisers Hyderabad", shortName: "SRH", city: "Hyderabad", homeGround: "Rajiv Gandhi Intl Stadium", primaryColor: "#FF822A", secondaryColor: "#000000", ownerName: "Kavya Maran" },
    { code: "RR", name: "Rajasthan Royals", shortName: "RR", city: "Jaipur", homeGround: "Sawai Mansingh Stadium", primaryColor: "#EA1A85", secondaryColor: "#254AA5", ownerName: "Manoj Badale" },
    { code: "PBKS", name: "Punjab Kings", shortName: "PBKS", city: "Mohali", homeGround: "IS Bindra Stadium", primaryColor: "#ED1B24", secondaryColor: "#A7A9AC", ownerName: "Ness Wadia" },
  ];

  const iplTeams = await Promise.all(
    iplTeamData.map((t) =>
      prisma.team.create({
        data: {
          tournamentId: ipl.id,
          ...t,
          status: "ACTIVE",
          purseTotal: 12000,
          purseSpent: 0,
          purseRemaining: 12000,
          squadMin: 18,
          squadMax: 25,
          overseasMax: 4,
        },
      })
    )
  );

  const bblTeamData = [
    { code: "SS", name: "Sydney Sixers", shortName: "SIX", city: "Sydney", homeGround: "SCG", primaryColor: "#FF00FF", secondaryColor: "#000000", ownerName: "Cricket NSW" },
    { code: "ST", name: "Sydney Thunder", shortName: "THU", city: "Sydney", homeGround: "Sydney Showground", primaryColor: "#00FF00", secondaryColor: "#000000", ownerName: "Cricket NSW" },
    { code: "MS", name: "Melbourne Stars", shortName: "STA", city: "Melbourne", homeGround: "MCG", primaryColor: "#00B140", secondaryColor: "#FFFFFF", ownerName: "Cricket Victoria" },
    { code: "MR", name: "Melbourne Renegades", shortName: "REN", city: "Melbourne", homeGround: "Marvel Stadium", primaryColor: "#FF0000", secondaryColor: "#000000", ownerName: "Cricket Victoria" },
    { code: "BH", name: "Brisbane Heat", shortName: "HEA", city: "Brisbane", homeGround: "The Gabba", primaryColor: "#00BCD4", secondaryColor: "#FF5722", ownerName: "Cricket QLD" },
    { code: "AS", name: "Adelaide Strikers", shortName: "STR", city: "Adelaide", homeGround: "Adelaide Oval", primaryColor: "#009FDF", secondaryColor: "#FFFFFF", ownerName: "Cricket SA" },
    { code: "PS", name: "Perth Scorchers", shortName: "SCO", city: "Perth", homeGround: "Optus Stadium", primaryColor: "#FF6600", secondaryColor: "#000000", ownerName: "Cricket WA" },
    { code: "HH", name: "Hobart Hurricanes", shortName: "HUR", city: "Hobart", homeGround: "Bellerive Oval", primaryColor: "#7B2D8E", secondaryColor: "#FFD700", ownerName: "Cricket TAS" },
  ];

  const bblTeams = await Promise.all(
    bblTeamData.map((t) =>
      prisma.team.create({
        data: {
          tournamentId: bbl.id,
          ...t,
          status: "ACTIVE",
          purseTotal: 8000,
          purseSpent: 0,
          purseRemaining: 8000,
          squadMin: 15,
          squadMax: 21,
          overseasMax: 3,
        },
      })
    )
  );

  const playerData = [
    { firstName: "Virat", lastName: "Kohli", displayName: "Virat Kohli", nationality: "India", state: "Delhi", role: "BATTER" as const, battingStyle: "RIGHT_HAND" as const, bowlingStyle: "RIGHT_ARM_MEDIUM" as const, isOverseas: false, isCapped: true, t20Matches: 260, odiMatches: 292, testMatches: 120, battingRating: 95, bowlingRating: 15, basePrice: 200 },
    { firstName: "Rohit", lastName: "Sharma", displayName: "Rohit Sharma", nationality: "India", state: "Maharashtra", role: "BATTER" as const, battingStyle: "RIGHT_HAND" as const, bowlingStyle: "RIGHT_ARM_OFF_SPIN" as const, isOverseas: false, isCapped: true, t20Matches: 240, odiMatches: 265, testMatches: 65, battingRating: 92, bowlingRating: 10, basePrice: 200 },
    { firstName: "Jasprit", lastName: "Bumrah", displayName: "Jasprit Bumrah", nationality: "India", state: "Gujarat", role: "BOWLER" as const, battingStyle: "RIGHT_HAND" as const, bowlingStyle: "RIGHT_ARM_FAST" as const, isOverseas: false, isCapped: true, t20Matches: 130, odiMatches: 89, testMatches: 45, battingRating: 10, bowlingRating: 97, basePrice: 200 },
    { firstName: "Suryakumar", lastName: "Yadav", displayName: "Suryakumar Yadav", nationality: "India", state: "Maharashtra", role: "BATTER" as const, battingStyle: "RIGHT_HAND" as const, bowlingStyle: null, isOverseas: false, isCapped: true, t20Matches: 95, odiMatches: 50, testMatches: 8, battingRating: 90, bowlingRating: 5, basePrice: 150 },
    { firstName: "Ravindra", lastName: "Jadeja", displayName: "Ravindra Jadeja", nationality: "India", state: "Gujarat", role: "ALL_ROUNDER" as const, battingStyle: "LEFT_HAND" as const, bowlingStyle: "LEFT_ARM_ORTHODOX" as const, isOverseas: false, isCapped: true, t20Matches: 82, odiMatches: 195, testMatches: 75, battingRating: 75, bowlingRating: 82, basePrice: 150 },
    { firstName: "Rishabh", lastName: "Pant", displayName: "Rishabh Pant", nationality: "India", state: "Delhi", role: "WICKET_KEEPER" as const, battingStyle: "LEFT_HAND" as const, bowlingStyle: null, isOverseas: false, isCapped: true, isWicketKeeper: true, t20Matches: 75, odiMatches: 35, testMatches: 38, battingRating: 82, bowlingRating: 0, basePrice: 150 },
    { firstName: "Hardik", lastName: "Pandya", displayName: "Hardik Pandya", nationality: "India", state: "Gujarat", role: "ALL_ROUNDER" as const, battingStyle: "RIGHT_HAND" as const, bowlingStyle: "RIGHT_ARM_FAST" as const, isOverseas: false, isCapped: true, t20Matches: 110, odiMatches: 85, testMatches: 15, battingRating: 78, bowlingRating: 72, basePrice: 150 },
    { firstName: "Yuzvendra", lastName: "Chahal", displayName: "Yuzvendra Chahal", nationality: "India", state: "Haryana", role: "BOWLER" as const, battingStyle: "RIGHT_HAND" as const, bowlingStyle: "RIGHT_ARM_LEG_SPIN" as const, isOverseas: false, isCapped: true, t20Matches: 92, odiMatches: 82, testMatches: 0, battingRating: 5, bowlingRating: 85, basePrice: 100 },
    { firstName: "Shubman", lastName: "Gill", displayName: "Shubman Gill", nationality: "India", state: "Punjab", role: "BATTER" as const, battingStyle: "RIGHT_HAND" as const, bowlingStyle: null, isOverseas: false, isCapped: true, t20Matches: 55, odiMatches: 45, testMatches: 30, battingRating: 85, bowlingRating: 5, basePrice: 100 },
    { firstName: "Mohammed", lastName: "Siraj", displayName: "Mohammed Siraj", nationality: "India", state: "Telangana", role: "BOWLER" as const, battingStyle: "RIGHT_HAND" as const, bowlingStyle: "RIGHT_ARM_FAST" as const, isOverseas: false, isCapped: true, t20Matches: 35, odiMatches: 45, testMatches: 32, battingRating: 5, bowlingRating: 80, basePrice: 100 },
    { firstName: "Yashasvi", lastName: "Jaiswal", displayName: "Yashasvi Jaiswal", nationality: "India", state: "Rajasthan", role: "BATTER" as const, battingStyle: "LEFT_HAND" as const, bowlingStyle: null, isOverseas: false, isCapped: true, t20Matches: 40, odiMatches: 15, testMatches: 18, battingRating: 88, bowlingRating: 5, basePrice: 100 },
    { firstName: "Kuldeep", lastName: "Yadav", displayName: "Kuldeep Yadav", nationality: "India", state: "Uttar Pradesh", role: "BOWLER" as const, battingStyle: "LEFT_HAND" as const, bowlingStyle: "LEFT_ARM_WRIST_SPIN" as const, isOverseas: false, isCapped: true, t20Matches: 45, odiMatches: 80, testMatches: 15, battingRating: 10, bowlingRating: 83, basePrice: 100 },
    { firstName: "Sanju", lastName: "Samson", displayName: "Sanju Samson", nationality: "India", state: "Kerala", role: "WICKET_KEEPER" as const, battingStyle: "RIGHT_HAND" as const, bowlingStyle: null, isOverseas: false, isCapped: true, isWicketKeeper: true, t20Matches: 35, odiMatches: 20, testMatches: 2, battingRating: 80, bowlingRating: 0, basePrice: 100 },
    { firstName: "Axar", lastName: "Patel", displayName: "Axar Patel", nationality: "India", state: "Gujarat", role: "ALL_ROUNDER" as const, battingStyle: "LEFT_HAND" as const, bowlingStyle: "LEFT_ARM_ORTHODOX" as const, isOverseas: false, isCapped: true, t20Matches: 55, odiMatches: 30, testMatches: 12, battingRating: 65, bowlingRating: 78, basePrice: 100 },
    { firstName: "Arshdeep", lastName: "Singh", displayName: "Arshdeep Singh", nationality: "India", state: "Punjab", role: "BOWLER" as const, battingStyle: "LEFT_HAND" as const, bowlingStyle: "LEFT_ARM_FAST" as const, isOverseas: false, isCapped: true, t20Matches: 60, odiMatches: 30, testMatches: 5, battingRating: 5, bowlingRating: 82, basePrice: 100 },
    { firstName: "Rinku", lastName: "Singh", displayName: "Rinku Singh", nationality: "India", state: "Uttar Pradesh", role: "BATTER" as const, battingStyle: "LEFT_HAND" as const, bowlingStyle: null, isOverseas: false, isCapped: true, t20Matches: 30, odiMatches: 8, testMatches: 0, battingRating: 78, bowlingRating: 5, basePrice: 75 },
    { firstName: "Abhishek", lastName: "Sharma", displayName: "Abhishek Sharma", nationality: "India", state: "Punjab", role: "ALL_ROUNDER" as const, battingStyle: "LEFT_HAND" as const, bowlingStyle: "LEFT_ARM_ORTHODOX" as const, isOverseas: false, isCapped: true, t20Matches: 22, odiMatches: 5, testMatches: 0, battingRating: 75, bowlingRating: 45, basePrice: 50 },
    { firstName: "Dhruv", lastName: "Jurel", displayName: "Dhruv Jurel", nationality: "India", state: "Uttar Pradesh", role: "WICKET_KEEPER" as const, battingStyle: "RIGHT_HAND" as const, bowlingStyle: null, isOverseas: false, isCapped: true, isWicketKeeper: true, t20Matches: 10, odiMatches: 0, testMatches: 8, battingRating: 70, bowlingRating: 0, basePrice: 50 },
    { firstName: "Nitish", lastName: "Reddy", displayName: "Nitish Kumar Reddy", nationality: "India", state: "Andhra Pradesh", role: "ALL_ROUNDER" as const, battingStyle: "RIGHT_HAND" as const, bowlingStyle: "RIGHT_ARM_MEDIUM" as const, isOverseas: false, isCapped: true, t20Matches: 15, odiMatches: 5, testMatches: 10, battingRating: 72, bowlingRating: 55, basePrice: 50 },
    { firstName: "Tilak", lastName: "Varma", displayName: "Tilak Varma", nationality: "India", state: "Telangana", role: "BATTER" as const, battingStyle: "LEFT_HAND" as const, bowlingStyle: null, isOverseas: false, isCapped: true, t20Matches: 25, odiMatches: 5, testMatches: 8, battingRating: 77, bowlingRating: 10, basePrice: 50 },
    { firstName: "Pat", lastName: "Cummins", displayName: "Pat Cummins", nationality: "Australia", state: null, role: "BOWLER" as const, battingStyle: "RIGHT_HAND" as const, bowlingStyle: "RIGHT_ARM_FAST" as const, isOverseas: true, isCapped: true, t20Matches: 75, odiMatches: 85, testMatches: 65, battingRating: 30, bowlingRating: 90, basePrice: 200 },
    { firstName: "Travis", lastName: "Head", displayName: "Travis Head", nationality: "Australia", state: null, role: "BATTER" as const, battingStyle: "LEFT_HAND" as const, bowlingStyle: "RIGHT_ARM_OFF_SPIN" as const, isOverseas: true, isCapped: true, t20Matches: 40, odiMatches: 55, testMatches: 55, battingRating: 86, bowlingRating: 20, basePrice: 150 },
    { firstName: "Jos", lastName: "Buttler", displayName: "Jos Buttler", nationality: "England", state: null, role: "WICKET_KEEPER" as const, battingStyle: "RIGHT_HAND" as const, bowlingStyle: null, isOverseas: true, isCapped: true, isWicketKeeper: true, t20Matches: 120, odiMatches: 175, testMatches: 60, battingRating: 88, bowlingRating: 0, basePrice: 200 },
    { firstName: "Rashid", lastName: "Khan", displayName: "Rashid Khan", nationality: "Afghanistan", state: null, role: "BOWLER" as const, battingStyle: "RIGHT_HAND" as const, bowlingStyle: "RIGHT_ARM_LEG_SPIN" as const, isOverseas: true, isCapped: true, t20Matches: 400, odiMatches: 115, testMatches: 8, battingRating: 40, bowlingRating: 93, basePrice: 200 },
    { firstName: "Mitchell", lastName: "Starc", displayName: "Mitchell Starc", nationality: "Australia", state: null, role: "BOWLER" as const, battingStyle: "LEFT_HAND" as const, bowlingStyle: "LEFT_ARM_FAST" as const, isOverseas: true, isCapped: true, t20Matches: 60, odiMatches: 115, testMatches: 85, battingRating: 15, bowlingRating: 91, basePrice: 200 },
  ];

  const players = await Promise.all(
    playerData.map((p, i) =>
      prisma.player.create({
        data: {
          code: `PLR${String(i + 1).padStart(4, "0")}`,
          firstName: p.firstName,
          lastName: p.lastName,
          displayName: p.displayName,
          nationality: p.nationality,
          state: p.state,
          role: p.role,
          battingStyle: p.battingStyle,
          bowlingStyle: p.bowlingStyle,
          isOverseas: p.isOverseas,
          isWicketKeeper: "isWicketKeeper" in p ? true : false,
          isCapped: p.isCapped,
          t20Matches: p.t20Matches,
          odiMatches: p.odiMatches,
          testMatches: p.testMatches ?? 0,
          battingRating: p.battingRating,
          bowlingRating: p.bowlingRating,
          basePrice: p.basePrice,
          reservePrice: p.basePrice * 0.8,
          active: true,
        },
      })
    )
  );

  const registrations = await Promise.all(
    players.slice(0, 20).map((p, i) => {
      const statuses: Array<"SUBMITTED" | "APPROVED" | "REJECTED" | "UNDER_REVIEW" | "WAITLISTED"> = ["APPROVED", "APPROVED", "APPROVED", "SUBMITTED", "UNDER_REVIEW", "REJECTED", "APPROVED", "APPROVED", "WAITLISTED", "APPROVED"];
      return prisma.tournamentPlayerRegistration.create({
        data: {
          tournamentId: i < 15 ? ipl.id : bbl.id,
          playerId: p.id,
          status: statuses[i % statuses.length],
          registrationNumber: `REG-${i < 15 ? "IPL" : "BBL"}-${String(i + 1).padStart(4, "0")}`,
          jerseyName: playerData[i].lastName?.toUpperCase() ?? playerData[i].firstName.toUpperCase(),
          jerseyNumber: (i + 1) * 7 % 99 + 1,
          preferredRole: playerData[i].role,
          expectedPrice: playerData[i].basePrice * 1.5,
          fitnessCleared: i % 3 !== 2,
          documentsVerified: i % 4 !== 3,
          medicalCleared: i % 5 !== 4,
          approvedBy: statuses[i % statuses.length] === "APPROVED" ? superAdmin.id : undefined,
          approvedAt: statuses[i % statuses.length] === "APPROVED" ? new Date() : undefined,
          rejectedBy: statuses[i % statuses.length] === "REJECTED" ? superAdmin.id : undefined,
          rejectedAt: statuses[i % statuses.length] === "REJECTED" ? new Date() : undefined,
          rejectionReason: statuses[i % statuses.length] === "REJECTED" ? "Failed fitness test" : undefined,
        },
      });
    })
  );

  const iplAuction = await prisma.auctionSeries.create({
    data: {
      tournamentId: ipl.id,
      name: "IPL 2026 Mega Auction",
      sequenceNo: 1,
      status: "CLOSED",
      startsAt: new Date("2026-01-15T10:00:00Z"),
      endsAt: new Date("2026-01-17T18:00:00Z"),
      minBidIncrement: 25,
      defaultBidTimeSec: 30,
      maxBidTimeSec: 120,
      totalPlayersSold: 10,
      totalAmountSpent: 4500,
    },
  });

  const bblAuction = await prisma.auctionSeries.create({
    data: {
      tournamentId: bbl.id,
      name: "BBL 2026 Draft",
      sequenceNo: 1,
      status: "PLANNED",
      startsAt: new Date("2026-09-15T09:00:00Z"),
      minBidIncrement: 10,
      defaultBidTimeSec: 45,
      maxBidTimeSec: 90,
    },
  });

  const iplRound1 = await prisma.auctionRound.create({
    data: { auctionSeriesId: iplAuction.id, roundNo: 1, name: "Marquee Round", type: "MARQUEE", maxPlayers: 10, playersSold: 6, amountSpent: 3200, startsAt: new Date("2026-01-15T10:00:00Z"), endsAt: new Date("2026-01-15T16:00:00Z") },
  });

  const iplRound2 = await prisma.auctionRound.create({
    data: { auctionSeriesId: iplAuction.id, roundNo: 2, name: "Capped Players", type: "CAPPED", maxPlayers: 20, playersSold: 4, amountSpent: 1300, startsAt: new Date("2026-01-16T10:00:00Z"), endsAt: new Date("2026-01-16T18:00:00Z") },
  });

  const bblRound1 = await prisma.auctionRound.create({
    data: { auctionSeriesId: bblAuction.id, roundNo: 1, name: "Overseas Stars", type: "OVERSEAS", maxPlayers: 15, startsAt: new Date("2026-09-15T09:00:00Z") },
  });

  const bblRound2 = await prisma.auctionRound.create({
    data: { auctionSeriesId: bblAuction.id, roundNo: 2, name: "Emerging Talent", type: "EMERGING", maxPlayers: 20, startsAt: new Date("2026-09-16T09:00:00Z") },
  });

  const bidData = [
    { auctionSeriesId: iplAuction.id, auctionRoundId: iplRound1.id, tournamentId: ipl.id, teamId: iplTeams[0].id, playerId: players[0].id, bidAmount: 1500, isWinningBid: true },
    { auctionSeriesId: iplAuction.id, auctionRoundId: iplRound1.id, tournamentId: ipl.id, teamId: iplTeams[1].id, playerId: players[0].id, bidAmount: 1400, isWinningBid: false },
    { auctionSeriesId: iplAuction.id, auctionRoundId: iplRound1.id, tournamentId: ipl.id, teamId: iplTeams[1].id, playerId: players[1].id, bidAmount: 1600, isWinningBid: true },
    { auctionSeriesId: iplAuction.id, auctionRoundId: iplRound1.id, tournamentId: ipl.id, teamId: iplTeams[2].id, playerId: players[2].id, bidAmount: 1200, isWinningBid: true },
    { auctionSeriesId: iplAuction.id, auctionRoundId: iplRound1.id, tournamentId: ipl.id, teamId: iplTeams[0].id, playerId: players[2].id, bidAmount: 1100, isWinningBid: false },
    { auctionSeriesId: iplAuction.id, auctionRoundId: iplRound1.id, tournamentId: ipl.id, teamId: iplTeams[3].id, playerId: players[3].id, bidAmount: 1000, isWinningBid: true },
    { auctionSeriesId: iplAuction.id, auctionRoundId: iplRound2.id, tournamentId: ipl.id, teamId: iplTeams[1].id, playerId: players[4].id, bidAmount: 800, isWinningBid: true },
    { auctionSeriesId: iplAuction.id, auctionRoundId: iplRound2.id, tournamentId: ipl.id, teamId: iplTeams[0].id, playerId: players[5].id, bidAmount: 750, isWinningBid: true },
    { auctionSeriesId: iplAuction.id, auctionRoundId: iplRound2.id, tournamentId: ipl.id, teamId: iplTeams[4].id, playerId: players[6].id, bidAmount: 850, isWinningBid: true },
    { auctionSeriesId: iplAuction.id, auctionRoundId: iplRound2.id, tournamentId: ipl.id, teamId: iplTeams[5].id, playerId: players[7].id, bidAmount: 400, isWinningBid: true },
    { auctionSeriesId: iplAuction.id, auctionRoundId: iplRound2.id, tournamentId: ipl.id, teamId: iplTeams[2].id, playerId: players[8].id, bidAmount: 550, isWinningBid: true },
    { auctionSeriesId: iplAuction.id, auctionRoundId: iplRound1.id, tournamentId: ipl.id, teamId: iplTeams[6].id, playerId: players[10].id, bidAmount: 900, isWinningBid: true },
    { auctionSeriesId: iplAuction.id, auctionRoundId: iplRound2.id, tournamentId: ipl.id, teamId: iplTeams[3].id, playerId: players[11].id, bidAmount: 500, isWinningBid: true },
    { auctionSeriesId: iplAuction.id, auctionRoundId: iplRound2.id, tournamentId: ipl.id, teamId: iplTeams[7].id, playerId: players[9].id, bidAmount: 600, isWinningBid: true },
    { auctionSeriesId: iplAuction.id, auctionRoundId: iplRound1.id, tournamentId: ipl.id, teamId: iplTeams[4].id, playerId: players[20].id, bidAmount: 1100, isWinningBid: true },
  ];

  await Promise.all(bidData.map((b) => prisma.auctionBid.create({ data: b })));

  const squadData = [
    { tournamentId: ipl.id, teamId: iplTeams[0].id, playerId: players[0].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 1500, jerseyNumber: 18, isCaptain: true },
    { tournamentId: ipl.id, teamId: iplTeams[0].id, playerId: players[5].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 750, jerseyNumber: 17, isViceCaptain: true },
    { tournamentId: ipl.id, teamId: iplTeams[1].id, playerId: players[1].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 1600, jerseyNumber: 45, isCaptain: true },
    { tournamentId: ipl.id, teamId: iplTeams[1].id, playerId: players[4].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 800, jerseyNumber: 8 },
    { tournamentId: ipl.id, teamId: iplTeams[2].id, playerId: players[2].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 1200, jerseyNumber: 93, isCaptain: true },
    { tournamentId: ipl.id, teamId: iplTeams[2].id, playerId: players[8].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 550, jerseyNumber: 77 },
    { tournamentId: ipl.id, teamId: iplTeams[3].id, playerId: players[3].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 1000, jerseyNumber: 63, isCaptain: true },
    { tournamentId: ipl.id, teamId: iplTeams[3].id, playerId: players[11].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 500, jerseyNumber: 14 },
    { tournamentId: ipl.id, teamId: iplTeams[4].id, playerId: players[6].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 850, jerseyNumber: 33, isCaptain: true },
    { tournamentId: ipl.id, teamId: iplTeams[4].id, playerId: players[20].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 1100, jerseyNumber: 30, isOverseas: true },
    { tournamentId: ipl.id, teamId: iplTeams[5].id, playerId: players[7].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 400, jerseyNumber: 3 },
    { tournamentId: ipl.id, teamId: iplTeams[6].id, playerId: players[10].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 900, jerseyNumber: 19, isCaptain: true },
    { tournamentId: ipl.id, teamId: iplTeams[7].id, playerId: players[9].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 600, jerseyNumber: 73 },
    { tournamentId: ipl.id, teamId: iplTeams[0].id, playerId: players[22].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 1000, jerseyNumber: 63, isOverseas: true },
    { tournamentId: ipl.id, teamId: iplTeams[1].id, playerId: players[23].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 1100, jerseyNumber: 49, isOverseas: true },
    { tournamentId: ipl.id, teamId: iplTeams[2].id, playerId: players[21].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 900, jerseyNumber: 67, isOverseas: true },
    { tournamentId: ipl.id, teamId: iplTeams[3].id, playerId: players[24].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 800, jerseyNumber: 90, isOverseas: true },
    { tournamentId: ipl.id, teamId: iplTeams[5].id, playerId: players[16].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 350, jerseyNumber: 23 },
    { tournamentId: ipl.id, teamId: iplTeams[6].id, playerId: players[12].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 700, jerseyNumber: 1, isViceCaptain: true },
    { tournamentId: ipl.id, teamId: iplTeams[7].id, playerId: players[14].id, acquisitionType: "AUCTION" as const, acquisitionAmount: 500, jerseyNumber: 44 },
  ];

  await Promise.all(
    squadData.map((s) =>
      prisma.teamSquadPlayer.create({
        data: {
          tournamentId: s.tournamentId,
          teamId: s.teamId,
          playerId: s.playerId,
          acquisitionType: s.acquisitionType,
          acquisitionAmount: s.acquisitionAmount,
          jerseyNumber: s.jerseyNumber,
          isCaptain: s.isCaptain ?? false,
          isViceCaptain: s.isViceCaptain ?? false,
          isOverseas: s.isOverseas ?? false,
          isActive: true,
        },
      })
    )
  );

  const matchData = [
    { tournamentId: ipl.id, matchNo: 1, stage: "LEAGUE" as const, homeTeamId: iplTeams[0].id, awayTeamId: iplTeams[1].id, venueName: "Wankhede Stadium", city: "Mumbai", scheduledAt: new Date("2026-03-22T19:30:00+05:30"), startedAt: new Date("2026-03-22T19:30:00+05:30"), completedAt: new Date("2026-03-22T23:15:00+05:30"), status: "COMPLETED" as const, winningTeamId: iplTeams[0].id, resultType: "TEAM_WIN" as const, resultSummary: "Mumbai Indians won by 5 wickets", winMarginWickets: 5, pointsHome: 2, pointsAway: 0 },
    { tournamentId: ipl.id, matchNo: 2, stage: "LEAGUE" as const, homeTeamId: iplTeams[2].id, awayTeamId: iplTeams[3].id, venueName: "M Chinnaswamy Stadium", city: "Bengaluru", scheduledAt: new Date("2026-03-23T19:30:00+05:30"), startedAt: new Date("2026-03-23T19:30:00+05:30"), completedAt: new Date("2026-03-23T23:00:00+05:30"), status: "COMPLETED" as const, winningTeamId: iplTeams[2].id, resultType: "TEAM_WIN" as const, resultSummary: "Royal Challengers Bengaluru won by 22 runs", winMarginRuns: 22, pointsHome: 2, pointsAway: 0 },
    { tournamentId: ipl.id, matchNo: 3, stage: "LEAGUE" as const, homeTeamId: iplTeams[4].id, awayTeamId: iplTeams[5].id, venueName: "Arun Jaitley Stadium", city: "Delhi", scheduledAt: new Date("2026-03-24T19:30:00+05:30"), startedAt: new Date("2026-03-24T19:30:00+05:30"), status: "LIVE" as const, pointsHome: 0, pointsAway: 0 },
    { tournamentId: ipl.id, matchNo: 4, stage: "LEAGUE" as const, homeTeamId: iplTeams[6].id, awayTeamId: iplTeams[7].id, venueName: "Sawai Mansingh Stadium", city: "Jaipur", scheduledAt: new Date("2026-03-25T19:30:00+05:30"), status: "SCHEDULED" as const },
    { tournamentId: ipl.id, matchNo: 5, stage: "LEAGUE" as const, homeTeamId: iplTeams[1].id, awayTeamId: iplTeams[0].id, venueName: "MA Chidambaram Stadium", city: "Chennai", scheduledAt: new Date("2026-03-26T19:30:00+05:30"), status: "SCHEDULED" as const },
    { tournamentId: ipl.id, matchNo: 6, stage: "LEAGUE" as const, homeTeamId: iplTeams[3].id, awayTeamId: iplTeams[4].id, venueName: "Eden Gardens", city: "Kolkata", scheduledAt: new Date("2026-03-27T15:30:00+05:30"), status: "SCHEDULED" as const },
    { tournamentId: ipl.id, matchNo: 7, stage: "LEAGUE" as const, homeTeamId: iplTeams[5].id, awayTeamId: iplTeams[6].id, venueName: "Rajiv Gandhi Intl Stadium", city: "Hyderabad", scheduledAt: new Date("2026-03-27T19:30:00+05:30"), status: "SCHEDULED" as const },
    { tournamentId: ipl.id, matchNo: 8, stage: "LEAGUE" as const, homeTeamId: iplTeams[7].id, awayTeamId: iplTeams[2].id, venueName: "IS Bindra Stadium", city: "Mohali", scheduledAt: new Date("2026-03-28T19:30:00+05:30"), status: "SCHEDULED" as const },
    { tournamentId: ipl.id, matchNo: 9, stage: "LEAGUE" as const, homeTeamId: iplTeams[0].id, awayTeamId: iplTeams[3].id, venueName: "Wankhede Stadium", city: "Mumbai", scheduledAt: new Date("2026-03-29T19:30:00+05:30"), status: "SCHEDULED" as const },
    { tournamentId: ipl.id, matchNo: 10, stage: "LEAGUE" as const, homeTeamId: iplTeams[1].id, awayTeamId: iplTeams[5].id, venueName: "MA Chidambaram Stadium", city: "Chennai", scheduledAt: new Date("2026-03-30T19:30:00+05:30"), status: "SCHEDULED" as const },
  ];

  const matches = await Promise.all(
    matchData.map((m) => prisma.match.create({ data: m }))
  );

  const innings1_m1 = await prisma.innings.create({
    data: {
      matchId: matches[0].id,
      inningsNo: 1,
      battingTeamId: iplTeams[1].id,
      bowlingTeamId: iplTeams[0].id,
      status: "COMPLETED",
      totalRuns: 168,
      totalWickets: 7,
      totalOvers: 20,
      totalBalls: 120,
      extras: 12,
      wides: 5,
      noBalls: 2,
      byes: 3,
      legByes: 2,
      runRate: 8.40,
    },
  });

  const innings2_m1 = await prisma.innings.create({
    data: {
      matchId: matches[0].id,
      inningsNo: 2,
      battingTeamId: iplTeams[0].id,
      bowlingTeamId: iplTeams[1].id,
      status: "COMPLETED",
      totalRuns: 172,
      totalWickets: 5,
      totalOvers: 19.2,
      totalBalls: 116,
      extras: 8,
      wides: 3,
      noBalls: 1,
      byes: 2,
      legByes: 2,
      runRate: 8.90,
      targetScore: 169,
    },
  });

  const innings1_m2 = await prisma.innings.create({
    data: {
      matchId: matches[1].id,
      inningsNo: 1,
      battingTeamId: iplTeams[2].id,
      bowlingTeamId: iplTeams[3].id,
      status: "COMPLETED",
      totalRuns: 195,
      totalWickets: 4,
      totalOvers: 20,
      totalBalls: 120,
      extras: 10,
      wides: 4,
      noBalls: 3,
      byes: 1,
      legByes: 2,
      runRate: 9.75,
    },
  });

  await prisma.innings.create({
    data: {
      matchId: matches[1].id,
      inningsNo: 2,
      battingTeamId: iplTeams[3].id,
      bowlingTeamId: iplTeams[2].id,
      status: "COMPLETED",
      totalRuns: 173,
      totalWickets: 8,
      totalOvers: 20,
      totalBalls: 120,
      extras: 7,
      wides: 3,
      noBalls: 1,
      byes: 2,
      legByes: 1,
      runRate: 8.65,
      targetScore: 196,
    },
  });

  const ballByBallData = [];
  const batsmanIds = [players[1].id, players[4].id, players[23].id];
  const bowlerIds = [players[2].id, players[22].id, players[5].id];
  let ballIndex = 0;

  for (let over = 0; over < 5; over++) {
    for (let ball = 1; ball <= 6; ball++) {
      const runs = [0, 1, 4, 2, 0, 6, 1, 0, 1, 4, 0, 2, 1, 6, 0, 1, 2, 0, 4, 1, 0, 0, 1, 6, 1, 2, 0, 4, 1, 0][ballIndex];
      const isWicket = ballIndex === 14 || ballIndex === 28;
      const isExtra = ballIndex === 7 || ballIndex === 19;

      ballByBallData.push({
        inningsId: innings1_m1.id,
        overNo: over,
        ballNo: ball,
        batsmanId: batsmanIds[over < 3 ? 0 : 1],
        bowlerId: bowlerIds[over % 3],
        nonStrikerId: batsmanIds[over < 3 ? 1 : 2],
        runs: isExtra ? 0 : runs,
        isExtra,
        extraType: isExtra ? "WIDE" as const : undefined,
        extraRuns: isExtra ? 1 : 0,
        totalRuns: isExtra ? 1 : runs,
        isWicket,
        dismissalType: isWicket && ballIndex === 14 ? "BOWLED" as const : isWicket ? "CAUGHT" as const : undefined,
        dismissedId: isWicket ? batsmanIds[over < 3 ? 0 : 1] : undefined,
        fielderId: isWicket && ballIndex === 28 ? players[0].id : undefined,
        isFour: runs === 4,
        isSix: runs === 6,
        isDot: runs === 0 && !isExtra,
        ballSpeed: over < 3 ? 140 + Math.random() * 10 : 80 + Math.random() * 10,
      });
      ballIndex++;
    }
  }

  await Promise.all(
    ballByBallData.map((b) => prisma.ballByBall.create({ data: b }))
  );

  const commentaryData = [
    { inningsId: innings1_m1.id, overNo: 0, ballNo: 1, text: "Good length delivery, pushed to mid-off for no run.", isHighlight: false },
    { inningsId: innings1_m1.id, overNo: 0, ballNo: 2, text: "Flicked off the pads, single taken to fine leg.", isHighlight: false },
    { inningsId: innings1_m1.id, overNo: 0, ballNo: 3, text: "FOUR! Gorgeous cover drive, races to the boundary!", isHighlight: true },
    { inningsId: innings1_m1.id, overNo: 1, ballNo: 1, text: "Short ball, pulled away for a couple.", isHighlight: false },
    { inningsId: innings1_m1.id, overNo: 1, ballNo: 6, text: "SIX! Massive hit over long-on! That's gone into the second tier!", isHighlight: true },
    { inningsId: innings1_m1.id, overNo: 2, ballNo: 3, text: "BOWLED! What a delivery! Knocked the off stump clean out of the ground!", isHighlight: true },
    { inningsId: innings1_m2.id, overNo: 0, ballNo: 1, text: "First ball — driven beautifully through the covers for four!", isHighlight: true },
    { inningsId: innings1_m2.id, overNo: 0, ballNo: 4, text: "Yorker on off stump, dug out for a single.", isHighlight: false },
    { inningsId: innings1_m2.id, overNo: 1, ballNo: 2, text: "SIX! Scooped over fine leg! Audacious cricket!", isHighlight: true },
    { inningsId: innings2_m1.id, overNo: 0, ballNo: 1, text: "Good start to the chase — defended solidly on the front foot.", isHighlight: false },
  ];

  await Promise.all(
    commentaryData.map((c) => prisma.commentary.create({ data: c }))
  );

  const pointsData = iplTeams.map((team, i) => {
    const isWinner0 = matches[0].winningTeamId === team.id;
    const isLoser0 = (matches[0].homeTeamId === team.id || matches[0].awayTeamId === team.id) && !isWinner0;
    const isWinner1 = matches[1].winningTeamId === team.id;
    const isLoser1 = (matches[1].homeTeamId === team.id || matches[1].awayTeamId === team.id) && !isWinner1;
    const played = (isWinner0 || isLoser0 ? 1 : 0) + (isWinner1 || isLoser1 ? 1 : 0);
    const won = (isWinner0 ? 1 : 0) + (isWinner1 ? 1 : 0);
    const lost = played - won;

    return {
      tournamentId: ipl.id,
      teamId: team.id,
      played,
      won,
      lost,
      tied: 0,
      noResult: 0,
      points: won * 2,
      nrr: won > 0 ? 0.25 * won : lost > 0 ? -0.15 * lost : 0,
      runsScored: isWinner0 ? 172 : isLoser0 ? 168 : isWinner1 ? 195 : isLoser1 ? 173 : 0,
      oversFaced: played > 0 ? 20 : 0,
      runsConceded: isWinner0 ? 168 : isLoser0 ? 172 : isWinner1 ? 173 : isLoser1 ? 195 : 0,
      oversBowled: played > 0 ? 20 : 0,
      position: i + 1,
    };
  });

  await Promise.all(
    pointsData.map((p) => prisma.pointsTableEntry.create({ data: p }))
  );

  const notificationData = [
    { userId: superAdmin.id, tournamentId: ipl.id, type: "MATCH_COMPLETED" as const, channel: "BOTH" as const, title: "Match 1 Result", message: "Mumbai Indians beat Chennai Super Kings by 5 wickets", link: "/tournaments/ipl2026/matches/1", isRead: true, readAt: new Date(), emailSent: true, emailSentAt: new Date() },
    { userId: adminUser.id, tournamentId: ipl.id, type: "MATCH_COMPLETED" as const, channel: "IN_APP" as const, title: "Match 2 Result", message: "Royal Challengers Bengaluru beat Kolkata Knight Riders by 22 runs", link: "/tournaments/ipl2026/matches/2", isRead: false },
    { userId: superAdmin.id, tournamentId: ipl.id, type: "MATCH_STARTED" as const, channel: "BOTH" as const, title: "Match 3 Live", message: "Delhi Capitals vs Sunrisers Hyderabad is now live!", link: "/tournaments/ipl2026/matches/3", isRead: false, emailSent: true, emailSentAt: new Date() },
    { userId: adminUser.id, tournamentId: ipl.id, type: "REGISTRATION_SUBMITTED" as const, channel: "IN_APP" as const, title: "New Registration", message: "Virat Kohli has registered for IPL 2026", isRead: true, readAt: new Date() },
    { userId: adminUser.id, tournamentId: ipl.id, type: "REGISTRATION_APPROVED" as const, channel: "EMAIL" as const, title: "Registration Approved", message: "Rohit Sharma's registration has been approved", emailSent: true, emailSentAt: new Date() },
    { userId: superAdmin.id, tournamentId: ipl.id, type: "AUCTION_STARTED" as const, channel: "BOTH" as const, title: "Auction Live", message: "IPL 2026 Mega Auction has started!", link: "/tournaments/ipl2026/auction", isRead: true, readAt: new Date(), emailSent: true, emailSentAt: new Date() },
    { userId: superAdmin.id, tournamentId: ipl.id, type: "AUCTION_PLAYER_SOLD" as const, channel: "IN_APP" as const, title: "Player Sold", message: "Virat Kohli sold to Mumbai Indians for ₹15 Cr", isRead: true, readAt: new Date() },
    { userId: adminUser.id, tournamentId: ipl.id, type: "TEAM_CREATED" as const, channel: "IN_APP" as const, title: "Team Created", message: "Mumbai Indians squad has been finalized", isRead: false },
    { tournamentId: ipl.id, type: "MATCH_SCHEDULED" as const, channel: "IN_APP" as const, title: "Schedule Update", message: "Match 4: Rajasthan Royals vs Punjab Kings — March 25", isRead: false },
    { userId: superAdmin.id, tournamentId: bbl.id, type: "GENERAL" as const, channel: "IN_APP" as const, title: "BBL Registration Open", message: "Big Bash League 2026 registrations are now open!", link: "/tournaments/bbl2026", isRead: false },
    { userId: adminUser.id, tournamentId: bbl.id, type: "REGISTRATION_SUBMITTED" as const, channel: "BOTH" as const, title: "BBL Registration", message: "Pat Cummins has registered for BBL 2026", emailSent: true, emailSentAt: new Date() },
    { userId: superAdmin.id, type: "GENERAL" as const, channel: "IN_APP" as const, title: "System Update", message: "Platform maintenance scheduled for April 1st", isRead: false },
    { userId: adminUser.id, tournamentId: ipl.id, type: "MATCH_SCHEDULED" as const, channel: "IN_APP" as const, title: "Upcoming Match", message: "Don't miss MI vs CSK on March 26!", isRead: false },
    { userId: superAdmin.id, tournamentId: ipl.id, type: "REGISTRATION_REJECTED" as const, channel: "BOTH" as const, title: "Registration Rejected", message: "A player registration was rejected due to fitness concerns", emailSent: true, emailSentAt: new Date() },
    { userId: adminUser.id, type: "GENERAL" as const, channel: "IN_APP" as const, title: "Welcome", message: "Welcome to CricketPro Tournament Manager!", isRead: true, readAt: new Date() },
  ];

  await Promise.all(
    notificationData.map((n) => prisma.notification.create({ data: n }))
  );

  const emailLogData = [
    { to: "admin@cricketpro.com", subject: "IPL 2026 Match 1 Result", html: "<h1>MI beat CSK by 5 wickets</h1>", status: "SENT", tournamentId: ipl.id },
    { to: "organizer@cricketpro.com", subject: "Registration Approved - Rohit Sharma", html: "<p>Rohit Sharma's registration for IPL 2026 has been approved.</p>", status: "SENT", tournamentId: ipl.id },
    { to: "admin@cricketpro.com", subject: "IPL 2026 Auction Started", html: "<h1>The mega auction is now live!</h1>", status: "SENT", tournamentId: ipl.id },
    { to: "organizer@cricketpro.com", subject: "BBL 2026 Registration - Pat Cummins", html: "<p>Pat Cummins has registered for BBL 2026.</p>", status: "SENT", tournamentId: bbl.id },
    { to: "admin@cricketpro.com", subject: "Weekly Summary", html: "<p>Your weekly tournament summary is ready.</p>", status: "FAILED", error: "SMTP timeout" },
  ];

  await Promise.all(
    emailLogData.map((e) => prisma.emailLog.create({ data: e }))
  );

  await prisma.userTournamentAccess.createMany({
    data: [
      { userId: superAdmin.id, tournamentId: ipl.id, role: "TOURNAMENT_OWNER", isActive: true },
      { userId: adminUser.id, tournamentId: ipl.id, role: "TOURNAMENT_ADMIN", isActive: true },
      { userId: superAdmin.id, tournamentId: bbl.id, role: "TOURNAMENT_OWNER", isActive: true },
      { userId: adminUser.id, tournamentId: bbl.id, role: "SCORER", isActive: true },
    ],
  });

  console.log("Seeding complete!");
  console.log(`  Users: 2`);
  console.log(`  Tournaments: 2`);
  console.log(`  Teams: ${iplTeams.length + bblTeams.length}`);
  console.log(`  Players: ${players.length}`);
  console.log(`  Registrations: ${registrations.length}`);
  console.log(`  Auction Series: 2, Rounds: 4, Bids: ${bidData.length}`);
  console.log(`  Squad Players: ${squadData.length}`);
  console.log(`  Matches: ${matches.length}`);
  console.log(`  Innings: 4`);
  console.log(`  Ball-by-Ball: ${ballByBallData.length}`);
  console.log(`  Commentary: ${commentaryData.length}`);
  console.log(`  Points Table: ${pointsData.length}`);
  console.log(`  Notifications: ${notificationData.length}`);
  console.log(`  Email Logs: ${emailLogData.length}`);
  console.log(`  User Tournament Access: 4`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
