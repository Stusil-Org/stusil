const initSockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join user's personal room for direct notification/messaging
    socket.on('join_personal', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${socket.id} joined personal room: user_${userId}`);
    });

    // Join a project/group room
    socket.on('join_project', (projectId) => {
      socket.join(`project_${projectId}`);
      console.log(`User ${socket.id} joined project room: project_${projectId}`);
    });

    // Leave a project/group room
    socket.on('leave_project', (projectId) => {
      socket.leave(`project_${projectId}`);
      console.log(`User ${socket.id} left project room: project_${projectId}`);
    });

    // Direct message - send to specific user
    socket.on('send_direct_message', (data) => {
      // data: { receiverId, message (full message object from DB) }
      io.to(`user_${data.receiverId}`).emit('receive_direct_message', data.message);
      // Also emit back to sender for confirmation
      socket.emit('receive_direct_message', data.message);
    });

    // Project group message - broadcast to all project members
    socket.on('send_project_message', (data) => {
      // data: { projectId, message (full message object from DB) }
      io.to(`project_${data.projectId}`).emit('receive_project_message', {
        projectId: data.projectId,
        message: data.message
      });
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      if (data.projectId) {
        socket.to(`project_${data.projectId}`).emit('user_typing', {
          userId: data.userId,
          userName: data.userName,
          projectId: data.projectId
        });
      } else if (data.receiverId) {
        socket.to(`user_${data.receiverId}`).emit('user_typing', {
          userId: data.userId,
          userName: data.userName
        });
      }
    });

    socket.on('typing_stop', (data) => {
      if (data.projectId) {
        socket.to(`project_${data.projectId}`).emit('user_stop_typing', {
          userId: data.userId,
          projectId: data.projectId
        });
      } else if (data.receiverId) {
        socket.to(`user_${data.receiverId}`).emit('user_stop_typing', {
          userId: data.userId
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

module.exports = initSockets;
