#!/usr/bin/env node

// Test script to verify the game selection modification
console.log("Testing game selection modification...");

// Read the create-tournament-form.jsx file
const fs = require('fs');
const path = require('path');

try {
  const filePath = path.join(__dirname, 'components', 'create-tournament-form.jsx');
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract the games array
  const gamesArrayMatch = content.match(/const games = \[([\s\S]*?)\]/);

  if (gamesArrayMatch) {
    const gamesContent = gamesArrayMatch[1];
    const games = gamesContent
      .split(',')
      .map(line => line.trim().replace(/"/g, ''))
      .filter(game => game.length > 0);

    console.log("Found games in the array:");
    games.forEach((game, index) => {
      console.log(`${index + 1}. ${game}`);
    });

    // Check if only the required games are present
    const expectedGames = ["eFootball 2026", "FC Mobile"];
    const hasOnlyExpectedGames = games.length === expectedGames.length &&
                                 games.every(game => expectedGames.includes(game));

    if (hasOnlyExpectedGames) {
      console.log("✅ SUCCESS: Game selection contains only 'eFootball 2026' and 'FC Mobile'");
      console.log("✅ All other games have been successfully removed");
    } else {
      console.log("❌ ERROR: Game selection does not match expected requirements");
      console.log("Expected:", expectedGames);
      console.log("Found:", games);
    }
  } else {
    console.log("❌ ERROR: Could not find games array in the file");
  }

} catch (error) {
  console.log("❌ ERROR reading file:", error.message);
}
