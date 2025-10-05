/**
 * Add this to server.js to create a community name resolution endpoint
 */

// GET /api/resolve-community-name?name=Remington Ridge
app.get("/api/resolve-community-name", async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: "Missing 'name' parameter",
    });
  }

  try {
    // First check aliases
    const aliasResolved = resolveCommunityCommunityName(name);

    // Then check against actual communities list for partial matches
    const communitiesResp = await fetch(
      `${req.protocol}://${req.get(
        "host"
      )}/api/communities?q=${encodeURIComponent(name.split(" ")[0])}`
    );
    const communitiesData = await communitiesResp.json();

    const matches = communitiesData.communities || [];
    const exactMatch = matches.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    const partialMatches = matches.filter(
      (c) =>
        c.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(c.name.toLowerCase())
    );

    res.json({
      success: true,
      input: name,
      aliasResolved,
      exactMatch: exactMatch?.name || null,
      partialMatches: partialMatches.map((c) => c.name),
      recommended:
        exactMatch?.name || aliasResolved || partialMatches[0]?.name || null,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});
