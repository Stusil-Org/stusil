const prisma = require('../services/db');

exports.sendRequest = async (req, res) => {
  try {
    const { project_id, receiver_id } = req.body;
    const sender_id = req.user.id;

    if (sender_id === receiver_id) {
      return res.status(400).json({ error: 'Cannot request collaboration with yourself' });
    }

    const existingRequest = await prisma.collabRequest.findFirst({
      where: { project_id, sender_id, receiver_id, status: 'pending' }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Collaboration request already pending' });
    }

    const collab = await prisma.collabRequest.create({
      data: { project_id, sender_id, receiver_id }
    });

    res.status(201).json(collab);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send collaboration request' });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const { request_id } = req.body;
    const request = await prisma.collabRequest.findUnique({ where: { id: request_id } });

    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.receiver_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    await prisma.collabRequest.update({
      where: { id: request_id },
      data: { status: 'accepted' }
    });

    await prisma.projectMember.create({
      data: { project_id: request.project_id, user_id: request.sender_id, role: 'member' }
    });

    res.json({ message: 'Collaboration request accepted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept collaboration request' });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const { request_id } = req.body;
    const request = await prisma.collabRequest.findUnique({ where: { id: request_id } });

    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.receiver_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    await prisma.collabRequest.update({
      where: { id: request_id },
      data: { status: 'rejected' }
    });

    res.json({ message: 'Collaboration request rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject collaboration request' });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const requests = await prisma.collabRequest.findMany({
      where: {
        OR: [{ sender_id: req.user.id }, { receiver_id: req.user.id }]
      },
      include: {
        project: { select: { title: true, id: true } },
        sender: { select: { username: true, full_name: true } },
        receiver: { select: { username: true, full_name: true } }
      }
    });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};
