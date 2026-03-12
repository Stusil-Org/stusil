const prisma = require('../services/db');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { projects: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const mappedUsers = users.map(user => ({
      id: user.id,
      name: user.full_name || user.username,
      email: user.email,
      role: user.email === 'nitnaware.prathmesh@gmail.com' ? 'Admin' : 'Student',
      status: 'Active',
      projectsCount: user._count.projects,
      joined: new Date(user.created_at).toLocaleDateString()
    }));

    res.json(mappedUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        owner: { select: { id: true, username: true, full_name: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, full_name: true, email: true } }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

exports.getAllStartups = async (req, res) => {
  try {
    const startups = await prisma.startupIdea.findMany({
      include: {
        creator: { select: { id: true, username: true, full_name: true } },
        applications: {
          where: { status: 'accepted' },
          include: {
            user: { select: { id: true, username: true, full_name: true, email: true } },
            role: { select: { title: true } }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    // Map applications to members to keep frontend consistent
    const mappedStartups = startups.map(s => ({
      ...s,
      members: s.applications.map(app => ({
        id: app.id,
        user_id: app.user_id,
        role: app.role?.title || 'Member',
        user: app.user
      }))
    }));
    res.json(mappedStartups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch startups' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    await prisma.projectMember.deleteMany({ where: { project_id: req.params.id } });
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

exports.deleteStartup = async (req, res) => {
  try {
    await prisma.startupIdea.delete({ where: { id: req.params.id } });
    res.json({ message: 'Startup idea deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete startup idea' });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        reporter: { select: { id: true, username: true, full_name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

exports.resolveReport = async (req, res) => {
  try {
    const { action } = req.body; // 'dismiss' or 'remove_target'
    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report) return res.status(404).json({ error: 'Report not found' });

    if (action === 'remove_target') {
      if (report.type === 'user') await prisma.user.delete({ where: { id: report.target_id } });
      if (report.type === 'project') {
        await prisma.projectMember.deleteMany({ where: { project_id: report.target_id } });
        await prisma.project.delete({ where: { id: report.target_id } });
      }
      if (report.type === 'startup') await prisma.startupIdea.delete({ where: { id: report.target_id } });
    }

    await prisma.report.update({
      where: { id: req.params.id },
      data: { status: 'resolved' }
    });

    res.json({ message: 'Report resolved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to resolve report' });
  }
};
exports.removeProjectMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    // Don't allow removing the owner
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    const member = await prisma.projectMember.findUnique({ where: { id: memberId } });
    
    if (!project || !member) return res.status(404).json({ error: 'Not found' });
    if (member.user_id === project.owner_id) {
      return res.status(400).json({ error: 'Cannot remove the project owner. Delete the project instead.' });
    }

    // Find associated application to clean up
    const memberRecord = await prisma.projectMember.findUnique({ where: { id: memberId } });
    if (memberRecord) {
      const application = await prisma.application.findFirst({
        where: {
          project_id: projectId,
          user_id: memberRecord.user_id,
          status: 'accepted'
        }
      });

      if (application) {
        await prisma.application.delete({ where: { id: application.id } });
        await prisma.projectRole.update({
          where: { id: application.role_id },
          data: { is_filled: false }
        });
      }
    }

    await prisma.projectMember.delete({ where: { id: memberId } });
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

exports.removeStartupMember = async (req, res) => {
  try {
    const { startupId, memberId } = req.params;
    // Startup "members" are applications with 'accepted' status
    const application = await prisma.startupApplication.findUnique({ where: { id: memberId } });
    if (!application || application.startup_id !== startupId) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Instead of deleting, we set it back to rejected or delete it?
    // ProjectMember is a separate table, but StartupApplication is both the role and the membership.
    // If we delete the application, the user is removed. 
    await prisma.startupApplication.delete({ where: { id: memberId } });
    
    // Also mark the role as not filled? 
    await prisma.startupRole.update({
      where: { id: application.role_id },
      data: { is_filled: false }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
};
