const prisma = require('../services/db');

// ==================== PEER-TO-PEER MESSAGES ====================

exports.sendMessage = async (req, res) => {
  try {
    const { receiver_id, message_text, file_url } = req.body;
    const sender_id = req.user.id;

    if (!receiver_id || !message_text) {
      return res.status(400).json({ error: 'receiver_id and message_text are required' });
    }

    const message = await prisma.message.create({
      data: {
        sender_id,
        receiver_id,
        message_text,
        file_url
      },
      include: {
        sender: { select: { id: true, full_name: true, username: true, profile_image: true } },
        receiver: { select: { id: true, full_name: true, username: true, profile_image: true } }
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { user: other_user_id } = req.params;
    const current_user_id = req.user.id;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { sender_id: current_user_id, receiver_id: other_user_id },
          { sender_id: other_user_id, receiver_id: current_user_id }
        ]
      },
      orderBy: { created_at: 'asc' },
      include: {
        sender: { select: { id: true, full_name: true, username: true, profile_image: true } }
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const current_user_id = req.user.id;
    
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { sender_id: current_user_id },
          { receiver_id: current_user_id }
        ]
      },
      orderBy: { created_at: 'desc' },
      include: {
        sender: { select: { id: true, full_name: true, email: true, username: true, profile_image: true } },
        receiver: { select: { id: true, full_name: true, email: true, username: true, profile_image: true } }
      }
    });

    const conversationMap = new Map();
    messages.forEach(msg => {
      const otherUser = msg.sender_id === current_user_id ? msg.receiver : msg.sender;
      if (!conversationMap.has(otherUser.id)) {
        conversationMap.set(otherUser.id, {
          id: otherUser.id,
          type: 'direct',
          userId: otherUser.id,
          user: otherUser,
          name: otherUser.full_name,
          lastMessage: msg.message_text,
          timestamp: msg.created_at
        });
      }
    });

    res.json(Array.from(conversationMap.values()));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

// ==================== PROJECT GROUP MESSAGES ====================

exports.getMyProjects = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Projects user owns or is a member of
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { owner_id: user_id },
          { members: { some: { user_id } } }
        ]
      },
      include: {
        owner: { select: { id: true, full_name: true, username: true, profile_image: true } },
        members: {
          include: {
            user: { select: { id: true, full_name: true, username: true, profile_image: true } }
          }
        },
        project_messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, full_name: true, username: true, profile_image: true } }
          }
        }
      }
    });

    const result = projects.map(p => ({
      id: p.id,
      type: 'group',
      name: p.title,
      description: p.description,
      memberCount: p.members.length + 1, // +1 for owner
      lastMessage: p.project_messages[0]?.message_text || null,
      lastSender: p.project_messages[0]?.sender?.full_name || null,
      timestamp: p.project_messages[0]?.created_at || p.created_at,
      members: [
        { ...p.owner, role: 'owner' },
        ...p.members.map(m => ({ ...m.user, role: m.role }))
      ]
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching user projects for chat:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

exports.getProjectMessages = async (req, res) => {
  try {
    const { projectId } = req.params;
    const user_id = req.user.id;

    // Verify user is a member or owner of the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isMember = project.owner_id === user_id || 
      project.members.some(m => m.user_id === user_id);

    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this project' });
    }

    const messages = await prisma.projectMessage.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'asc' },
      include: {
        sender: { select: { id: true, full_name: true, username: true, profile_image: true } }
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching project messages:', error);
    res.status(500).json({ error: 'Failed to fetch project messages' });
  }
};

exports.sendProjectMessage = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { message_text } = req.body;
    const sender_id = req.user.id;

    if (!message_text) {
      return res.status(400).json({ error: 'message_text is required' });
    }

    // Verify user is a member or owner
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isMember = project.owner_id === sender_id || 
      project.members.some(m => m.user_id === sender_id);

    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this project' });
    }

    const message = await prisma.projectMessage.create({
      data: {
        project_id: projectId,
        sender_id,
        message_text
      },
      include: {
        sender: { select: { id: true, full_name: true, username: true, profile_image: true } }
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending project message:', error);
    res.status(500).json({ error: 'Failed to send project message' });
  }
};
