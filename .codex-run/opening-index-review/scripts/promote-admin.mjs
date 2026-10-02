import "dotenv/config";
import { prisma } from "../server/db.js";
import { promoteExistingUserToAdmin } from "../server/adminConfig.js";
import { validateUsername } from "../server/security.js";

const usernameResult = validateUsername(process.argv[2]);

try {
  if (!usernameResult.ok) {
    console.error(`Usage: npm run admin:promote -- <username>\n${usernameResult.error}`);
    process.exitCode = 1;
  } else {
    const result = await promoteExistingUserToAdmin({
      prisma,
      username: usernameResult.value
    });
    if (!result.ok) {
      console.error(`User not found: ${result.username}`);
      process.exitCode = 1;
    } else if (result.changed) {
      console.log(`Promoted ${result.user.username} to admin.`);
    } else {
      console.log(`${result.user.username} is already an admin.`);
    }
  }
} finally {
  await prisma.$disconnect();
}
