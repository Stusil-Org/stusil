const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sendRequest = async (req, res) => {
  try {
    const { receiver_id } = req.body;
    const sender_id = req.user.id;

    if (sender_id === receiver_id) {
      return res.status(400).json({ error: "You cannot connect with yourself." });
    }

    // Check if a connection already exists
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { sender_id, receiver_id },
          { sender_id: receiver_id, receiver_id: sender_id }
        ]
      }
    });

    if (existingConnection) {
      return res.status(400).json({ error: "Connection request already exists or you are already connected." });
    }

    const connection = await prisma.connection.create({
      data: {
        sender_id,
        receiver_id,
        status: "pending"
      }
    });

    return res.status(201).json(connection);
  } catch (error) {
    console.error("Error sending connection request:", error);
    return res.status(500).json({ error: "Server error sending connection request" });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const user_id = req.user.id;
    const requests = await prisma.connection.findMany({
      where: {
        receiver_id: user_id,
        status: "pending"
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            full_name: true,
            profile_image: true,
            field_of_study: true,
          }
        }
      }
    });

    return res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return res.status(500).json({ error: "Server error fetching pending requests" });
  }
};

const getConnections = async (req, res) => {
  try {
    const user_id = req.user.id;
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { sender_id: user_id },
          { receiver_id: user_id }
        ],
        status: "accepted"
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            full_name: true,
            profile_image: true,
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            full_name: true,
            profile_image: true,
          }
        }
      }
    });

    // Map to just return the attached users
    const connectedUsers = connections.map(conn => {
      if (conn.sender_id === user_id) {
        return conn.receiver;
      }
      return conn.sender;
    });

    return res.status(200).json({ connections, connectedUsers });
  } catch (error) {
    console.error("Error fetching connections:", error);
    return res.status(500).json({ error: "Server error fetching connections" });
  }
};

const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    const user_id = req.user.id;

    const request = await prisma.connection.findUnique({ where: { id } });

    if (!request) {
      return res.status(404).json({ error: "Request not found." });
    }

    if (request.receiver_id !== user_id) {
      return res.status(403).json({ error: "Not authorized." });
    }

    if (action === 'accept') {
      const updated = await prisma.connection.update({
        where: { id },
        data: { status: "accepted" }
      });
      return res.status(200).json(updated);
    } else if (action === 'reject') {
      await prisma.connection.delete({ where: { id } });
      return res.status(200).json({ message: "Request rejected." });
    } else {
      return res.status(400).json({ error: "Invalid action." });
    }
  } catch (error) {
    console.error("Error updating connection request:", error);
    return res.status(500).json({ error: "Server error updating request" });
  }
};

const removeConnection = async (req, res) => {
  try {
    const { id } = req.params; // connection id
    const user_id = req.user.id;

    const connection = await prisma.connection.findUnique({ where: { id } });

    if (!connection) {
      return res.status(404).json({ error: "Connection not found." });
    }

    // Only the sender or receiver can remove the connection
    if (connection.sender_id !== user_id && connection.receiver_id !== user_id) {
      return res.status(403).json({ error: "Not authorized." });
    }

    await prisma.connection.delete({ where: { id } });
    return res.status(200).json({ message: "Connection removed." });
  } catch (error) {
    console.error("Error removing connection:", error);
    return res.status(500).json({ error: "Server error removing connection" });
  }
};

module.exports = {
  sendRequest,
  getPendingRequests,
  getConnections,
  updateRequest,
  removeConnection,
};
