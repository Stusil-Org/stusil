const prisma = require('../services/db');

exports.getTrending = async (req, res) => {
  try {
    // Trending Projects: Highest (views + stars * 5)
    const trendingProjects = await prisma.project.findMany({
      where: { visibility: 'public' },
      take: 3,
      orderBy: [
        { stars: 'desc' },
        { views: 'desc' },
        { created_at: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        field: true,
        banner_image: true,
        views: true,
        stars: true,
        owner: { select: { full_name: true, username: true, profile_image: true } }
      }
    });

    // Hot Ideas: Highest number of applications
    // Since we can't directly order by relation count in a simple findMany easily in all prisma versions/setups without aggregation
    // We'll fetch startups and sort them by the length of applications array (or use _count if available)
    const hotIdeas = await prisma.startupIdea.findMany({
      take: 3,
      include: {
        _count: {
          select: { applications: true }
        },
        creator: { select: { full_name: true, username: true } }
      },
      orderBy: {
        applications: {
          _count: 'desc'
        }
      }
    });

    res.json({
      trendingProjects,
      hotIdeas: hotIdeas.map(idea => ({
        id: idea.id,
        title: idea.title,
        field: idea.field,
        joinRequests: idea._count.applications,
        creator: idea.creator
      }))
    });
  } catch (error) {
    console.error("Error fetching trending data:", error);
    res.status(500).json({ error: 'Failed to fetch trending data' });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    // Top Students: Based on number of projects (stars total if we had that, otherwise just counts for now)
    // Using simple prisma strategy: Sort by stars (as a proxy for skill_level or activity)
    const topStudents = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        full_name: true,
        username: true,
        profile_image: true,
        field_of_study: true,
        country: true,
        _count: {
          select: { projects: true, startups: true }
        }
      },
      orderBy: { 
        created_at: 'asc' // Placeholder, usually would use points
      }
    });

    // Top Projects: Most stars overall
    const topProjects = await prisma.project.findMany({
      where: { visibility: 'public' },
      take: 5,
      orderBy: { stars: 'desc' },
      select: {
        id: true,
        title: true,
        stars: true,
        field: true,
        owner: { select: { full_name: true, profile_image: true } }
      }
    });

    res.json({
      topStudents,
      topProjects
    });
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};
