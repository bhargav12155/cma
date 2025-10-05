// Community name aliases for common variations
const COMMUNITY_ALIASES = {
  "Remington Ridge": "Remington",
  "Indian Creek Estates": "Indian Creek",
  "Silver Oak": "Silver Oak Estates",
  // Add more as needed
};

// Helper function to resolve community name aliases
function resolveCommunityCommunityName(inputName) {
  const trimmed = inputName?.trim();
  if (!trimmed) return null;

  // Check direct alias
  if (COMMUNITY_ALIASES[trimmed]) {
    return COMMUNITY_ALIASES[trimmed];
  }

  // Check case-insensitive alias
  const lowerInput = trimmed.toLowerCase();
  for (const [alias, canonical] of Object.entries(COMMUNITY_ALIASES)) {
    if (alias.toLowerCase() === lowerInput) {
      return canonical;
    }
  }

  // Return original if no alias found
  return trimmed;
}

module.exports = { COMMUNITY_ALIASES, resolveCommunityCommunityName };
