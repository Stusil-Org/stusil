const prisma = require('../services/db');
const { createNotification } = require('./notifications');

exports.createProject = async (req, res) => {
  try {
    const { title, description, field, team_size, deadline, visibility, roles, banner_image } = req.body;

    const project = await prisma.project.create({
      data: {
        title,
        description,
        field,
        team_size: parseInt(team_size) || 1,
        deadline: deadline ? new Date(deadline) : null,
        visibility: visibility || 'public',
        banner_image: banner_image || null,
        owner_id: req.user.id
      }
    });

    // Add owner as a member
    await prisma.projectMember.create({
      data: {
        project_id: project.id,
        user_id: req.user.id,
        role: 'owner'
      }
    });

    // Create roles if provided
    if (roles && Array.isArray(roles) && roles.length > 0) {
      for (const role of roles) {
        await prisma.projectRole.create({
          data: {
            project_id: project.id,
            title: role.title,
            description: role.description || null,
            questions: role.questions ? JSON.stringify(role.questions) : null,
          }
        });
      }
    }

    // Fetch complete project with roles
    const fullProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        owner: { select: { id: true, username: true, full_name: true } },
        roles: true,
        members: { include: { user: { select: { id: true, username: true, full_name: true } } } },
      }
    });

    res.status(201).json(fullProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const filters = req.query;
    const where = { visibility: 'public' };

    if (filters.field) where.field = filters.field;

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, username: true, full_name: true } },
        members: { include: { user: { select: { id: true, username: true, full_name: true } } } },
        roles: {
          include: {
            applications: {
              include: {
                user: { select: { id: true, username: true, full_name: true, profile_image: true, bio: true, university: true, field_of_study: true, links: true } }
              }
            }
          }
        },
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, username: true, full_name: true } },
        members: { include: { user: { select: { id: true, username: true, full_name: true } } } },
        files: true,
        roles: {
          include: {
            applications: {
              include: {
                user: { select: { id: true, username: true, full_name: true, profile_image: true, bio: true, university: true, field_of_study: true, links: true } }
              }
            }
          }
        },
      }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.owner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const { roles, ...projectData } = req.body;

    const updatedProject = await prisma.project.update({
      where: { id: req.params.id },
      data: projectData
    });

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.owner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    await prisma.application.deleteMany({ where: { project_id: req.params.id } });
    await prisma.projectRole.deleteMany({ where: { project_id: req.params.id } });
    await prisma.projectMessage.deleteMany({ where: { project_id: req.params.id } });
    await prisma.collabRequest.deleteMany({ where: { project_id: req.params.id } });
    await prisma.projectMember.deleteMany({ where: { project_id: req.params.id } });
    await prisma.project.delete({ where: { id: req.params.id } });

    res.json({ message: 'Project removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

// ==================== ROLE-BASED APPLICATIONS ====================

exports.addRole = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { title, description, questions } = req.body;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.owner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const role = await prisma.projectRole.create({
      data: {
        project_id: projectId,
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

exports.deleteRole = async (req, res) => {
  try {
    const { id: projectId, roleId } = req.params;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.owner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    await prisma.application.deleteMany({ where: { role_id: roleId } });
    await prisma.projectRole.delete({ where: { id: roleId } });

    res.json({ message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete role' });
  }
};

exports.applyForRole = async (req, res) => {
  try {
    const { id: projectId, roleId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: true }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.owner_id === userId) return res.status(400).json({ error: 'You cannot apply to your own project' });

    const role = await prisma.projectRole.findUnique({ where: { id: roleId } });
    if (!role) return res.status(404).json({ error: 'Role not found' });
    if (role.is_filled) return res.status(400).json({ error: 'This position is already filled' });

    // Check for duplicate application
    const existing = await prisma.application.findUnique({
      where: { role_id_user_id: { role_id: roleId, user_id: userId } }
    });
    if (existing) return res.status(400).json({ error: 'You have already applied for this role' });

    const application = await prisma.application.create({
      data: {
        project_id: projectId,
        role_id: roleId,
        user_id: userId,
        answers: answers ? JSON.stringify(answers) : null,
      },
      include: {
        user: { select: { id: true, username: true, full_name: true } }
      }
    });

    // Send notification to project owner
    const io = req.app.get('io');
    await createNotification(io, project.owner_id, {
      type: 'application',
      title: 'New Application',
      body: `${application.user.full_name} applied for "${role.title}" in "${project.title}"`,
      link: `/projects`
    });

    res.status(201).json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to apply for role' });
  }
};

exports.handleApplication = async (req, res) => {
  try {
    const { id: projectId, applicationId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.owner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { role: true, user: true }
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const io = req.app.get('io');

    if (action === 'accept') {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'accepted' }
      });

      // Add user as project member with the role title
      await prisma.projectMember.create({
        data: {
          project_id: projectId,
          user_id: application.user_id,
          role: application.role.title
        }
      });

      // Mark role as filled
      await prisma.projectRole.update({
        where: { id: application.role_id },
        data: { is_filled: true }
      });

      // Notify applicant
      await createNotification(io, application.user_id, {
        type: 'accepted',
        title: 'Application Accepted! 🎉',
        body: `Your application for "${application.role.title}" in "${project.title}" was accepted!`,
        link: `/messages`
      });

      // Auto-add user to project group chat via socket
      if (io) {
        io.to(`user_${application.user_id}`).emit('auto_join_project', {
          projectId: projectId,
          projectTitle: project.title,
          role: application.role.title
        });
      }

      res.json({ message: 'Application accepted' });
    } else if (action === 'reject') {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'rejected' }
      });

      await createNotification(io, application.user_id, {
        type: 'rejected',
        title: 'Application Update',
        body: `Your application for "${application.role.title}" in "${project.title}" was not selected.`,
        link: `/projects`
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
    const { id: projectId, memberId } = req.params;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.owner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const member = await prisma.projectMember.findUnique({ where: { id: memberId } });
    if (!member || member.project_id !== projectId) return res.status(404).json({ error: 'Member not found' });

    if (member.user_id === project.owner_id) {
      return res.status(400).json({ error: 'Owner cannot be removed' });
    }

    // Find and clean up associated application
    const application = await prisma.application.findFirst({
      where: {
        project_id: projectId,
        user_id: member.user_id,
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

    await prisma.projectMember.delete({ where: { id: memberId } });
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};
