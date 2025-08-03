import "dotenv/config";
import { db } from "./db";
import { parties } from "@shared/schema";
import { sql } from "drizzle-orm";

const partyList = [
  { partyNumber: "P001", partyName: "ABC Construction Ltd." },
  { partyNumber: "P002", partyName: "XYZ Infrastructure Pvt. Ltd." },
  { partyNumber: "P003", partyName: "Global Builders Inc." },
  { partyNumber: "P004", partyName: "Metro Development Corp." },
  { partyNumber: "P005", partyName: "Highway Solutions Ltd." },
  { partyNumber: "P006", partyName: "Urban Projects Pvt. Ltd." },
  { partyNumber: "P007", partyName: "Prime Contractors" },
  { partyNumber: "P008", partyName: "Mega Construction Group" },
  { partyNumber: "P009", partyName: "National Infrastructure Ltd." },
  { partyNumber: "P010", partyName: "City Development Authority" }
];

async function setupParties() {
  try {
    console.log("Setting up parties...\n");

    // Check if parties already exist
    const existingParties = await db.select().from(parties);
    if (existingParties.length > 0) {
      console.log(`⚠️  Parties already exist in the database (${existingParties.length} found).`);
      console.log("To add more parties, modify the partyList in this script.\n");
      
      // Show existing parties
      console.log("Existing parties:");
      existingParties.forEach(party => {
        console.log(`  - ${party.partyNumber}: ${party.partyName}`);
      });
      return;
    }

    // Insert all parties
    for (const party of partyList) {
      try {
        await db.insert(parties).values(party);
        console.log(`✓ Added: ${party.partyNumber} - ${party.partyName}`);
      } catch (error: any) {
        if (error.message?.includes("duplicate")) {
          console.log(`⚠️  Skipped: ${party.partyNumber} - ${party.partyName} (already exists)`);
        } else {
          console.error(`✗ Failed to add ${party.partyNumber}:`, error.message);
        }
      }
    }

    console.log("\n✅ Party setup completed!");
    console.log(`Total parties added: ${partyList.length}`);
    
  } catch (error) {
    console.error("Error setting up parties:", error);
  } finally {
    await db.$client.end();
  }
}

// Run the setup
setupParties();
