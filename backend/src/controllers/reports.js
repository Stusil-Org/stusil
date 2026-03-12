const prisma = require('../services/db');

exports.createReport = async (req, res) => {
  try {
    const { type, target_id, target_name, reason } = req.body;
    
    // Validate inputs
    if (!['user', 'project', 'startup', 'message', 'other'].includes(type) || !target_id || !reason) {
      return res.status(400).json({ error: 'Missing required report fields' });
    }

    const report = await prisma.report.create({
      data: {
        type,
        target_id,
        target_name: target_name || 'Unknown',
        reason,
        reporter_id: req.user.id
      }
    });

    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
};
