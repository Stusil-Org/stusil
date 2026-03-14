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
        owner: { select: { full_name: true, username: true } }
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
