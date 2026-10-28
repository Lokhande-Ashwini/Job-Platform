const WorkerChangeRequest = require('../models/WorkerChangeRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Admin: create change request for a worker
exports.createRequest = async (req, res) => {
  try {
    const { workerId, fieldName, oldValue, suggestedValue, reason, priority } = req.body;
    const worker = await User.findById(workerId);
    if (!worker || worker.role !== 'worker') return res.status(404).json({ message: 'Worker not found' });

    const request = await WorkerChangeRequest.create({
      worker: workerId, admin: req.user.id,
      fieldName, oldValue, suggestedValue, reason, priority: priority || 'medium'
    });

    await Notification.create({
      user: workerId, title: 'Profile Change Request',
      message: `Admin has requested a change to your ${fieldName}. Please review and respond.`,
      type: 'system', relatedId: request._id
    });

    res.status(201).json(request);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Admin: get all requests for a worker
exports.getRequestsForWorker = async (req, res) => {
  try {
    const requests = await WorkerChangeRequest.find({ worker: req.params.workerId })
      .populate('admin', 'name').sort('-createdAt');
    res.json(requests);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Admin: get all pending requests
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await WorkerChangeRequest.find()
      .populate('worker', 'name email workerProfile')
      .populate('admin', 'name').sort('-createdAt');
    res.json(requests);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Worker: get own change requests
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await WorkerChangeRequest.find({ worker: req.user.id })
      .populate('admin', 'name').sort('-createdAt');
    res.json(requests);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Worker: respond to a request (accept/reject)
exports.respondToRequest = async (req, res) => {
  try {
    const { action, workerResponse } = req.body; // action: 'accept' | 'reject'
    const request = await WorkerChangeRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.worker.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    if (action === 'accept') {
      request.status = 'accepted';
      request.workerResponse = workerResponse || 'Accepted';
      request.updatedAt = new Date();

      // Apply the change to worker profile
      const worker = await User.findById(req.user.id);
      const field = request.fieldName;
      if (['name', 'phone'].includes(field)) {
        worker[field] = request.suggestedValue;
      } else if (['skills', 'experience', 'hourlyRate', 'bio', 'availability'].includes(field)) {
        if (field === 'skills') {
          worker.workerProfile.skills = request.suggestedValue.split(',').map(s => s.trim());
        } else if (field === 'experience' || field === 'hourlyRate') {
          worker.workerProfile[field] = parseFloat(request.suggestedValue);
        } else {
          worker.workerProfile[field] = request.suggestedValue;
        }
      }
      await worker.save();
      request.status = 'completed';

      await Notification.create({
        user: request.admin, title: 'Change Request Accepted',
        message: `Worker accepted your ${field} change request.`,
        type: 'system', relatedId: request._id
      });
    } else {
      request.status = 'rejected';
      request.workerResponse = workerResponse || 'Rejected';
      request.updatedAt = new Date();

      await Notification.create({
        user: request.admin, title: 'Change Request Rejected',
        message: `Worker rejected your ${request.fieldName} change request.`,
        type: 'system', relatedId: request._id
      });
    }

    await request.save();
    res.json(request);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Admin: suspend/activate worker
exports.updateWorkerStatus = async (req, res) => {
  try {
    const { action } = req.body; // 'suspend' | 'activate'
    const worker = await User.findById(req.params.workerId);
    if (!worker || worker.role !== 'worker') return res.status(404).json({ message: 'Worker not found' });
    worker.workerProfile.availability = action === 'activate';
    await worker.save();
    res.json({ message: `Worker ${action}d`, worker });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
