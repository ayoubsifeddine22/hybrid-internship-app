const { pool } = require('../config/database');
const { normalizeApplicationData } = require('../utils/normalizers');
const { calculateMatchScore } = require('../utils/scoring');
const { createNotification } = require('./notificationController');

exports.getOffers = async (req, res) => {
  try {
    const [offers] = await pool.query(`
      SELECT
        io.id,
        io.title,
        io.description,
        io.required_diploma,
        io.duration_weeks,
        io.salary_per_month,
        io.status,
        io.application_deadline,
        io.start_date,
        ep.company_name,
        ep.company_location,
        ep.company_description,
        ep.company_website
      FROM internship_offers io
      JOIN enterprise_profiles ep ON io.enterprise_id = ep.id
      WHERE io.status = 'open'
      ORDER BY io.created_at DESC
    `);

    // Get skills for each offer
    const offersWithSkills = await Promise.all(
      offers.map(async (offer) => {
        const [skills] = await pool.query(
          'SELECT skill_name, skill_weight FROM offer_skills_detailed WHERE offer_id = ?',
          [offer.id]
        );
        return {
          ...offer,
          skills: skills
        };
      })
    );

    res.json({
      count: offersWithSkills.length,
      offers: offersWithSkills
    });

  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ error: 'Failed to fetch offers', details: error.message });
  }
};

exports.getOfferDetails = async (req, res) => {
  try {
    const offerId = req.params.id;

    const [offers] = await pool.query(`
      SELECT
        io.id,
        io.title,
        io.description,
        io.required_diploma,
        io.duration_weeks,
        io.salary_per_month,
        io.status,
        io.application_deadline,
        io.start_date,
        ep.company_name,
        ep.company_location,
        ep.company_description,
        ep.company_website
      FROM internship_offers io
      JOIN enterprise_profiles ep ON io.enterprise_id = ep.id
      WHERE io.id = ?
    `, [offerId]);

    if (offers.length === 0) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const offer = offers[0];

    // Get skills for this offer
    const [skills] = await pool.query(
      'SELECT skill_name, skill_weight FROM offer_skills_detailed WHERE offer_id = ?',
      [offerId]
    );

    const offerWithSkills = {
      ...offer,
      skills_required: skills.map(s => s.skill_name).join(', '),
      skills: skills
    };

    res.json({
      offer: offerWithSkills
    });

  } catch (error) {
    console.error('Get offer details error:', error);
    res.status(500).json({ error: 'Failed to fetch offer details', details: error.message });
  }
};

