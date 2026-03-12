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
      },
      portfolio: user.portfolio || {},
      projects: [...ownedProjects, ...joinedProjects],
      startup_ideas: user.startup_ideas
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
