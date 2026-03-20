const prisma = require('../services/db');

exports.getPortfolio = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        portfolio: true,
        projects: true,
        startup_ideas: true,
        startup_applications: {
          where: { status: 'accepted' },
          include: { startup: true }
        },
        project_members: {
          include: {
            project: {
              include: {
                owner: { select: { id: true, username: true, full_name: true } }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Projects owned by the user
    const ownedProjects = user.projects
      .filter(p => p.visibility === 'public')
      .map(p => ({ ...p, isOwner: true }));

    // Projects user is a member of (excluding owned ones to avoid duplication)
    const joinedProjects = user.project_members
      .map(m => ({ ...m.project, role: m.role, isOwner: false }))
      .filter(p => p.visibility === 'public' && p.owner_id !== user.id);

    // Calculate Dynamic Achievements (Public)
    const achievements = [];
    if (user.startup_ideas.length >= 1) {
      achievements.push({ title: "Visionary Founder", date: "Verified", icon: "Rocket", color: "text-amber-500" });
    }
    if (user.projects.length >= 3) {
      achievements.push({ title: "Product Builder", date: "Verified", icon: "Briefcase", color: "text-primary" });
    }
    const connectionsCount = await prisma.connection.count({
      where: {
        OR: [
          { sender_id: user.id, status: 'accepted' },
          { receiver_id: user.id, status: 'accepted' }
        ]
      }
    });
    if (connectionsCount >= 10) {
      achievements.push({ title: "Community Pillar", date: "Verified", icon: "Users", color: "text-emerald-500" });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        university: user.university,
        field_of_study: user.field_of_study,
        skill_level: user.skill_level,
        profile_image: user.profile_image,
        bio: user.bio,
        links: user.links,
        country: user.country,
        achievements: [
          { title: "Platform Tester", date: "2026", icon: "Award" },
          { title: "Early Adopter", date: "2026", icon: "Code" },
          ...achievements
        ]
      },
      portfolio: user.portfolio || {},
      projects: [...ownedProjects, ...joinedProjects],
      startup_ideas: [
        ...user.startup_ideas.map(s => ({ ...s, isOwner: true })),
        ...user.startup_applications.map(a => ({ ...a.startup, isOwner: false }))
      ]
    });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
};

exports.updatePortfolio = async (req, res) => {
  try {
    const { bio, skills, links, projects } = req.body;
    let portfolio = await prisma.portfolio.findUnique({ where: { user_id: req.user.id } });

    if (!portfolio) {
      portfolio = await prisma.portfolio.create({
        data: {
          user_id: req.user.id,
          bio,
          skills: JSON.stringify(skills),
          links: JSON.stringify(links),
          projects: JSON.stringify(projects)
        }
      });
    } else {
      portfolio = await prisma.portfolio.update({
        where: { user_id: req.user.id },
        data: {
          bio,
          skills: skills ? JSON.stringify(skills) : portfolio.skills,
          links: links ? JSON.stringify(links) : portfolio.links,
          projects: projects ? JSON.stringify(projects) : portfolio.projects
        }
      });
    }

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update portfolio' });
  }
};
