const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const c = require('../controllers/complaintController');
const { extractComplaintFromChat, generateChatbotResponse, validateExtractedComplaint } = require('../services/chatbotService');

// Chatbot routes (citizen-accessible)
router.post('/chatbot/extract', auth, authorize('citizen', 'super_admin'), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const extracted = await extractComplaintFromChat(message);
    const validated = validateExtractedComplaint(extracted.extracted);

    res.json({
      success: true,
      extracted: validated,
      confidence: extracted.confidence,
      suggestSubmit: validated.isValid && !validated.missingFields.includes('address')
    });
  } catch (error) {
    console.error('Chatbot extract error:', error);
    res.status(500).json({ error: error.message || 'Failed to extract complaint details' });
  }
});

router.post('/chatbot/message', auth, authorize('citizen', 'super_admin'), async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const response = await generateChatbotResponse(message, history);

    res.json({
      success: true,
      response
    });
  } catch (error) {
    console.error('Chatbot message error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate response' });
  }
});

// Public-ish (needs auth)
router.post('/', auth, c.fileComplaint);
router.get('/', auth, c.listComplaints);
router.get('/my', auth, c.myComplaints);
router.get('/officer/queue', auth, authorize('officer'), c.officerQueue);
router.get('/duplicate-check', auth, c.duplicateCheck);
router.get('/:id', auth, c.getComplaint);

// Status + Timeline
router.patch('/:id/status', auth, authorize('officer', 'department_manager', 'district_officer', 'nodal_officer', 'commissioner', 'cm_staff', 'cm', 'super_admin'), c.updateStatus);
router.post('/:id/timeline', auth, c.addTimeline);
router.post('/:id/assign', auth, authorize('cm', 'cm_staff', 'department_manager', 'district_officer', 'nodal_officer', 'commissioner', 'super_admin'), c.assignComplaint);

// Anti-False-Closure
router.post('/:id/resolve', auth, authorize('officer', 'department_manager', 'district_officer', 'super_admin'), c.resolveComplaint);
router.post('/:id/citizen-verify', auth, authorize('citizen', 'super_admin'), c.citizenVerify);

// Multi-level closure verification
router.post('/:id/dept-verify', auth, authorize('department_manager', 'nodal_officer', 'commissioner', 'super_admin'), c.deptVerify);
router.post('/:id/dm-verify', auth, authorize('district_officer', 'cm', 'cm_staff', 'super_admin'), c.dmVerify);
router.post('/:id/citizen-rate', auth, authorize('citizen', 'super_admin'), c.citizenRate);

// Escalation + CM actions
router.post('/:id/escalate', auth, authorize('officer', 'department_manager', 'district_officer', 'nodal_officer', 'commissioner', 'cm_staff', 'cm', 'super_admin'), c.escalateComplaint);
router.post('/:id/cm-flag', auth, authorize('cm', 'cm_staff', 'super_admin'), c.cmFlag);
router.post('/:id/cm-directive', auth, authorize('cm', 'super_admin'), c.cmDirective);
router.post('/:id/extend-sla', auth, authorize('cm', 'cm_staff', 'district_officer', 'super_admin'), c.extendSla);

module.exports = router;

