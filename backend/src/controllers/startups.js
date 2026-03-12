const prisma = require('../services/db');
const { createNotification } = require('./notifications');

exports.createStartup = async (req, res) => {
  try {
    const { title, description, field, team_needed, roles } = req.body;

    const startup = await prisma.startupIdea.create({
      data: {
        title,
        description,
        field,
        team_needed: team_needed !== undefined ? team_needed : true,
        creator_id: req.user.id
      }
    });

    // Create roles if provided
    if (roles && Array.isArray(roles) && roles.length > 0) {
      for (const role of roles) {
        await prisma.startupRole.create({
          data: {
            startup_id: startup.id,
            title: role.title,
            description: role.description || null,
            questions: role.questions ? JSON.stringify(role.questions) : null,
          }
        });
      }
    }

    const full = await prisma.startupIdea.findUnique({
      where: { id: startup.id },
      include: {
        creator: { select: { id: true, username: true, full_name: true } },
        roles: true
      }
    });

    res.status(201).json(full);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create startup idea' });
  }
};

exports.getStartups = async (req, res) => {
  try {
    const startups = await prisma.startupIdea.findMany({
      include: {
        creator: { select: { id: true, username: true, full_name: true } },
        roles: {
          include: {
            applications: {
              include: {
                user: { select: { id: true, username: true, full_name: true, profile_image: true, bio: true, university: true, field_of_study: true, links: true } }
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(startups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch startup ideas' });
  }
};

exports.getStartupById = async (req, res) => {
  try {
    const startup = await prisma.startupIdea.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { id: true, username: true, full_name: true, bio: true } },
        roles: {
          include: {
            applications: {
              include: {
                user: { select: { id: true, username: true, full_name: true, profile_image: true, bio: true, university: true, field_of_study: true, links: true } }
              }
            }
          }
        }
      }
    });

    if (!startup) return res.status(404).json({ error: 'Startup idea not found' });
    res.json(startup);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch startup idea' });
  }
};

exports.updateStartup = async (req, res) => {
  try {
    const startup = await prisma.startupIdea.findUnique({ where: { id: req.params.id } });
    if (!startup) return res.status(404).json({ error: 'Startup idea not found' });
    if (startup.creator_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const { roles, ...startupData } = req.body;

    const updatedStartup = await prisma.startupIdea.update({
      where: { id: req.params.id },
      data: startupData
    });

    res.json(updatedStartup);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update startup idea' });
  }
};

exports.deleteStartup = async (req, res) => {
  try {
    const startup = await prisma.startupIdea.findUnique({ where: { id: req.params.id } });
    if (!startup) return res.status(404).json({ error: 'Startup idea not found' });
    if (startup.creator_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    await prisma.startupApplication.deleteMany({ where: { startup_id: req.params.id } });
    await prisma.startupRole.deleteMany({ where: { startup_id: req.params.id } });
    await prisma.startupIdea.delete({ where: { id: req.params.id } });

    res.json({ message: 'Startup idea removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete startup idea' });
  }
};

// ==================== ROLE-BASED APPLICATIONS ====================

exports.addRole = async (req, res) => {
  try {
    const { id: startupId } = req.params;
    const { title, description, questions } = req.body;

    const startup = await prisma.startupIdea.findUnique({ where: { id: startupId } });
    if (!startup) return res.status(404).json({ error: 'Startup not found' });
    if (startup.creator_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const role = await prisma.startupRole.create({
      data: {
        startup_id: startupId,
        title,
        description: description || null,
        questions: questions ? JSON.stringify(questions) : null,
      }
    });

    res.status(201).json(role);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add role' });
  }
};

exports.applyForRole = async (req, res) => {
  try {
    const { id: startupId, roleId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    const startup = await prisma.startupIdea.findUnique({
      where: { id: startupId },
      include: { creator: true }
    });
    if (!startup) return res.status(404).json({ error: 'Startup not found' });
    if (startup.creator_id === userId) return res.status(400).json({ error: 'Cannot apply to your own startup' });

    const role = await prisma.startupRole.findUnique({ where: { id: roleId } });
    if (!role) return res.status(404).json({ error: 'Role not found' });
    if (role.is_filled) return res.status(400).json({ error: 'Position already filled' });

    const existing = await prisma.startupApplication.findUnique({
      where: { role_id_user_id: { role_id: roleId, user_id: userId } }
    });
    if (existing) return res.status(400).json({ error: 'Already applied' });

    const application = await prisma.startupApplication.create({
      data: {
        startup_id: startupId,
        role_id: roleId,
        user_id: userId,
        answers: answers ? JSON.stringify(answers) : null,
      },
      include: {
        user: { select: { id: true, username: true, full_name: true } }
      }
    });

    const io = req.app.get('io');
    await createNotification(io, startup.creator_id, {
      type: 'application',
      title: 'New Startup Application',
      body: `${application.user.full_name} applied for "${role.title}" in "${startup.title}"`,
      link: `/startups`
    });

    res.status(201).json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to apply' });
  }
};

exports.handleApplication = async (req, res) => {
  try {
    const { id: startupId, applicationId } = req.params;
    const { action } = req.body;

    const startup = await prisma.startupIdea.findUnique({ where: { id: startupId } });
    if (!startup) return res.status(404).json({ error: 'Startup not found' });
    if (startup.creator_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const application = await prisma.startupApplication.findUnique({
      where: { id: applicationId },
      include: { role: true, user: true }
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const io = req.app.get('io');

    if (action === 'accept') {
      await prisma.startupApplication.update({
        where: { id: applicationId },
        data: { status: 'accepted' }
      });
      await prisma.startupRole.update({
        where: { id: application.role_id },
        data: { is_filled: true }
      });

      await createNotification(io, application.user_id, {
        type: 'accepted',
        title: 'Startup Application Accepted! 🎉',
        body: `Your application for "${application.role.title}" in "${startup.title}" was accepted!`,
        link: `/startups`
      });

      res.json({ message: 'Application accepted' });
    } else if (action === 'reject') {
      await prisma.startupApplication.update({
        where: { id: applicationId },
        data: { status: 'rejected' }
      });

      await createNotification(io, application.user_id, {
        type: 'rejected',
        title: 'Startup Application Update',
        body: `Your application for "${application.role.title}" in "${startup.title}" was not selected.`,
        link: `/startups`
      });

      res.json({ message: 'Application rejected' });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to handle application' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { id: startupId, memberId } = req.params; // memberId is the applicationId
    const startup = await prisma.startupIdea.findUnique({ where: { id: startupId } });
    if (!startup) return res.status(404).json({ error: 'Startup not found' });
    if (startup.creator_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const application = await prisma.startupApplication.findUnique({ where: { id: memberId } });
    if (!application || application.startup_id !== startupId) return res.status(404).json({ error: 'Member not found' });

    await prisma.startupApplication.delete({ where: { id: memberId } });
    
    // Mark role as not filled
    await prisma.startupRole.update({
      where: { id: application.role_id },
      data: { is_filled: false }
    });

    // Notify the removed user
    await createNotification(
      application.user_id,
      'startup_removed',
      'Startup Update',
      `You have been removed from the founding team of: ${startup.title}`,
      `/startups`
    );

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};
