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

    // Top 3 Students for mini-leaderboard
    const topStudentsData = await prisma.user.findMany({
      take: 20,
      select: {
        id: true,
        full_name: true,
        username: true,
        profile_image: true,
        _count: { select: { projects: true, startups: true } }
      }
    });

    const topStudents = topStudentsData
      .sort((a, b) => (b._count.projects + b._count.startups) - (a._count.projects + a._count.startups))
      .slice(0, 3);

    res.json({
      trendingProjects,
      hotIdeas: hotIdeas.map(idea => ({
        id: idea.id,
        title: idea.title,
        field: idea.field,
        joinRequests: idea._count.applications,
        creator: idea.creator
      })),
      topStudents: topStudents.map(s => ({
        ...s,
        xp: (s._count.projects + s._count.startups) * 10
      }))
    });
  } catch (error) {
    console.error("Error fetching trending data:", error);
    res.status(500).json({ error: 'Failed to fetch trending data' });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    // Fetch top 50 users then sort by total contributions (projects + startups)
    const users = await prisma.user.findMany({
      take: 50,
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
      }
    });

    // Sort by calculated XP proxy: (projects * 2 + startups * 3) (or just sum)
    const topStudents = users
      .sort((a, b) => {
        const scoreA = (a._count.projects + a._count.startups);
        const scoreB = (b._count.projects + b._count.startups);
        return scoreB - scoreA;
      })
      .slice(0, 10);

    // Top Projects: Most stars overall
    const topProjects = await prisma.project.findMany({
      where: { visibility: 'public' },
      take: 5,
      orderBy: [
        { stars: 'desc' },
        { created_at: 'desc' }
      ],
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
