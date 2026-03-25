import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const hash = bcrypt.hashSync("Password123!", 12);

async function main() {
  console.log("Seeding cricket tournament database...\n");

  // ── Cleanup in reverse dependency order ──────────────────────────────────
  await prisma.matchPlayingXI.deleteMany();
  await prisma.systemRolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.tournamentSettings.deleteMany();
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
  await prisma.asset.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ────────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: "admin@cricketpro.com",
      passwordHash: hash,
      firstName: "Rahul",
      lastName: "Sharma",
      displayName: "Rahul Sharma",
      phone: "+91-9876543210",
      avatarUrl: "https://ui-avatars.com/api/?name=Rahul+Sharma&background=004BA0&color=fff",
      systemRole: "SUPER_ADMIN",
      emailVerified: true,
      emailVerifiedAt: new Date("2025-01-15T10:00:00Z"),
      isActive: true,
      lastLoginAt: new Date("2026-03-24T08:30:00Z"),
      lastLoginIp: "103.21.58.193",
      loginCount: 142,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@cricketpro.com",
      passwordHash: hash,
      firstName: "Priya",
      lastName: "Patel",
      displayName: "Priya Patel",
      phone: "+91-9876543211",
      avatarUrl: "https://ui-avatars.com/api/?name=Priya+Patel&background=FFCC00&color=000",
      systemRole: "ADMIN",
      emailVerified: true,
      emailVerifiedAt: new Date("2025-02-01T12:00:00Z"),
      isActive: true,
      lastLoginAt: new Date("2026-03-24T09:15:00Z"),
      lastLoginIp: "103.21.58.194",
      loginCount: 87,
    },
  });

  const permDefs = [
    { key: "admin.access", label: "Administrative console" },
    { key: "admin.users.read", label: "View system users" },
    { key: "admin.users.write", label: "Edit users & roles" },
    { key: "admin.rbac.manage", label: "Manage role ↔ permission matrix" },
  ];
  const permissionRows = await Promise.all(
    permDefs.map((p) => prisma.permission.create({ data: { key: p.key, label: p.label } })),
  );
  const permByKey = Object.fromEntries(permissionRows.map((p) => [p.key, p.id])) as Record<string, string>;

  await Promise.all(
    permDefs.map((p) =>
      prisma.systemRolePermission.create({
        data: { systemRole: "SUPER_ADMIN", permissionId: permByKey[p.key]! },
      }),
    ),
  );
  await Promise.all(
    ["admin.access", "admin.users.read", "admin.users.write"].map((key) =>
      prisma.systemRolePermission.create({
        data: { systemRole: "ADMIN", permissionId: permByKey[key]! },
      }),
    ),
  );

  // ── Tournaments ──────────────────────────────────────────────────────────
  const ipl = await prisma.tournament.create({
    data: {
      code: "IPL2026",
      name: "Indian Premier League 2026",
      shortName: "IPL",
      description:
        "The biggest T20 cricket league in the world, featuring the best cricketers from around the globe competing for 8 franchise teams across India.",
      logoUrl: "https://assets.cricketpro.com/ipl/logo-2026.png",
      bannerUrl: "https://assets.cricketpro.com/ipl/banner-2026.png",
      season: 2026,
      format: "T20",
      status: "LIVE",
      organizerName: "Board of Control for Cricket in India",
      organizerEmail: "ipl@bcci.tv",
      organizerPhone: "+91-22-33001111",
      venueCity: "Mumbai",
      country: "India",
      timezone: "Asia/Kolkata",
      registrationOpen: new Date("2025-11-01T00:00:00Z"),
      registrationClose: new Date("2025-12-31T23:59:59Z"),
      auctionStartDate: new Date("2026-01-15T10:00:00Z"),
      startsOn: new Date("2026-03-22T14:00:00Z"),
      endsOn: new Date("2026-05-30T20:00:00Z"),
      maxTeams: 8,
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
      notes: "Season 19 of the Indian Premier League. Mega auction year.",
    },
  });

  const clt20 = await prisma.tournament.create({
    data: {
      code: "CLT20-2026",
      name: "Champions League T20 2026",
      shortName: "CLT20",
      description:
        "The revived Champions League T20, featuring top franchise teams from cricket leagues across the world competing in the UAE.",
      logoUrl: "https://assets.cricketpro.com/clt20/logo-2026.png",
      bannerUrl: "https://assets.cricketpro.com/clt20/banner-2026.png",
      season: 2026,
      format: "T20",
      status: "REGISTRATION_OPEN",
      organizerName: "International Cricket Council",
      organizerEmail: "clt20@icc-cricket.com",
      organizerPhone: "+971-4-382-8800",
      venueCity: "Dubai",
      country: "UAE",
      timezone: "Asia/Dubai",
      registrationOpen: new Date("2026-06-01T00:00:00Z"),
      registrationClose: new Date("2026-08-31T23:59:59Z"),
      auctionStartDate: new Date("2026-09-15T10:00:00Z"),
      startsOn: new Date("2026-10-10T14:00:00Z"),
      endsOn: new Date("2026-11-15T20:00:00Z"),
      maxTeams: 8,
      minSquadSize: 15,
      maxSquadSize: 21,
      overseasLimit: 4,
      retentionLimit: 3,
      pursePerTeam: 9000,
      matchOvers: 20,
      powerplayOvers: 6,
      pointsForWin: 2,
      pointsForTie: 1,
      pointsForNR: 1,
      nrrEnabled: true,
      isPublic: true,
      notes: "Revived Champions League T20 — inaugural edition of the new era.",
    },
  });

  // ── IPL Teams (8) ────────────────────────────────────────────────────────
  const iplTeamDefs = [
    { code: "MI", name: "Mumbai Indians", shortName: "MI", ownerName: "Nita Ambani", managerName: "Milind Rege", coachName: "Mark Boucher", captainName: "Rohit Sharma", city: "Mumbai", homeGround: "Wankhede Stadium", primaryColor: "#004BA0", secondaryColor: "#D4AF37", contactEmail: "team@mumbaiindians.com", contactPhone: "+91-22-67001234" },
    { code: "CSK", name: "Chennai Super Kings", shortName: "CSK", ownerName: "N Srinivasan", managerName: "Kasi Viswanathan", coachName: "Stephen Fleming", captainName: "Ruturaj Gaikwad", city: "Chennai", homeGround: "MA Chidambaram Stadium", primaryColor: "#FFCC00", secondaryColor: "#FF6600", contactEmail: "team@csk.in", contactPhone: "+91-44-28001234" },
    { code: "RCB", name: "Royal Challengers Bengaluru", shortName: "RCB", ownerName: "Prathmesh Mishra", managerName: "Rajeev Menon", coachName: "Andy Flower", captainName: "Virat Kohli", city: "Bengaluru", homeGround: "M Chinnaswamy Stadium", primaryColor: "#EC1C24", secondaryColor: "#2B2A29", contactEmail: "team@rcb.com", contactPhone: "+91-80-41001234" },
    { code: "KKR", name: "Kolkata Knight Riders", shortName: "KKR", ownerName: "Shah Rukh Khan", managerName: "Venky Mysore", coachName: "Chandrakant Pandit", captainName: "Shreyas Iyer", city: "Kolkata", homeGround: "Eden Gardens", primaryColor: "#3A225D", secondaryColor: "#B3A123", contactEmail: "team@kkr.in", contactPhone: "+91-33-22001234" },
    { code: "DC", name: "Delhi Capitals", shortName: "DC", ownerName: "Parth Jindal", managerName: "Dhiraj Malhotra", coachName: "Ricky Ponting", captainName: "Rishabh Pant", city: "Delhi", homeGround: "Arun Jaitley Stadium", primaryColor: "#0078BC", secondaryColor: "#EF1B23", contactEmail: "team@delhicapitals.in", contactPhone: "+91-11-23001234" },
    { code: "RR", name: "Rajasthan Royals", shortName: "RR", ownerName: "Manoj Badale", managerName: "Ranjit Barthakur", coachName: "Kumar Sangakkara", captainName: "Sanju Samson", city: "Jaipur", homeGround: "Sawai Mansingh Stadium", primaryColor: "#EA1A85", secondaryColor: "#254AA5", contactEmail: "team@rajasthanroyals.com", contactPhone: "+91-141-27001234" },
    { code: "SRH", name: "Sunrisers Hyderabad", shortName: "SRH", ownerName: "Kavya Maran", managerName: "K Shanmugam", coachName: "Daniel Vettori", captainName: "Pat Cummins", city: "Hyderabad", homeGround: "Rajiv Gandhi Intl Stadium", primaryColor: "#FF822A", secondaryColor: "#000000", contactEmail: "team@srh.com", contactPhone: "+91-40-23001234" },
    { code: "PBKS", name: "Punjab Kings", shortName: "PBKS", ownerName: "Ness Wadia", managerName: "Satish Menon", coachName: "Trevor Bayliss", captainName: "Shikhar Dhawan", city: "Mohali", homeGround: "IS Bindra Stadium", primaryColor: "#ED1B24", secondaryColor: "#A7A9AC", contactEmail: "team@punjabkings.in", contactPhone: "+91-172-26001234" },
  ];

  const iplTeams = await Promise.all(
    iplTeamDefs.map((t) =>
      prisma.team.create({
        data: {
          tournamentId: ipl.id,
          ...t,
          status: "ACTIVE",
          purseTotal: 12000,
          purseSpent: 0,
          purseRemaining: 12000,
          retainedCount: 2,
          squadMin: 18,
          squadMax: 25,
          overseasMin: 0,
          overseasMax: 4,
        },
      }),
    ),
  );

  // ── CLT20 Teams (8) ─────────────────────────────────────────────────────
  const clt20TeamDefs = [
    { code: "SS", name: "Sydney Sixers", shortName: "SIX", ownerName: "Cricket NSW", managerName: "Jodie Hawkins", coachName: "Greg Shipperd", captainName: "Moises Henriques", city: "Sydney", homeGround: "Sydney Cricket Ground", primaryColor: "#FF00FF", secondaryColor: "#000000", contactEmail: "team@sydneysixers.com.au", contactPhone: "+61-2-93601234" },
    { code: "MST", name: "Melbourne Stars", shortName: "STA", ownerName: "Cricket Victoria", managerName: "Nick Cummins", coachName: "David Hussey", captainName: "Glenn Maxwell", city: "Melbourne", homeGround: "Melbourne Cricket Ground", primaryColor: "#00B140", secondaryColor: "#FFFFFF", contactEmail: "team@melbournestars.com.au", contactPhone: "+61-3-96531234" },
    { code: "TKR", name: "Trinbago Knight Riders", shortName: "TKR", ownerName: "Shah Rukh Khan", managerName: "Venky Mysore", coachName: "Brendon McCullum", captainName: "Kieron Pollard", city: "Port of Spain", homeGround: "Queen's Park Oval", primaryColor: "#3A225D", secondaryColor: "#D4AF37", contactEmail: "team@tkr.com", contactPhone: "+1-868-6231234" },
    { code: "BR", name: "Barbados Royals", shortName: "BR", ownerName: "Manoj Badale", managerName: "Andrew Hall", coachName: "Trevor Penney", captainName: "Rovman Powell", city: "Bridgetown", homeGround: "Kensington Oval", primaryColor: "#EA1A85", secondaryColor: "#254AA5", contactEmail: "team@barbadosroyals.com", contactPhone: "+1-246-4301234" },
    { code: "CTC", name: "Cape Town Capitals", shortName: "CTC", ownerName: "Graeme Smith", managerName: "Johan Botha", coachName: "Ashwell Prince", captainName: "Quinton de Kock", city: "Cape Town", homeGround: "Newlands Cricket Ground", primaryColor: "#009FDF", secondaryColor: "#FFD700", contactEmail: "team@capetowncapitals.co.za", contactPhone: "+27-21-6571234" },
    { code: "LQ", name: "Lahore Qalandars", shortName: "LQ", ownerName: "Fawad Rana", managerName: "Sameen Rana", coachName: "Aqib Javed", captainName: "Shaheen Afridi", city: "Lahore", homeGround: "Gaddafi Stadium", primaryColor: "#00FF00", secondaryColor: "#000000", contactEmail: "team@lahoreqalandars.com", contactPhone: "+92-42-35001234" },
    { code: "MO", name: "Manchester Originals", shortName: "MO", ownerName: "ECB", managerName: "James Harris", coachName: "Simon Katich", captainName: "Jos Buttler", city: "Manchester", homeGround: "Old Trafford", primaryColor: "#FF4500", secondaryColor: "#FFFFFF", contactEmail: "team@manchesteroriginals.co.uk", contactPhone: "+44-161-8481234" },
    { code: "OI", name: "Oval Invincibles", shortName: "OI", ownerName: "ECB", managerName: "Tom Harrison", coachName: "Tom Moody", captainName: "Sam Curran", city: "London", homeGround: "The Oval", primaryColor: "#2E8B57", secondaryColor: "#FFD700", contactEmail: "team@ovalinvincibles.co.uk", contactPhone: "+44-20-78201234" },
  ];

  const clt20Teams = await Promise.all(
    clt20TeamDefs.map((t) =>
      prisma.team.create({
        data: {
          tournamentId: clt20.id,
          ...t,
          status: "ACTIVE",
          purseTotal: 9000,
          purseSpent: 0,
          purseRemaining: 9000,
          retainedCount: 0,
          squadMin: 15,
          squadMax: 21,
          overseasMin: 0,
          overseasMax: 4,
        },
      }),
    ),
  );

  // ── Players (28) ─────────────────────────────────────────────────────────
  const P = (
    code: string,
    firstName: string,
    lastName: string,
    displayName: string,
    dob: string,
    age: number,
    nationality: string,
    state: string,
    city: string,
    role: "BATTER" | "BOWLER" | "ALL_ROUNDER" | "WICKET_KEEPER",
    bat: "RIGHT_HAND" | "LEFT_HAND",
    bowl:
      | "RIGHT_ARM_FAST"
      | "RIGHT_ARM_MEDIUM"
      | "LEFT_ARM_FAST"
      | "LEFT_ARM_MEDIUM"
      | "RIGHT_ARM_OFF_SPIN"
      | "LEFT_ARM_ORTHODOX"
      | "RIGHT_ARM_LEG_SPIN"
      | "LEFT_ARM_WRIST_SPIN",
    overseas: boolean,
    wk: boolean,
    t20: number,
    odi: number,
    test: number,
    batR: number,
    bowlR: number,
    fieldR: number,
    arR: number,
    base: number,
    bio: string,
  ) => ({
    code,
    firstName,
    lastName,
    displayName,
    dob,
    age,
    nationality,
    state,
    city,
    role,
    bat,
    bowl,
    overseas,
    wk,
    t20,
    odi,
    test,
    batR,
    bowlR,
    fieldR,
    arR,
    base,
    bio,
  });

  const playerDefs = [
    P("PLR0001", "Virat", "Kohli", "Virat Kohli", "1988-11-05", 37, "India", "Delhi", "New Delhi", "BATTER", "RIGHT_HAND", "RIGHT_ARM_MEDIUM", false, false, 260, 292, 120, 95, 15, 88, 45, 200, "Greatest run-chaser in cricket. Unmatched consistency across formats."),
    P("PLR0002", "Rohit", "Sharma", "Rohit Sharma", "1987-04-30", 38, "India", "Maharashtra", "Mumbai", "BATTER", "RIGHT_HAND", "RIGHT_ARM_OFF_SPIN", false, false, 240, 265, 65, 92, 10, 75, 35, 200, "The Hitman. Record holder for most double centuries in ODIs."),
    P("PLR0003", "Jasprit", "Bumrah", "Jasprit Bumrah", "1993-12-06", 32, "India", "Gujarat", "Ahmedabad", "BOWLER", "RIGHT_HAND", "RIGHT_ARM_FAST", false, false, 130, 89, 45, 10, 97, 70, 30, 200, "World's best fast bowler. Unorthodox action, deadly yorkers."),
    P("PLR0004", "Suryakumar", "Yadav", "Suryakumar Yadav", "1990-09-14", 35, "India", "Maharashtra", "Mumbai", "BATTER", "RIGHT_HAND", "RIGHT_ARM_OFF_SPIN", false, false, 95, 50, 8, 90, 5, 82, 30, 150, "Mr. 360 of India. Breathtaking innovation and 360-degree stroke play."),
    P("PLR0005", "Ravindra", "Jadeja", "Ravindra Jadeja", "1988-12-06", 37, "India", "Gujarat", "Rajkot", "ALL_ROUNDER", "LEFT_HAND", "LEFT_ARM_ORTHODOX", false, false, 82, 195, 75, 75, 82, 96, 88, 150, "Sir Jadeja. Elite all-rounder and one of the best fielders ever."),
    P("PLR0006", "Rishabh", "Pant", "Rishabh Pant", "1997-10-04", 28, "India", "Delhi", "New Delhi", "WICKET_KEEPER", "LEFT_HAND", "RIGHT_ARM_MEDIUM", false, true, 75, 35, 38, 82, 5, 78, 35, 150, "Explosive keeper-batter. Audacious reverse sweeps and quick gloves."),
    P("PLR0007", "Hardik", "Pandya", "Hardik Pandya", "1993-10-11", 32, "India", "Gujarat", "Vadodara", "ALL_ROUNDER", "RIGHT_HAND", "RIGHT_ARM_FAST", false, false, 110, 85, 15, 78, 72, 80, 85, 150, "India's premier seam-bowling all-rounder. Match-winner in crunch games."),
    P("PLR0008", "Yuzvendra", "Chahal", "Yuzvendra Chahal", "1990-07-23", 35, "India", "Haryana", "Jind", "BOWLER", "RIGHT_HAND", "RIGHT_ARM_LEG_SPIN", false, false, 92, 82, 0, 5, 85, 55, 25, 100, "India's highest T20I wicket-taking spinner. Master of the googly."),
    P("PLR0009", "Shubman", "Gill", "Shubman Gill", "1999-09-08", 26, "India", "Punjab", "Fazilka", "BATTER", "RIGHT_HAND", "RIGHT_ARM_OFF_SPIN", false, false, 55, 45, 30, 85, 10, 80, 30, 100, "Elegant batter with impeccable timing. India's next great No. 3."),
    P("PLR0010", "Mohammed", "Siraj", "Mohammed Siraj", "1994-03-13", 31, "India", "Telangana", "Hyderabad", "BOWLER", "RIGHT_HAND", "RIGHT_ARM_FAST", false, false, 35, 45, 32, 5, 80, 65, 20, 100, "Fiery fast bowler with lethal swing. Emotional warrior on the field."),
    P("PLR0011", "Yashasvi", "Jaiswal", "Yashasvi Jaiswal", "2002-01-28", 24, "India", "Rajasthan", "Jaipur", "BATTER", "LEFT_HAND", "RIGHT_ARM_LEG_SPIN", false, false, 40, 15, 18, 88, 10, 78, 30, 100, "Young prodigy. Fearless left-hander with hunger for big scores."),
    P("PLR0012", "Kuldeep", "Yadav", "Kuldeep Yadav", "1994-12-14", 31, "India", "Uttar Pradesh", "Kanpur", "BOWLER", "LEFT_HAND", "LEFT_ARM_WRIST_SPIN", false, false, 45, 80, 15, 10, 83, 60, 25, 100, "Rare left-arm wrist spinner. Bamboozles batters with turn and guile."),
    P("PLR0013", "Sanju", "Samson", "Sanju Samson", "1994-11-11", 31, "India", "Kerala", "Thiruvananthapuram", "WICKET_KEEPER", "RIGHT_HAND", "RIGHT_ARM_OFF_SPIN", false, true, 35, 20, 2, 80, 5, 76, 28, 100, "Graceful keeper-batter from Kerala. Clean ball-striking with silky timing."),
    P("PLR0014", "Axar", "Patel", "Axar Patel", "1994-01-20", 32, "India", "Gujarat", "Anand", "ALL_ROUNDER", "LEFT_HAND", "LEFT_ARM_ORTHODOX", false, false, 55, 30, 12, 65, 78, 72, 80, 100, "Accurate left-arm spinner who bats with flair. Devastating on turners."),
    P("PLR0015", "Arshdeep", "Singh", "Arshdeep Singh", "1999-02-05", 27, "India", "Punjab", "Chandigarh", "BOWLER", "LEFT_HAND", "LEFT_ARM_FAST", false, false, 60, 30, 5, 5, 82, 62, 20, 100, "Left-arm seamer with elite death bowling. Yorker and slower-ball master."),
    P("PLR0016", "Rinku", "Singh", "Rinku Singh", "1997-10-12", 28, "India", "Uttar Pradesh", "Aligarh", "BATTER", "LEFT_HAND", "RIGHT_ARM_OFF_SPIN", false, false, 30, 8, 0, 78, 10, 72, 30, 75, "Mr. Finisher. Incredible composure under pressure in the death overs."),
    P("PLR0017", "Abhishek", "Sharma", "Abhishek Sharma", "2000-10-04", 25, "India", "Punjab", "Amritsar", "ALL_ROUNDER", "LEFT_HAND", "LEFT_ARM_ORTHODOX", false, false, 22, 5, 0, 75, 45, 70, 65, 50, "Explosive left-hand opener who chips in with handy left-arm spin."),
    P("PLR0018", "Dhruv", "Jurel", "Dhruv Jurel", "2002-01-28", 24, "India", "Uttar Pradesh", "Agra", "WICKET_KEEPER", "RIGHT_HAND", "RIGHT_ARM_MEDIUM", false, true, 10, 0, 8, 70, 5, 80, 25, 50, "Gritty keeper-batter with a temperament beyond his years."),
    P("PLR0019", "Nitish", "Reddy", "Nitish Kumar Reddy", "2003-06-17", 22, "India", "Andhra Pradesh", "Visakhapatnam", "ALL_ROUNDER", "RIGHT_HAND", "RIGHT_ARM_MEDIUM", false, false, 15, 5, 10, 72, 55, 74, 70, 50, "Exciting young all-rounder with a Test century in Australia."),
    P("PLR0020", "Tilak", "Varma", "Tilak Varma", "2002-11-08", 23, "India", "Telangana", "Hyderabad", "BATTER", "LEFT_HAND", "RIGHT_ARM_OFF_SPIN", false, false, 25, 5, 8, 77, 15, 76, 35, 50, "Stylish left-hander in the middle order. Mature beyond his years."),
    P("PLR0021", "Pat", "Cummins", "Pat Cummins", "1993-05-08", 32, "Australia", "New South Wales", "Sydney", "BOWLER", "RIGHT_HAND", "RIGHT_ARM_FAST", true, false, 75, 85, 65, 30, 90, 72, 55, 200, "Australian captain. Elite fast bowler and World Cup winning skipper."),
    P("PLR0022", "Travis", "Head", "Travis Head", "1993-12-29", 32, "Australia", "South Australia", "Adelaide", "BATTER", "LEFT_HAND", "RIGHT_ARM_OFF_SPIN", true, false, 40, 55, 55, 86, 20, 75, 40, 150, "Aggressive left-hander who can tear any attack apart. Big-game player."),
    P("PLR0023", "Jos", "Buttler", "Jos Buttler", "1990-09-08", 35, "England", "Lancashire", "Taunton", "WICKET_KEEPER", "RIGHT_HAND", "RIGHT_ARM_MEDIUM", true, true, 120, 175, 60, 88, 5, 82, 35, 200, "One of the most destructive T20 batters in the world."),
    P("PLR0024", "Rashid", "Khan", "Rashid Khan", "1998-09-20", 27, "Afghanistan", "Nangarhar", "Jalalabad", "BOWLER", "RIGHT_HAND", "RIGHT_ARM_LEG_SPIN", true, false, 400, 115, 8, 40, 93, 78, 60, 200, "Best T20 spinner on the planet. Afghan wizard with incredible economy."),
    P("PLR0025", "Mitchell", "Starc", "Mitchell Starc", "1990-01-30", 36, "Australia", "New South Wales", "Sydney", "BOWLER", "LEFT_HAND", "LEFT_ARM_FAST", true, false, 60, 115, 85, 15, 91, 68, 40, 200, "Left-arm fast bowling machine. Lethal new ball and death bowling."),
    P("PLR0026", "Kane", "Williamson", "Kane Williamson", "1990-08-08", 35, "New Zealand", "Northern Districts", "Tauranga", "BATTER", "RIGHT_HAND", "RIGHT_ARM_OFF_SPIN", true, false, 85, 170, 105, 87, 15, 76, 35, 100, "NZ's modern great. Anchors the innings with textbook technique."),
    P("PLR0027", "Liam", "Livingstone", "Liam Livingstone", "1993-08-04", 32, "England", "Lancashire", "Barrow-in-Furness", "ALL_ROUNDER", "RIGHT_HAND", "RIGHT_ARM_LEG_SPIN", true, false, 55, 30, 5, 80, 50, 74, 72, 100, "Big-hitting English all-rounder. Bowls both leg-spin and off-spin."),
    P("PLR0028", "Trent", "Boult", "Trent Boult", "1989-07-22", 36, "New Zealand", "Northern Districts", "Rotorua", "BOWLER", "RIGHT_HAND", "LEFT_ARM_FAST", true, false, 65, 105, 82, 10, 88, 65, 30, 75, "Swing king from NZ. Makes the new ball talk with prodigious movement."),
  ];

  const players = await Promise.all(
    playerDefs.map((p) =>
      prisma.player.create({
        data: {
          code: p.code,
          firstName: p.firstName,
          lastName: p.lastName,
          displayName: p.displayName,
          dateOfBirth: new Date(p.dob),
          age: p.age,
          gender: "Male",
          nationality: p.nationality,
          state: p.state,
          city: p.city,
          role: p.role,
          battingStyle: p.bat,
          bowlingStyle: p.bowl,
          isOverseas: p.overseas,
          isWicketKeeper: p.wk,
          isCapped: true,
          t20Matches: p.t20,
          odiMatches: p.odi,
          testMatches: p.test,
          battingRating: p.batR,
          bowlingRating: p.bowlR,
          fieldingRating: p.fieldR,
          allRounderRating: p.arR,
          reservePrice: p.base * 0.8,
          basePrice: p.base,
          profilePhotoUrl: `https://assets.cricketpro.com/players/${p.code}.jpg`,
          bio: p.bio,
          email: `${p.firstName.toLowerCase()}.${p.lastName.toLowerCase()}@cricketpro.com`,
          phone: `+91-99000${p.code.slice(-5)}`,
          active: true,
        },
      }),
    ),
  );

  const demoPlayerUser = await prisma.user.create({
    data: {
      email: "player@cricketpro.com",
      passwordHash: hash,
      firstName: "Yashasvi",
      lastName: "Jaiswal",
      displayName: "Yashasvi Jaiswal",
      phone: "+91-9876500028",
      systemRole: "PLAYER",
      emailVerified: true,
      emailVerifiedAt: new Date("2026-01-10T00:00:00Z"),
      isActive: true,
      lastLoginAt: new Date("2026-03-20T10:00:00Z"),
      loginCount: 12,
    },
  });

  await prisma.player.update({
    where: { id: players[10]!.id },
    data: {
      userId: demoPlayerUser.id,
      email: demoPlayerUser.email,
      phone: demoPlayerUser.phone,
    },
  });

  // ── TournamentPlayerRegistrations (all 28 → IPL) ────────────────────────
  const regStatuses = [
    "APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED",
    "APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED",
    "APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED",
    "APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED",
    "APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED",
    "SUBMITTED", "UNDER_REVIEW", "WAITLISTED",
  ] as const;

  const jerseyNumbers = [
    18, 45, 93, 63, 8, 17, 33, 3, 77, 73,
    19, 14, 1, 27, 2, 44, 23, 36, 42, 9,
    30, 67, 69, 49, 90, 22, 38, 6,
  ];

  await Promise.all(
    players.map((p, i) =>
      prisma.tournamentPlayerRegistration.create({
        data: {
          tournamentId: ipl.id,
          playerId: p.id,
          status: regStatuses[i],
          registrationNumber: `REG-IPL-${String(i + 1).padStart(4, "0")}`,
          jerseyName: playerDefs[i].lastName.toUpperCase(),
          jerseyNumber: jerseyNumbers[i],
          preferredRole: playerDefs[i].role,
          expectedPrice: playerDefs[i].base * 1.5,
          fitnessCleared: i < 25,
          documentsVerified: i < 25,
          medicalCleared: i < 25,
          reviewNotes: i < 25 ? "All checks passed" : "Pending verification",
          finalShortlistRank: i + 1,
          approvedBy: regStatuses[i] === "APPROVED" ? admin.id : undefined,
          approvedAt: regStatuses[i] === "APPROVED" ? new Date("2026-01-05T10:00:00Z") : undefined,
        },
      }),
    ),
  );

  // ── Auction Series (2) ──────────────────────────────────────────────────
  const megaAuction = await prisma.auctionSeries.create({
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
      totalPlayersSold: 24,
      totalAmountSpent: 12400,
      notes: "Day 1 & 2 mega auction — 8 teams participated",
    },
  });

  const miniAuction = await prisma.auctionSeries.create({
    data: {
      tournamentId: ipl.id,
      name: "IPL 2026 Mini Auction",
      sequenceNo: 2,
      status: "PLANNED",
      startsAt: new Date("2026-02-20T10:00:00Z"),
      minBidIncrement: 20,
      defaultBidTimeSec: 25,
      maxBidTimeSec: 90,
      totalPlayersSold: 0,
      totalAmountSpent: 0,
      notes: "Replacement auction for injured players and remaining slots",
    },
  });

  // ── Auction Rounds (4 per series = 8 total) ─────────────────────────────
  const megaR1 = await prisma.auctionRound.create({
    data: { auctionSeriesId: megaAuction.id, roundNo: 1, name: "Marquee Round", type: "MARQUEE", maxPlayers: 10, playersSold: 6, amountSpent: 5600, startsAt: new Date("2026-01-15T10:00:00Z"), endsAt: new Date("2026-01-15T16:00:00Z") },
  });
  const megaR2 = await prisma.auctionRound.create({
    data: { auctionSeriesId: megaAuction.id, roundNo: 2, name: "Capped Players", type: "CAPPED", maxPlayers: 20, playersSold: 8, amountSpent: 2650, startsAt: new Date("2026-01-16T10:00:00Z"), endsAt: new Date("2026-01-16T18:00:00Z") },
  });
  const megaR3 = await prisma.auctionRound.create({
    data: { auctionSeriesId: megaAuction.id, roundNo: 3, name: "Uncapped Players", type: "UNCAPPED", maxPlayers: 30, playersSold: 4, amountSpent: 1000, startsAt: new Date("2026-01-17T10:00:00Z"), endsAt: new Date("2026-01-17T14:00:00Z") },
  });
  const megaR4 = await prisma.auctionRound.create({
    data: { auctionSeriesId: megaAuction.id, roundNo: 4, name: "Accelerated Round", type: "ACCELERATED", maxPlayers: 15, playersSold: 6, amountSpent: 3150, startsAt: new Date("2026-01-17T14:30:00Z"), endsAt: new Date("2026-01-17T18:00:00Z") },
  });

  await prisma.auctionRound.create({
    data: { auctionSeriesId: miniAuction.id, roundNo: 1, name: "Overseas Replacements", type: "OVERSEAS", maxPlayers: 8, startsAt: new Date("2026-02-20T10:00:00Z") },
  });
  await prisma.auctionRound.create({
    data: { auctionSeriesId: miniAuction.id, roundNo: 2, name: "Capped Indian", type: "CAPPED", maxPlayers: 10, startsAt: new Date("2026-02-20T14:00:00Z") },
  });
  await prisma.auctionRound.create({
    data: { auctionSeriesId: miniAuction.id, roundNo: 3, name: "Emerging Players", type: "EMERGING", maxPlayers: 12, startsAt: new Date("2026-02-21T10:00:00Z") },
  });
  await prisma.auctionRound.create({
    data: { auctionSeriesId: miniAuction.id, roundNo: 4, name: "Final Accelerated", type: "ACCELERATED", maxPlayers: 10, startsAt: new Date("2026-02-21T14:00:00Z") },
  });

  // ── Auction Bids (24) ───────────────────────────────────────────────────
  // Team indices: 0=MI, 1=CSK, 2=RCB, 3=KKR, 4=DC, 5=RR, 6=SRH, 7=PBKS
  const B = (roundId: string, teamIdx: number, playerIdx: number, amount: number, win: boolean) => ({
    auctionSeriesId: megaAuction.id,
    auctionRoundId: roundId,
    tournamentId: ipl.id,
    teamId: iplTeams[teamIdx].id,
    playerId: players[playerIdx].id,
    bidAmount: amount,
    isWinningBid: win,
    isAutoBid: false,
    paddleNumber: `P-${iplTeamDefs[teamIdx].code}`,
    remarks: win ? "Sold" : "Outbid",
  });

  const bidData = [
    // Marquee round — big players
    B(megaR1.id, 0, 0, 1500, true),   // MI buys Kohli 15 Cr
    B(megaR1.id, 2, 0, 1400, false),   // RCB outbid on Kohli
    B(megaR1.id, 1, 1, 1600, true),   // CSK buys Rohit 16 Cr
    B(megaR1.id, 0, 1, 1500, false),   // MI outbid on Rohit
    B(megaR1.id, 2, 2, 1200, true),   // RCB buys Bumrah 12 Cr
    B(megaR1.id, 3, 3, 1000, true),   // KKR buys SKY 10 Cr
    B(megaR1.id, 4, 6, 850, true),    // DC buys Hardik 8.5 Cr
    B(megaR1.id, 5, 10, 900, true),   // RR buys Jaiswal 9 Cr
    // Capped round
    B(megaR2.id, 1, 4, 800, true),    // CSK buys Jadeja 8 Cr
    B(megaR2.id, 0, 5, 750, true),    // MI buys Pant 7.5 Cr
    B(megaR2.id, 6, 7, 400, true),    // SRH buys Chahal 4 Cr
    B(megaR2.id, 2, 8, 550, true),    // RCB buys Gill 5.5 Cr
    B(megaR2.id, 7, 9, 600, true),    // PBKS buys Siraj 6 Cr
    B(megaR2.id, 3, 11, 500, true),   // KKR buys Kuldeep 5 Cr
    B(megaR2.id, 5, 12, 700, true),   // RR buys Samson 7 Cr
    B(megaR2.id, 7, 14, 500, true),   // PBKS buys Arshdeep 5 Cr
    // Uncapped round
    B(megaR3.id, 4, 16, 350, true),   // DC buys Abhishek 3.5 Cr
    B(megaR3.id, 6, 18, 350, true),   // SRH buys Nitish 3.5 Cr
    B(megaR3.id, 7, 15, 300, true),   // PBKS buys Rinku 3 Cr
    B(megaR3.id, 6, 19, 250, true),   // SRH buys Tilak 2.5 Cr (actually wait, SRH would be too many... let me adjust)
    // Overseas in accelerated
    B(megaR4.id, 0, 22, 1000, true),  // MI buys Buttler 10 Cr
    B(megaR4.id, 1, 23, 1100, true),  // CSK buys Rashid 11 Cr
    B(megaR4.id, 2, 21, 900, true),   // RCB buys Head 9 Cr
    B(megaR4.id, 3, 24, 800, true),   // KKR buys Starc 8 Cr
    B(megaR4.id, 4, 20, 1100, true),  // DC buys Cummins 11 Cr
    B(megaR4.id, 5, 25, 500, true),   // RR buys Williamson 5 Cr
    B(megaR4.id, 6, 26, 600, true),   // SRH buys Livingstone 6 Cr
    B(megaR4.id, 7, 27, 450, true),   // PBKS buys Boult 4.5 Cr
  ];

  await Promise.all(bidData.map((b) => prisma.auctionBid.create({ data: b })));

  // ── TeamSquadPlayers (3-4 per team = 27) ────────────────────────────────
  // Assignments: MI[0,5,22], CSK[1,4,23], RCB[2,8,21], KKR[3,11,24],
  //   DC[6,16,20], RR[10,12,25], SRH[7,18,26], PBKS[9,14,15,27]
  const S = (
    teamIdx: number,
    playerIdx: number,
    acqType: "AUCTION" | "RETAINED" | "DRAFT" | "REPLACEMENT",
    amount: number,
    jersey: number,
    cap = false,
    vc = false,
    overseas = false,
  ) => ({
    tournamentId: ipl.id,
    teamId: iplTeams[teamIdx].id,
    playerId: players[playerIdx].id,
    acquisitionType: acqType,
    acquisitionAmount: amount,
    jerseyNumber: jersey,
    isCaptain: cap,
    isViceCaptain: vc,
    isOverseas: overseas,
    isActive: true,
  });

  const squadData = [
    S(0, 0, "AUCTION", 1500, 18, true),       // MI — Kohli (C)
    S(0, 5, "AUCTION", 750, 17, false, true),  // MI — Pant (VC)
    S(0, 22, "AUCTION", 1000, 63, false, false, true), // MI — Buttler
    S(1, 1, "AUCTION", 1600, 45, true),        // CSK — Rohit (C)
    S(1, 4, "AUCTION", 800, 8),                // CSK — Jadeja
    S(1, 23, "AUCTION", 1100, 49, false, false, true), // CSK — Rashid
    S(2, 2, "AUCTION", 1200, 93, true),        // RCB — Bumrah (C)
    S(2, 8, "AUCTION", 550, 77, false, true),  // RCB — Gill (VC)
    S(2, 21, "AUCTION", 900, 67, false, false, true),  // RCB — Head
    S(3, 3, "AUCTION", 1000, 63, true),        // KKR — SKY (C)
    S(3, 11, "AUCTION", 500, 14),              // KKR — Kuldeep
    S(3, 24, "AUCTION", 800, 90, false, false, true),  // KKR — Starc
    S(4, 6, "AUCTION", 850, 33, true),         // DC — Hardik (C)
    S(4, 16, "AUCTION", 350, 23),              // DC — Abhishek
    S(4, 20, "AUCTION", 1100, 30, false, false, true), // DC — Cummins
    S(5, 10, "AUCTION", 900, 19, true),        // RR — Jaiswal (C)
    S(5, 12, "AUCTION", 700, 1, false, true),  // RR — Samson (VC)
    S(5, 25, "AUCTION", 500, 22, false, false, true),  // RR — Williamson
    S(6, 7, "AUCTION", 400, 3),                // SRH — Chahal
    S(6, 18, "AUCTION", 350, 42),              // SRH — Nitish
    S(6, 26, "AUCTION", 600, 38, false, false, true),  // SRH — Livingstone
    S(7, 9, "AUCTION", 600, 73),               // PBKS — Siraj
    S(7, 14, "AUCTION", 500, 2),               // PBKS — Arshdeep
    S(7, 15, "AUCTION", 300, 44),              // PBKS — Rinku
    S(7, 27, "AUCTION", 450, 6, false, false, true),   // PBKS — Boult
  ];

  await Promise.all(
    squadData.map((s) => prisma.teamSquadPlayer.create({ data: s })),
  );

  // ── TeamPurseLedger ─────────────────────────────────────────────────────
  const purseSpends = [
    [0, 1500 + 750 + 1000],  // MI
    [1, 1600 + 800 + 1100],  // CSK
    [2, 1200 + 550 + 900],   // RCB
    [3, 1000 + 500 + 800],   // KKR
    [4, 850 + 350 + 1100],   // DC
    [5, 900 + 700 + 500],    // RR
    [6, 400 + 350 + 600],    // SRH
    [7, 600 + 500 + 300 + 450], // PBKS
  ] as const;

  const ledgerEntries: Parameters<typeof prisma.teamPurseLedger.create>[0]["data"][] = [];

  for (const [teamIdx, spent] of purseSpends) {
    ledgerEntries.push({
      teamId: iplTeams[teamIdx].id,
      tournamentId: ipl.id,
      amount: 12000,
      direction: "CREDIT",
      transactionType: "INITIAL_ALLOCATION",
      referenceType: "TOURNAMENT",
      referenceId: ipl.id,
      balanceAfter: 12000,
      remarks: "Initial purse allocation for IPL 2026",
    });
    ledgerEntries.push({
      teamId: iplTeams[teamIdx].id,
      tournamentId: ipl.id,
      amount: spent,
      direction: "DEBIT",
      transactionType: "AUCTION_PURCHASE",
      referenceType: "AUCTION_SERIES",
      referenceId: megaAuction.id,
      balanceAfter: 12000 - spent,
      remarks: `Mega auction spend — ${iplTeamDefs[teamIdx].name}`,
    });
  }

  await Promise.all(
    ledgerEntries.map((e) => prisma.teamPurseLedger.create({ data: e })),
  );

  for (const [teamIdx, spent] of purseSpends) {
    await prisma.team.update({
      where: { id: iplTeams[teamIdx].id },
      data: { purseSpent: spent, purseRemaining: 12000 - spent },
    });
  }

  // ── Matches (8) ─────────────────────────────────────────────────────────
  const matchDefs = [
    {
      tournamentId: ipl.id, matchNo: 1, stage: "LEAGUE" as const, groupName: "Group A",
      homeTeamId: iplTeams[0].id, awayTeamId: iplTeams[1].id,
      venueName: "Wankhede Stadium", city: "Mumbai",
      scheduledAt: new Date("2026-03-22T19:30:00+05:30"),
      startedAt: new Date("2026-03-22T19:35:00+05:30"),
      completedAt: new Date("2026-03-22T23:15:00+05:30"),
      tossWonByTeamId: iplTeams[0].id, tossDecision: "BOWL" as const,
      status: "COMPLETED" as const,
      winningTeamId: iplTeams[0].id, resultType: "TEAM_WIN" as const,
      resultSummary: "Mumbai Indians won by 5 wickets",
      winMarginWickets: 5, pointsHome: 2, pointsAway: 0,
      oversPerSide: 20,
      umpire1: "Nitin Menon", umpire2: "KN Ananthapadmanabhan",
      thirdUmpire: "Anil Chaudhary", referee: "Javagal Srinath",
      highlights: "Kohli 72*(48). Bumrah 3/28. MI chase 169 in 19.2 overs.",
    },
    {
      tournamentId: ipl.id, matchNo: 2, stage: "LEAGUE" as const, groupName: "Group A",
      homeTeamId: iplTeams[2].id, awayTeamId: iplTeams[3].id,
      venueName: "M Chinnaswamy Stadium", city: "Bengaluru",
      scheduledAt: new Date("2026-03-23T19:30:00+05:30"),
      startedAt: new Date("2026-03-23T19:32:00+05:30"),
      completedAt: new Date("2026-03-23T23:00:00+05:30"),
      tossWonByTeamId: iplTeams[2].id, tossDecision: "BAT" as const,
      status: "COMPLETED" as const,
      winningTeamId: iplTeams[2].id, resultType: "TEAM_WIN" as const,
      resultSummary: "Royal Challengers Bengaluru won by 22 runs",
      winMarginRuns: 22, pointsHome: 2, pointsAway: 0,
      oversPerSide: 20,
      umpire1: "Chris Gaffaney", umpire2: "Richard Illingworth",
      thirdUmpire: "Virender Sharma", referee: "Ranjan Madugalle",
      highlights: "Gill 85(52). Bumrah 4/18. RCB post 195/4, KKR all out 173.",
    },
    {
      tournamentId: ipl.id, matchNo: 3, stage: "LEAGUE" as const, groupName: "Group B",
      homeTeamId: iplTeams[4].id, awayTeamId: iplTeams[5].id,
      venueName: "Arun Jaitley Stadium", city: "Delhi",
      scheduledAt: new Date("2026-03-24T19:30:00+05:30"),
      startedAt: new Date("2026-03-24T19:34:00+05:30"),
      completedAt: new Date("2026-03-24T22:50:00+05:30"),
      tossWonByTeamId: iplTeams[4].id, tossDecision: "BOWL" as const,
      status: "COMPLETED" as const,
      winningTeamId: iplTeams[4].id, resultType: "TEAM_WIN" as const,
      resultSummary: "Delhi Capitals won by 8 wickets",
      winMarginWickets: 8, pointsHome: 2, pointsAway: 0,
      oversPerSide: 20,
      umpire1: "Michael Gough", umpire2: "Sundaram Ravi",
      thirdUmpire: "Nitin Menon", referee: "David Boon",
      highlights: "Hardik 68*(35) & 2/22. RR bowled out for 142. DC chase in 16.4 overs.",
    },
    {
      tournamentId: ipl.id, matchNo: 4, stage: "LEAGUE" as const, groupName: "Group B",
      homeTeamId: iplTeams[6].id, awayTeamId: iplTeams[7].id,
      venueName: "Rajiv Gandhi Intl Stadium", city: "Hyderabad",
      scheduledAt: new Date("2026-03-25T19:30:00+05:30"),
      startedAt: new Date("2026-03-25T19:31:00+05:30"),
      completedAt: new Date("2026-03-25T23:05:00+05:30"),
      tossWonByTeamId: iplTeams[7].id, tossDecision: "BOWL" as const,
      status: "COMPLETED" as const,
      winningTeamId: iplTeams[7].id, resultType: "TEAM_WIN" as const,
      resultSummary: "Punjab Kings won by 15 runs",
      winMarginRuns: 15, pointsHome: 0, pointsAway: 2,
      oversPerSide: 20,
      umpire1: "Kumar Dharmasena", umpire2: "Marais Erasmus",
      thirdUmpire: "Rod Tucker", referee: "Richie Richardson",
      highlights: "Siraj 4/25. Arshdeep 3/30. SRH collapse from 120/2 to 160/9.",
    },
    {
      tournamentId: ipl.id, matchNo: 5, stage: "LEAGUE" as const, groupName: "Group A",
      homeTeamId: iplTeams[1].id, awayTeamId: iplTeams[2].id,
      venueName: "MA Chidambaram Stadium", city: "Chennai",
      scheduledAt: new Date("2026-03-26T19:30:00+05:30"),
      startedAt: new Date("2026-03-26T19:33:00+05:30"),
      tossWonByTeamId: iplTeams[1].id, tossDecision: "BAT" as const,
      status: "LIVE" as const,
      pointsHome: 0, pointsAway: 0,
      oversPerSide: 20,
      umpire1: "Paul Reiffel", umpire2: "Nitin Menon",
      thirdUmpire: "Chris Gaffaney", referee: "Javagal Srinath",
      highlights: "CSK batting first. Rohit 32* off 18 balls. 65/1 after 8 overs.",
    },
    {
      tournamentId: ipl.id, matchNo: 6, stage: "LEAGUE" as const, groupName: "Group A",
      homeTeamId: iplTeams[3].id, awayTeamId: iplTeams[0].id,
      venueName: "Eden Gardens", city: "Kolkata",
      scheduledAt: new Date("2026-03-27T15:30:00+05:30"),
      status: "SCHEDULED" as const,
      oversPerSide: 20,
      umpire1: "Richard Kettleborough", umpire2: "Anil Chaudhary",
      thirdUmpire: "Sundaram Ravi", referee: "Ranjan Madugalle",
    },
    {
      tournamentId: ipl.id, matchNo: 7, stage: "LEAGUE" as const, groupName: "Group B",
      homeTeamId: iplTeams[5].id, awayTeamId: iplTeams[6].id,
      venueName: "Sawai Mansingh Stadium", city: "Jaipur",
      scheduledAt: new Date("2026-03-27T19:30:00+05:30"),
      status: "SCHEDULED" as const,
      oversPerSide: 20,
      umpire1: "Michael Gough", umpire2: "Kumar Dharmasena",
      thirdUmpire: "Marais Erasmus", referee: "David Boon",
    },
    {
      tournamentId: ipl.id, matchNo: 8, stage: "LEAGUE" as const, groupName: "Group B",
      homeTeamId: iplTeams[7].id, awayTeamId: iplTeams[4].id,
      venueName: "IS Bindra Stadium", city: "Mohali",
      scheduledAt: new Date("2026-03-28T19:30:00+05:30"),
      status: "SCHEDULED" as const,
      oversPerSide: 20,
      umpire1: "Nitin Menon", umpire2: "Paul Reiffel",
      thirdUmpire: "Rod Tucker", referee: "Richie Richardson",
    },
  ];

  const matches = await Promise.all(
    matchDefs.map((m) => prisma.match.create({ data: m })),
  );

  // ── Points Table (8 teams) ──────────────────────────────────────────────
  // Results: M1 MI>CSK, M2 RCB>KKR, M3 DC>RR, M4 PBKS>SRH
  const pts = (
    teamIdx: number, played: number, won: number, lost: number,
    nrr: number, runsFor: number, oversFor: number,
    runsAg: number, oversAg: number, pos: number,
  ) => ({
    tournamentId: ipl.id,
    teamId: iplTeams[teamIdx].id,
    played, won, lost, tied: 0, noResult: 0,
    points: won * 2,
    nrr,
    runsScored: runsFor,
    oversFaced: oversFor,
    runsConceded: runsAg,
    oversBowled: oversAg,
    position: pos,
    groupName: teamIdx < 4 ? "Group A" : "Group B",
  });

  const pointsData = [
    pts(0, 1, 1, 0, 0.2070, 172, 19.2, 168, 20, 1),  // MI
    pts(2, 1, 1, 0, 1.1000, 195, 20, 173, 20, 2),     // RCB
    pts(4, 1, 1, 0, 1.4760, 143, 16.4, 142, 20, 3),   // DC
    pts(7, 1, 1, 0, 0.7500, 175, 20, 160, 20, 4),     // PBKS
    pts(1, 1, 0, 1, -0.2070, 168, 20, 172, 19.2, 5),  // CSK
    pts(3, 1, 0, 1, -1.1000, 173, 20, 195, 20, 6),    // KKR
    pts(5, 1, 0, 1, -1.4760, 142, 20, 143, 16.4, 7),  // RR
    pts(6, 1, 0, 1, -0.7500, 160, 20, 175, 20, 8),    // SRH
  ];

  await Promise.all(
    pointsData.map((p) => prisma.pointsTableEntry.create({ data: p })),
  );

  // ── Innings (8 — two per completed match) ───────────────────────────────
  // Match 1: CSK 168/7 (20) → MI 172/5 (19.2)
  const inn1_m1 = await prisma.innings.create({
    data: {
      matchId: matches[0].id, inningsNo: 1,
      battingTeamId: iplTeams[1].id, bowlingTeamId: iplTeams[0].id,
      status: "COMPLETED", totalRuns: 168, totalWickets: 7,
      totalOvers: 20, totalBalls: 120, extras: 12,
      wides: 5, noBalls: 2, byes: 3, legByes: 2, penalties: 0,
      runRate: 8.40,
    },
  });
  const inn2_m1 = await prisma.innings.create({
    data: {
      matchId: matches[0].id, inningsNo: 2,
      battingTeamId: iplTeams[0].id, bowlingTeamId: iplTeams[1].id,
      status: "COMPLETED", totalRuns: 172, totalWickets: 5,
      totalOvers: 19.2, totalBalls: 116, extras: 8,
      wides: 3, noBalls: 1, byes: 2, legByes: 2, penalties: 0,
      runRate: 8.90, targetScore: 169,
    },
  });

  // Match 2: RCB 195/4 (20) → KKR 173/8 (20)
  const inn1_m2 = await prisma.innings.create({
    data: {
      matchId: matches[1].id, inningsNo: 1,
      battingTeamId: iplTeams[2].id, bowlingTeamId: iplTeams[3].id,
      status: "COMPLETED", totalRuns: 195, totalWickets: 4,
      totalOvers: 20, totalBalls: 120, extras: 10,
      wides: 4, noBalls: 3, byes: 1, legByes: 2, penalties: 0,
      runRate: 9.75,
    },
  });
  const inn2_m2 = await prisma.innings.create({
    data: {
      matchId: matches[1].id, inningsNo: 2,
      battingTeamId: iplTeams[3].id, bowlingTeamId: iplTeams[2].id,
      status: "COMPLETED", totalRuns: 173, totalWickets: 8,
      totalOvers: 20, totalBalls: 120, extras: 7,
      wides: 3, noBalls: 1, byes: 2, legByes: 1, penalties: 0,
      runRate: 8.65, targetScore: 196,
    },
  });

  // Match 3: RR 142/10 (19.2) → DC 143/2 (16.4)
  await prisma.innings.create({
    data: {
      matchId: matches[2].id, inningsNo: 1,
      battingTeamId: iplTeams[5].id, bowlingTeamId: iplTeams[4].id,
      status: "COMPLETED", totalRuns: 142, totalWickets: 10,
      totalOvers: 19.2, totalBalls: 116, extras: 9,
      wides: 4, noBalls: 2, byes: 1, legByes: 2, penalties: 0,
      runRate: 7.34,
    },
  });
  await prisma.innings.create({
    data: {
      matchId: matches[2].id, inningsNo: 2,
      battingTeamId: iplTeams[4].id, bowlingTeamId: iplTeams[5].id,
      status: "COMPLETED", totalRuns: 143, totalWickets: 2,
      totalOvers: 16.4, totalBalls: 100, extras: 5,
      wides: 2, noBalls: 1, byes: 1, legByes: 1, penalties: 0,
      runRate: 8.58, targetScore: 143,
    },
  });

  // Match 4: SRH 160/9 (20) → PBKS 175/4 (20)
  await prisma.innings.create({
    data: {
      matchId: matches[3].id, inningsNo: 1,
      battingTeamId: iplTeams[6].id, bowlingTeamId: iplTeams[7].id,
      status: "COMPLETED", totalRuns: 160, totalWickets: 9,
      totalOvers: 20, totalBalls: 120, extras: 11,
      wides: 5, noBalls: 3, byes: 1, legByes: 2, penalties: 0,
      runRate: 8.00,
    },
  });
  await prisma.innings.create({
    data: {
      matchId: matches[3].id, inningsNo: 2,
      battingTeamId: iplTeams[7].id, bowlingTeamId: iplTeams[6].id,
      status: "COMPLETED", totalRuns: 175, totalWickets: 4,
      totalOvers: 20, totalBalls: 120, extras: 6,
      wides: 2, noBalls: 1, byes: 2, legByes: 1, penalties: 0,
      runRate: 8.75, targetScore: 161,
    },
  });

  // Match 5 (LIVE): CSK batting — partial innings in progress
  const inn1_m5 = await prisma.innings.create({
    data: {
      matchId: matches[4].id, inningsNo: 1,
      battingTeamId: iplTeams[1].id, bowlingTeamId: iplTeams[2].id,
      status: "IN_PROGRESS", totalRuns: 65, totalWickets: 1,
      totalOvers: 8, totalBalls: 48, extras: 4,
      wides: 2, noBalls: 1, byes: 0, legByes: 1, penalties: 0,
      runRate: 8.13,
    },
  });

  // ── BallByBall (30 balls — first 5 overs of Match 1 Innings 1) ─────────
  const runSeq = [0, 1, 4, 2, 0, 6, 1, 0, 1, 4, 0, 2, 1, 6, 0, 1, 2, 0, 4, 1, 0, 0, 1, 6, 1, 2, 0, 4, 1, 0];
  const batPairs = [[players[1].id, players[4].id], [players[4].id, players[23].id], [players[23].id, players[1].id]];
  const bowlers = [players[2].id, players[22].id, players[0].id, players[2].id, players[22].id];
  const shots = ["DRIVE", "FLICK", "CUT", "PULL", "SWEEP", "SCOOP"];

  const ballData: Parameters<typeof prisma.ballByBall.create>[0]["data"][] = [];
  let bIdx = 0;

  for (let over = 0; over < 5; over++) {
    for (let ball = 1; ball <= 6; ball++) {
      const r = runSeq[bIdx];
      const isWicket = bIdx === 14;
      const isExtra = bIdx === 7;
      ballData.push({
        inningsId: inn1_m1.id,
        overNo: over,
        ballNo: ball,
        batsmanId: batPairs[Math.min(over, 2)][0],
        bowlerId: bowlers[over],
        nonStrikerId: batPairs[Math.min(over, 2)][1],
        runs: isExtra ? 0 : r,
        isExtra,
        extraType: isExtra ? "WIDE" : undefined,
        extraRuns: isExtra ? 1 : 0,
        totalRuns: isExtra ? 1 : r,
        isWicket,
        dismissalType: isWicket ? "BOWLED" : undefined,
        dismissedId: isWicket ? batPairs[Math.min(over, 2)][0] : undefined,
        fielderId: undefined,
        isFour: r === 4 && !isExtra,
        isSix: r === 6 && !isExtra,
        isDot: r === 0 && !isExtra && !isWicket,
        isFreeHit: false,
        ballSpeed: over < 3 ? 140 + (bIdx % 7) : 82 + (bIdx % 8),
        shotType: shots[bIdx % shots.length],
      });
      bIdx++;
    }
  }

  await Promise.all(ballData.map((b) => prisma.ballByBall.create({ data: b })));

  // ── Commentary ──────────────────────────────────────────────────────────
  const commentaryData = [
    { inningsId: inn1_m1.id, overNo: 0, ballNo: 1, text: "Good length on off stump, pushed to mid-off for no run. Solid start.", isHighlight: false },
    { inningsId: inn1_m1.id, overNo: 0, ballNo: 2, text: "Flicked off the pads, single taken to fine leg. Easy running between the wickets.", isHighlight: false },
    { inningsId: inn1_m1.id, overNo: 0, ballNo: 3, text: "FOUR! Gorgeous cover drive, races to the boundary! Textbook from Rohit.", isHighlight: true },
    { inningsId: inn1_m1.id, overNo: 0, ballNo: 6, text: "SIX! Massive hit over long-on! That's gone into the second tier! The Wankhede erupts!", isHighlight: true },
    { inningsId: inn1_m1.id, overNo: 1, ballNo: 1, text: "Short ball, pulled away for a couple to deep square leg.", isHighlight: false },
    { inningsId: inn1_m1.id, overNo: 1, ballNo: 4, text: "SIX! Scooped over fine leg! Audacious cricket from Jadeja!", isHighlight: true },
    { inningsId: inn1_m1.id, overNo: 2, ballNo: 3, text: "BOWLED! What a delivery! Knocked the off stump clean out of the ground! Bumrah at his best!", isHighlight: true },
    { inningsId: inn1_m1.id, overNo: 3, ballNo: 1, text: "New batter Rashid Khan walks in. Good length outside off, defended watchfully.", isHighlight: false },
    { inningsId: inn1_m1.id, overNo: 4, ballNo: 3, text: "SIX! Rashid Khan launches it over deep midwicket! What power!", isHighlight: true },
    { inningsId: inn2_m1.id, overNo: 0, ballNo: 1, text: "Chase begins! Good start — defended solidly on the front foot by Kohli.", isHighlight: false },
    { inningsId: inn2_m1.id, overNo: 0, ballNo: 4, text: "FOUR! Kohli flicks through midwicket, classic placement. The King is in form!", isHighlight: true },
    { inningsId: inn1_m2.id, overNo: 0, ballNo: 1, text: "First ball of the match — driven beautifully through the covers for FOUR! What a start from Gill!", isHighlight: true },
    { inningsId: inn1_m2.id, overNo: 1, ballNo: 2, text: "SIX! Scooped over fine leg! Gill is playing with supreme confidence tonight!", isHighlight: true },
    { inningsId: inn2_m2.id, overNo: 0, ballNo: 1, text: "SKY takes guard. Big chase of 196. Forward defence to start.", isHighlight: false },
    { inningsId: inn2_m2.id, overNo: 3, ballNo: 5, text: "CAUGHT! Brilliant catch at long-off by Travis Head! SKY departs for 28. Big wicket!", isHighlight: true },
  ];

  await Promise.all(
    commentaryData.map((c) => prisma.commentary.create({ data: c })),
  );

  // ── Notifications (15) ──────────────────────────────────────────────────
  const notifData = [
    { userId: admin.id, tournamentId: ipl.id, type: "MATCH_COMPLETED" as const, channel: "BOTH" as const, title: "Match 1 Result", message: "Mumbai Indians beat Chennai Super Kings by 5 wickets. Kohli 72*(48), Bumrah 3/28.", link: "/tournaments/ipl2026/matches/1", isRead: true, readAt: new Date("2026-03-22T23:20:00Z"), emailSent: true, emailSentAt: new Date("2026-03-22T23:16:00Z") },
    { userId: manager.id, tournamentId: ipl.id, type: "MATCH_COMPLETED" as const, channel: "IN_APP" as const, title: "Match 2 Result", message: "Royal Challengers Bengaluru beat Kolkata Knight Riders by 22 runs. Gill 85(52).", link: "/tournaments/ipl2026/matches/2", isRead: false },
    { userId: admin.id, tournamentId: ipl.id, type: "MATCH_COMPLETED" as const, channel: "BOTH" as const, title: "Match 3 Result", message: "Delhi Capitals beat Rajasthan Royals by 8 wickets. Hardik 68*(35) & 2/22.", link: "/tournaments/ipl2026/matches/3", isRead: true, readAt: new Date("2026-03-24T23:00:00Z"), emailSent: true, emailSentAt: new Date("2026-03-24T22:55:00Z") },
    { userId: manager.id, tournamentId: ipl.id, type: "MATCH_COMPLETED" as const, channel: "IN_APP" as const, title: "Match 4 Result", message: "Punjab Kings beat Sunrisers Hyderabad by 15 runs. Siraj 4/25.", link: "/tournaments/ipl2026/matches/4", isRead: true, readAt: new Date("2026-03-25T23:10:00Z") },
    { userId: admin.id, tournamentId: ipl.id, type: "MATCH_STARTED" as const, channel: "BOTH" as const, title: "Match 5 Live", message: "Chennai Super Kings vs Royal Challengers Bengaluru is now LIVE at Chepauk!", link: "/tournaments/ipl2026/matches/5", isRead: false, emailSent: true, emailSentAt: new Date("2026-03-26T19:35:00Z") },
    { userId: manager.id, tournamentId: ipl.id, type: "REGISTRATION_SUBMITTED" as const, channel: "IN_APP" as const, title: "New Registration", message: "Liam Livingstone has registered for IPL 2026.", isRead: true, readAt: new Date("2025-12-15T10:00:00Z") },
    { userId: manager.id, tournamentId: ipl.id, type: "REGISTRATION_APPROVED" as const, channel: "EMAIL" as const, title: "Registration Approved", message: "Virat Kohli's registration for IPL 2026 has been approved.", emailSent: true, emailSentAt: new Date("2026-01-06T10:00:00Z") },
    { userId: admin.id, tournamentId: ipl.id, type: "AUCTION_STARTED" as const, channel: "BOTH" as const, title: "Mega Auction Live", message: "IPL 2026 Mega Auction has started! 8 teams battling for 200+ players.", link: "/tournaments/ipl2026/auction", isRead: true, readAt: new Date("2026-01-15T10:05:00Z"), emailSent: true, emailSentAt: new Date("2026-01-15T10:01:00Z") },
    { userId: admin.id, tournamentId: ipl.id, type: "AUCTION_PLAYER_SOLD" as const, channel: "IN_APP" as const, title: "Player Sold", message: "Virat Kohli sold to Mumbai Indians for 15 Crore!", isRead: true, readAt: new Date("2026-01-15T10:30:00Z") },
    { userId: manager.id, tournamentId: ipl.id, type: "TEAM_CREATED" as const, channel: "IN_APP" as const, title: "Squad Finalized", message: "All 8 IPL team squads have been finalized after the mega auction.", isRead: false },
    { tournamentId: ipl.id, type: "MATCH_SCHEDULED" as const, channel: "IN_APP" as const, title: "Schedule Released", message: "IPL 2026 full match schedule has been released. First match: MI vs CSK on March 22.", isRead: false },
    { userId: admin.id, tournamentId: clt20.id, type: "GENERAL" as const, channel: "IN_APP" as const, title: "CLT20 Registration Open", message: "Champions League T20 2026 registrations are now open! Deadline: August 31.", link: "/tournaments/clt20-2026", isRead: false },
    { userId: manager.id, tournamentId: clt20.id, type: "REGISTRATION_SUBMITTED" as const, channel: "BOTH" as const, title: "CLT20 Registration", message: "Pat Cummins has registered for Champions League T20 2026.", emailSent: true, emailSentAt: new Date("2026-06-15T10:00:00Z") },
    { userId: admin.id, type: "GENERAL" as const, channel: "IN_APP" as const, title: "System Update", message: "Platform maintenance scheduled for April 1st, 2:00 AM - 5:00 AM IST.", isRead: false },
    { userId: manager.id, type: "GENERAL" as const, channel: "IN_APP" as const, title: "Welcome", message: "Welcome to CricketPro Tournament Manager! Start managing your tournaments.", isRead: true, readAt: new Date("2025-02-01T12:05:00Z") },
  ];

  await Promise.all(
    notifData.map((n) => prisma.notification.create({ data: n })),
  );

  // ── EmailLog (8) ────────────────────────────────────────────────────────
  const emailLogData = [
    { to: "admin@cricketpro.com", subject: "IPL 2026 — Match 1 Result", html: "<h1>MI beat CSK by 5 wickets</h1><p>Kohli 72*(48), Bumrah 3/28. MI chase down 169 in 19.2 overs at Wankhede.</p>", text: "MI beat CSK by 5 wickets. Kohli 72*(48), Bumrah 3/28.", status: "SENT", tournamentId: ipl.id },
    { to: "admin@cricketpro.com", subject: "IPL 2026 — Match 3 Result", html: "<h1>DC beat RR by 8 wickets</h1><p>Hardik 68*(35) & 2/22. RR bowled out for 142.</p>", text: "DC beat RR by 8 wickets. Hardik Pandya 68* and 2/22.", status: "SENT", tournamentId: ipl.id },
    { to: "manager@cricketpro.com", subject: "Registration Approved — Virat Kohli", html: "<p>Virat Kohli's registration for IPL 2026 has been approved by the tournament admin.</p>", text: "Virat Kohli's registration for IPL 2026 has been approved.", status: "SENT", tournamentId: ipl.id },
    { to: "admin@cricketpro.com", subject: "IPL 2026 Mega Auction Started", html: "<h1>The mega auction is now live!</h1><p>8 franchise teams competing for 200+ players. Follow live on CricketPro.</p>", text: "IPL 2026 Mega Auction is live.", status: "SENT", tournamentId: ipl.id },
    { to: "admin@cricketpro.com", subject: "IPL 2026 — Match 5 Live", html: "<p>CSK vs RCB is now live at MA Chidambaram Stadium, Chennai.</p>", text: "CSK vs RCB is live at Chepauk.", status: "SENT", tournamentId: ipl.id },
    { to: "manager@cricketpro.com", subject: "CLT20 2026 — New Registration", html: "<p>Pat Cummins has submitted a registration for Champions League T20 2026.</p>", text: "Pat Cummins registered for CLT20.", status: "SENT", tournamentId: clt20.id },
    { to: "admin@cricketpro.com", subject: "Weekly Tournament Summary", html: "<p>Your weekly summary: 4 matches completed, 1 live, 3 scheduled. Points table updated.</p>", text: "Weekly summary: 4 completed, 1 live, 3 scheduled.", status: "FAILED", error: "SMTP connection timeout after 30s" },
    { to: "manager@cricketpro.com", subject: "Welcome to CricketPro", html: "<h1>Welcome!</h1><p>You've been added as a Tournament Admin for IPL 2026. Get started at cricketpro.com/dashboard.</p>", text: "Welcome to CricketPro. You are now a Tournament Admin.", status: "SENT" },
  ];

  await Promise.all(
    emailLogData.map((e) => prisma.emailLog.create({ data: e })),
  );

  // ── UserTournamentAccess ────────────────────────────────────────────────
  await prisma.userTournamentAccess.createMany({
    data: [
      { userId: admin.id, tournamentId: ipl.id, role: "TOURNAMENT_OWNER", grantedBy: admin.id, isActive: true },
      { userId: manager.id, tournamentId: ipl.id, role: "TOURNAMENT_ADMIN", grantedBy: admin.id, isActive: true },
      { userId: demoPlayerUser.id, tournamentId: ipl.id, role: "VIEWER", grantedBy: admin.id, isActive: true },
      { userId: admin.id, tournamentId: clt20.id, role: "TOURNAMENT_OWNER", grantedBy: admin.id, isActive: true },
      { userId: manager.id, tournamentId: clt20.id, role: "SCORER", grantedBy: admin.id, isActive: true },
    ],
  });

  // ── TournamentSettings (IPL) ────────────────────────────────────────────
  await prisma.tournamentSettings.create({
    data: {
      tournamentId: ipl.id,
      autoSchedule: true,
      allowLateReg: false,
      requireApproval: true,
      enableLiveScoring: true,
      enableCommentary: true,
      enableNotifications: true,
      emailOnRegistration: true,
      emailOnApproval: true,
      emailOnMatchResult: true,
      publicScoreboard: true,
      showPlayerStats: true,
      showTeamFinances: false,
      auctionBidTimeSec: 30,
      auctionMinIncrement: 25,
      matchDlsEnabled: true,
      powerplayEnd: 6,
      middleOversEnd: 15,
      maxOversPerBowler: 4,
      freeHitOnNoBall: true,
      wideRunPenalty: 1,
      noBallRunPenalty: 1,
      customRules: "Impact Player substitute allowed. Strategic timeout of 2.5 minutes per innings.",
    },
  });

  // ── MatchPlayingXI (Match 1 — MI vs CSK, 3 per team for demo purposes)
  // Note: Real matches require 11 per team via the API (validated by setPlayingXI).
  // Seed inserts directly, bypassing service validation, for minimal demo data.
  const playingXIData = [
    // MI batting lineup (team index 0)
    { matchId: matches[0].id, teamId: iplTeams[0].id, playerId: players[0].id, slotNo: 1, role: "BATTER", isCaptain: true, isViceCaptain: false, isWicketKeeper: false },
    { matchId: matches[0].id, teamId: iplTeams[0].id, playerId: players[5].id, slotNo: 2, role: "WICKET_KEEPER", isCaptain: false, isViceCaptain: true, isWicketKeeper: true },
    { matchId: matches[0].id, teamId: iplTeams[0].id, playerId: players[22].id, slotNo: 3, role: "BATTER", isCaptain: false, isViceCaptain: false, isWicketKeeper: false },
    // CSK batting lineup (team index 1)
    { matchId: matches[0].id, teamId: iplTeams[1].id, playerId: players[1].id, slotNo: 1, role: "BATTER", isCaptain: true, isViceCaptain: false, isWicketKeeper: false },
    { matchId: matches[0].id, teamId: iplTeams[1].id, playerId: players[4].id, slotNo: 2, role: "ALL_ROUNDER", isCaptain: false, isViceCaptain: true, isWicketKeeper: false },
    { matchId: matches[0].id, teamId: iplTeams[1].id, playerId: players[23].id, slotNo: 3, role: "BOWLER", isCaptain: false, isViceCaptain: false, isWicketKeeper: false },
  ];

  await Promise.all(
    playingXIData.map((xi) => prisma.matchPlayingXI.create({ data: xi })),
  );

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log("Seeding complete!\n");
  console.log("  Users:                  3 (+ demo player account player@cricketpro.com)");
  console.log("  Tournaments:            2");
  console.log(`  Teams:                  ${iplTeams.length + clt20Teams.length}`);
  console.log(`  Players:                ${players.length}`);
  console.log(`  Registrations:          ${players.length}`);
  console.log("  Auction Series:         2");
  console.log("  Auction Rounds:         8");
  console.log(`  Auction Bids:           ${bidData.length}`);
  console.log(`  Squad Players:          ${squadData.length}`);
  console.log(`  Purse Ledger Entries:   ${ledgerEntries.length}`);
  console.log(`  Matches:                ${matches.length}`);
  console.log("  Innings:                9");
  console.log(`  Ball-by-Ball:           ${ballData.length}`);
  console.log(`  Commentary:             ${commentaryData.length}`);
  console.log(`  Points Table:           ${pointsData.length}`);
  console.log(`  Notifications:          ${notifData.length}`);
  console.log(`  Email Logs:             ${emailLogData.length}`);
  console.log("  User Tournament Access: 5");
  console.log("  Tournament Settings:    1");
  console.log(`  Match Playing XI:       ${playingXIData.length}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