exports.submitApplication = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { offer_id, diploma_level, selected_skills, distance_range } = req.body;
    const user_id = req.user.user_id; // From JWT middleware

    // ===== VALIDATION =====
    if (!offer_id || !diploma_level || !selected_skills || !distance_range) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ===== GET STUDENT PROFILE ID =====
    const [studentProfiles] = await connection.query(
      'SELECT id FROM student_profiles WHERE user_id = ?',
      [user_id]
    );

    if (studentProfiles.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const student_id = studentProfiles[0].id;

    // ===== GET OFFER DETAILS =====
    const [offers] = await connection.query(
      'SELECT * FROM internship_offers WHERE id = ? AND status = "open"',
      [offer_id]
    );

    if (offers.length === 0) {
      return res.status(404).json({ error: 'Offer not found or closed' });
    }

    const offer = offers[0];

    // ===== GET ENTERPRISE LOCATION =====
    const [enterpriseProfiles] = await connection.query(
      'SELECT company_location FROM enterprise_profiles WHERE id = ?',
      [offer.enterprise_id]
    );

    if (enterpriseProfiles.length === 0) {
      return res.status(500).json({ error: 'Enterprise not found' });
    }

    const enterpriseCity = enterpriseProfiles[0].company_location;

    // ===== GET OFFER SKILLS =====
    const [offerSkills] = await connection.query(
      'SELECT skill_name, skill_weight FROM offer_skills_detailed WHERE offer_id = ?',
      [offer_id]
    );

    const skillMap = {};
    offerSkills.forEach(skill => {
      skillMap[skill.skill_name] = skill.skill_weight;
    });

    // ===== NORMALIZE APPLICATION DATA =====
    const normalizedResult = normalizeApplicationData({
      skills: selected_skills,
      diplomaLevel: diploma_level,
      location: {
        type: 'range',
        value: distance_range,
        country: null // Form doesn't have country, CV will
      },
      type: 'form'
    });

    if (!normalizedResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: normalizedResult.errors
      });
    }

    const normalizedData = normalizedResult.data;

    // Debug: Log what we're matching
    console.log('=== SKILL MATCHING DEBUG ===');
    console.log('Selected skills (raw):', selected_skills);
    console.log('Normalized skills:', normalizedData.skills);
    console.log('Offer skillMap:', skillMap);
    console.log('===========================');

    // ===== CALCULATE SCORES =====
    const scores = calculateMatchScore(
      {
        selected_skills: normalizedData.skills,
        diploma_level: normalizedData.diplomaLevel,  // This is a number 1-4
        distance_range: normalizedData.distanceRange
      },
      {
        required_diploma: offer.required_diploma,  // This is a string like "bachelor"
        offer_skills: skillMap
      }
    );

    console.log('Calculated scores:', scores);

    // Debug: Check if scores have NaN
    if (isNaN(scores.skills_score) || isNaN(scores.diploma_score) || isNaN(scores.location_score) || isNaN(scores.total_score)) {
      console.error('Score calculation resulted in NaN:', scores);
      console.error('normalizedData:', normalizedData);
      console.error('offer.required_diploma:', offer.required_diploma);
      return res.status(500).json({
        error: 'Score calculation error',
        details: 'Invalid score values calculated'
      });
    }

    // ===== CHECK FOR DUPLICATE APPLICATION =====
    const [existingApp] = await connection.query(
      'SELECT id FROM applications WHERE student_id = ? AND offer_id = ?',
      [student_id, offer_id]
    );

    if (existingApp.length > 0) {
      return res.status(409).json({ error: 'Already applied to this offer' });
    }

    // ===== START TRANSACTION =====
    await connection.beginTransaction();

    try {
      // ===== CREATE APPLICATION =====
      const [appResult] = await connection.query(
        `INSERT INTO applications
         (student_id, offer_id, status, skills_score, diploma_score, location_score, total_score)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          student_id,
          offer_id,
          'pending',  // Always pending first, auto-accept only at 0.8+
          scores.skills_score,
          scores.diploma_score,
          scores.location_score,
          scores.total_score
        ]
      );

      const application_id = appResult.insertId;

      // ===== STORE SELECTED SKILLS AUDIT TRAIL =====
      for (const skill of normalizedData.skills) {
        const weight = skillMap[skill] || 0;
        await connection.query(
          `INSERT INTO application_selected_skills
           (application_id, skill_name, skill_weight_at_time, score_received)
           VALUES (?, ?, ?, ?)`,
          [application_id, skill, weight, weight]
        );
      }

      // ===== STORE DIPLOMA AUDIT TRAIL =====
      await connection.query(
        `INSERT INTO application_diploma
         (application_id, diploma_chosen, required_diploma, score_received)
         VALUES (?, ?, ?, ?)`,
        [
          application_id,
          normalizedData.diplomaLevel,
          offer.required_diploma,
          scores.diploma_score
        ]
      );

      // ===== STORE LOCATION AUDIT TRAIL =====
      await connection.query(
        `INSERT INTO application_location
         (application_id, enterprise_city, student_selected_range, score_received)
         VALUES (?, ?, ?, ?)`,
        [
          application_id,
          enterpriseCity,
          normalizedData.distanceRange,
          scores.location_score
        ]
      );

      // ===== IF SCORE >= 0.8: AUTO-CLOSE OFFER & REJECT OTHERS =====
      if (scores.total_score >= 0.8) {
        // Update THIS application to accepted
        await connection.query(
          `UPDATE applications
           SET status = 'accepted', accepted_at = NOW()
           WHERE id = ?`,
          [application_id]
        );

        // Update offer: mark as filled with this student
        const [offerData] = await connection.query(
          `SELECT enterprise_id FROM internship_offers WHERE id = ?`,
          [offer_id]
        );

        const enterprise_id_fk = offerData[0].enterprise_id;

        // Get enterprise user_id for notification
        const [enterpriseUser] = await connection.query(
          `SELECT user_id FROM enterprise_profiles WHERE id = ?`,
          [enterprise_id_fk]
        );

        await connection.query(
          `UPDATE internship_offers
           SET status = 'filled', selected_student_id = ?, selected_application_id = ?, filled_at = NOW()
           WHERE id = ?`,
          [student_id, application_id, offer_id]
        );

        // Get offer title for notification message
        const [offerDetails] = await connection.query(
          `SELECT title FROM internship_offers WHERE id = ?`,
          [offer_id]
        );
        const offerTitle = offerDetails[0].title;

        // Get student user_id for notification
        const [studentUser] = await connection.query(
          `SELECT user_id FROM student_profiles WHERE id = ?`,
          [student_id]
        );
        const student_user_id = studentUser[0].user_id;

        // Reject all other pending applications for this offer
        const [otherApps] = await connection.query(
          `SELECT student_id FROM applications
           WHERE offer_id = ? AND student_id != ? AND status = 'pending'`,
          [offer_id, student_id]
        );

        await connection.query(
          `UPDATE applications
           SET status = 'rejected'
           WHERE offer_id = ? AND student_id != ? AND status = 'pending'`,
          [offer_id, student_id]
        );

        // ===== CREATE NOTIFICATIONS =====
        // 1. Notify winning student
        await createNotification(
          connection,
          student_user_id,
          'offer_granted',
          `Congratulations! You have been selected for ${offerTitle}`,
          offer_id,
          null
        );

        // 2. Notify enterprise
        if (enterpriseUser && enterpriseUser[0]) {
          await createNotification(
            connection,
            enterpriseUser[0].user_id,
            'offer_granted',
            `Your offer "${offerTitle}" has been filled with a candidate`,
            offer_id,
            student_user_id
          );
        }

        // 3. Notify rejected students
        for (const app of otherApps) {
          const [rejectedStudent] = await connection.query(
            `SELECT user_id FROM student_profiles WHERE id = ?`,
            [app.student_id]
          );
          if (rejectedStudent && rejectedStudent[0]) {
            await createNotification(
              connection,
              rejectedStudent[0].user_id,
              'application_rejected',
              `The offer "${offerTitle}" has been filled by another candidate`,
              offer_id,
              null
            );
          }
        }
      }

      // ===== COMMIT TRANSACTION =====
      await connection.commit();

      // ===== SEND RESPONSE =====
      res.status(201).json({
        message: scores.total_score >= 0.8 ? 'Application submitted and auto-accepted!' : 'Application submitted successfully',
        application_id: application_id,
        status: scores.total_score >= 0.8 ? 'accepted' : 'pending',
        scores: {
          skills_score: scores.skills_score,
          diploma_score: scores.diploma_score,
          location_score: scores.location_score,
          total_score: scores.total_score
        }
      });

    } catch (txError) {
      await connection.rollback();
      throw txError;
    }

  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({ error: 'Failed to submit application', details: error.message });
  } finally {
    connection.release();
  }
};

exports.getApplications = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    // Get student profile ID
    const [studentProfiles] = await pool.query(
      'SELECT id FROM student_profiles WHERE user_id = ?',
      [user_id]
    );

    if (studentProfiles.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const student_id = studentProfiles[0].id;

    const [applications] = await pool.query(`
      SELECT
        a.id,
        a.offer_id,
        a.status,
        a.skills_score,
        a.diploma_score,
        a.location_score,
        a.total_score,
        a.created_at,
        a.accepted_at,
        io.title,
        io.application_deadline,
        ep.company_name,
        ep.company_location
      FROM applications a
      JOIN internship_offers io ON a.offer_id = io.id
      JOIN enterprise_profiles ep ON io.enterprise_id = ep.id
      WHERE a.student_id = ?
      ORDER BY a.created_at DESC
    `, [student_id]);

    res.json({
      count: applications.length,
      applications: applications
    });

  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications', details: error.message });
  }
};

exports.getApplicationDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    // Get student profile ID
    const [studentProfiles] = await pool.query(
      'SELECT id FROM student_profiles WHERE user_id = ?',
      [user_id]
    );

    if (studentProfiles.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const student_id = studentProfiles[0].id;

    const [applications] = await pool.query(`
      SELECT
        a.id,
        a.offer_id,
        a.status,
        a.skills_score,
        a.diploma_score,
        a.location_score,
        a.total_score,
        a.created_at,
        io.title,
        io.description,
        ep.company_name
      FROM applications a
      JOIN internship_offers io ON a.offer_id = io.id
      JOIN enterprise_profiles ep ON io.enterprise_id = ep.id
      WHERE a.id = ? AND a.student_id = ?
    `, [id, student_id]);

    if (applications.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = applications[0];

    // Get skill breakdown
    const [skills] = await pool.query(
      'SELECT skill_name, skill_weight_at_time FROM application_selected_skills WHERE application_id = ?',
      [id]
    );

    // Get diploma details
    const [diploma] = await pool.query(
      'SELECT diploma_chosen, required_diploma, score_received FROM application_diploma WHERE application_id = ?',
      [id]
    );

    // Get location details
    const [location] = await pool.query(
      'SELECT enterprise_city, student_selected_range, score_received FROM application_location WHERE application_id = ?',
      [id]
    );

    res.json({
      ...application,
      breakdown: {
        skills: skills,
        diploma: diploma[0] || null,
        location: location[0] || null
      }
    });

  } catch (error) {
    console.error('Get application details error:', error);
    res.status(500).json({ error: 'Failed to fetch application details', details: error.message });
  }
};

exports.deleteApplication = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    // Get student profile ID
    const [studentProfiles] = await connection.query(
      'SELECT id FROM student_profiles WHERE user_id = ?',
      [user_id]
    );

    if (studentProfiles.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const student_id = studentProfiles[0].id;

    // Check if application exists and belongs to this student
    const [applications] = await connection.query(
      'SELECT id FROM applications WHERE id = ? AND student_id = ?',
      [id, student_id]
    );

    if (applications.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Delete application (cascading deletes will handle audit trails)
    await connection.query('DELETE FROM applications WHERE id = ?', [id]);

    res.json({ message: 'Application deleted successfully' });

  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Failed to delete application', details: error.message });
  }
};

