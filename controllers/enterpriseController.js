const { pool } = require('../config/database');
const { createNotification } = require('./notificationController');

exports.createOffer = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      title,
      description,
      location,
      deadline,
      diploma_required,
      skills,
      duration_weeks,
      salary_per_month,
      start_date
    } = req.body;

    const user_id = req.user.user_id;

    // ===== LOOKUP ENTERPRISE PROFILE ID =====
    const [enterpriseProfiles] = await pool.query(
      'SELECT id FROM enterprise_profiles WHERE user_id = ?',
      [user_id]
    );

    if (enterpriseProfiles.length === 0) {
      return res.status(404).json({ error: 'Enterprise profile not found' });
    }

    const enterprise_id = enterpriseProfiles[0].id;

    // ===== VALIDATION =====
    if (!title || !description || !diploma_required || !deadline || !skills) {
      return res.status(400).json({ error: 'Missing required fields: title, description, diploma_required, deadline, skills' });
    }

    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: 'Skills array required with at least one skill' });
    }

    // Validate diploma level
    const validDiplomas = ['high_school', '2nd_year', 'bachelor', 'master'];
    if (!validDiplomas.includes(diploma_required)) {
      return res.status(400).json({ error: 'Invalid diploma level', valid: validDiplomas });
    }

    // Calculate total weight and validate
    const totalWeight = skills.reduce((sum, skill) => sum + (skill.weight || 0), 0);
    if (Math.abs(totalWeight - 1.0) > 0.001) { // Allow 0.001 floating point tolerance
      return res.status(400).json({
        error: `Total skill weights must equal exactly 1.0 (currently ${totalWeight.toFixed(2)})`,
        total_weight: totalWeight
      });
    }

    // ===== START TRANSACTION =====
    await connection.beginTransaction();

    try {
      // ===== CREATE OFFER =====
      const [offerResult] = await connection.query(
        `INSERT INTO internship_offers
         (enterprise_id, title, description, required_diploma,
          duration_weeks, salary_per_month, application_deadline, start_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
        [
          enterprise_id,
          title,
          description,
          diploma_required,
          duration_weeks || null,
          salary_per_month || null,
          deadline,
          start_date || null
        ]
      );

      const offer_id = offerResult.insertId;

      // ===== ADD SKILLS TO OFFER =====
      for (const skill of skills) {
        if (!skill.name || skill.weight === undefined) {
          throw new Error('Each skill must have name and weight');
        }

        await connection.query(
          `INSERT INTO offer_skills_detailed
           (offer_id, skill_name, skill_weight)
           VALUES (?, ?, ?)`,
          [offer_id, skill.name, skill.weight]
        );
      }

      // ===== COMMIT TRANSACTION =====
      await connection.commit();

      res.status(201).json({
        message: 'Offer created successfully',
        offer_id: offer_id,
        title: title,
        skills_count: skills.length,
        total_weight: totalWeight
      });

    } catch (txError) {
      await connection.rollback();
      throw txError;
    }

  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ error: 'Failed to create offer', details: error.message });
  } finally {
    connection.release();
  }
};

exports.getOffers = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    // Get enterprise profile ID
    const [enterpriseProfiles] = await pool.query(
      'SELECT id FROM enterprise_profiles WHERE user_id = ?',
      [user_id]
    );

    if (enterpriseProfiles.length === 0) {
      return res.status(404).json({ error: 'Enterprise profile not found' });
    }

    const enterprise_id = enterpriseProfiles[0].id;

    const [offers] = await pool.query(`
      SELECT
        io.id,
        io.title,
        io.description,
        io.required_diploma,
        io.duration_weeks,
        io.salary_per_month,
        io.status,
        DATE_FORMAT(io.application_deadline, '%Y-%m-%d') as application_deadline,
        DATE_FORMAT(io.start_date, '%Y-%m-%d') as start_date,
        io.selected_student_id,
        io.filled_at,
        io.created_at
      FROM internship_offers io
      WHERE io.enterprise_id = ?
      ORDER BY io.created_at DESC
    `, [enterprise_id]);

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
    const { id } = req.params;
    const enterprise_id = req.user.user_id;

    const [offers] = await pool.query(
      `SELECT
        id,
        title,
        description,
        required_diploma,
        duration_weeks,
        salary_per_month,
        status,
        DATE_FORMAT(application_deadline, '%Y-%m-%d') as application_deadline,
        DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
        selected_student_id,
        filled_at,
        created_at,
        enterprise_id
       FROM internship_offers
       WHERE id = ? AND enterprise_id = ?`,
      [id, enterprise_id]
    );

    if (offers.length === 0) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const offer = offers[0];

    // Get skills
    const [skills] = await pool.query(
      'SELECT skill_name, skill_weight FROM offer_skills_detailed WHERE offer_id = ?',
      [id]
    );

    res.json({
      ...offer,
      skills: skills
    });

  } catch (error) {
    console.error('Get offer details error:', error);
    res.status(500).json({ error: 'Failed to fetch offer', details: error.message });
  }
};

exports.getOfferApplications = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    // Get enterprise profile ID
    const [enterpriseProfiles] = await pool.query(
      'SELECT id FROM enterprise_profiles WHERE user_id = ?',
      [user_id]
    );

    if (enterpriseProfiles.length === 0) {
      return res.status(404).json({ error: 'Enterprise profile not found' });
    }

    const enterprise_id = enterpriseProfiles[0].id;

    // Verify offer belongs to this enterprise
    const [offers] = await pool.query(
      'SELECT id FROM internship_offers WHERE id = ? AND enterprise_id = ?',
      [id, enterprise_id]
    );

    if (offers.length === 0) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Get applications
    const [applications] = await pool.query(`
      SELECT
        a.id,
        a.student_id,
        a.status,
        a.skills_score,
        a.diploma_score,
        a.location_score,
        a.total_score,
        a.created_at,
        sp.user_id,
        u.full_name,
        u.email
      FROM applications a
      JOIN student_profiles sp ON a.student_id = sp.id
      JOIN users u ON sp.user_id = u.id
      WHERE a.offer_id = ?
      ORDER BY a.total_score DESC, a.created_at ASC
    `, [id]);

    res.json({
      offer_id: id,
      count: applications.length,
      applications: applications
    });

  } catch (error) {
    console.error('Get offer applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications', details: error.message });
  }
};

exports.getApplicationDetails = async (req, res) => {
  try {
    const { offerId, appId } = req.params;
    const user_id = req.user.user_id;

    // Get enterprise profile ID
    const [enterpriseProfiles] = await pool.query(
      'SELECT id FROM enterprise_profiles WHERE user_id = ?',
      [user_id]
    );

    if (enterpriseProfiles.length === 0) {
      return res.status(404).json({ error: 'Enterprise profile not found' });
    }

    const enterprise_id = enterpriseProfiles[0].id;

    // Verify offer belongs to this enterprise
    const [offers] = await pool.query(
      'SELECT id FROM internship_offers WHERE id = ? AND enterprise_id = ?',
      [offerId, enterprise_id]
    );

    if (offers.length === 0) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Get application
    const [applications] = await pool.query(`
      SELECT
        a.id,
        a.student_id,
        a.offer_id,
        a.status,
        a.skills_score,
        a.diploma_score,
        a.location_score,
        a.total_score,
        a.created_at,
        u.full_name,
        u.email
      FROM applications a
      JOIN student_profiles sp ON a.student_id = sp.id
      JOIN users u ON sp.user_id = u.id
      WHERE a.id = ? AND a.offer_id = ?
    `, [appId, offerId]);

    if (applications.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = applications[0];

    // Get skill breakdown
    const [skills] = await pool.query(
      'SELECT skill_name, skill_weight_at_time FROM application_selected_skills WHERE application_id = ?',
      [appId]
    );

    // Get diploma details
    const [diploma] = await pool.query(
      'SELECT diploma_chosen, required_diploma, score_received FROM application_diploma WHERE application_id = ?',
      [appId]
    );

    // Get location details
    const [location] = await pool.query(
      'SELECT enterprise_city, student_selected_range, score_received FROM application_location WHERE application_id = ?',
      [appId]
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

exports.updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      diploma_required,
      deadline,
      start_date,
      duration_weeks,
      salary_per_month,
      skills,
      status
    } = req.body;
    const user_id = req.user.user_id;

    // Get enterprise profile ID
    const [enterpriseProfiles] = await pool.query(
      'SELECT id FROM enterprise_profiles WHERE user_id = ?',
      [user_id]
    );

    if (enterpriseProfiles.length === 0) {
      return res.status(404).json({ error: 'Enterprise profile not found' });
    }

    const enterprise_id = enterpriseProfiles[0].id;

    // Validate status if provided
    if (status) {
      const validStatuses = ['open', 'closed', 'filled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
    }

    // Update offer
    const [result] = await pool.query(
      `UPDATE internship_offers
       SET
         title = COALESCE(?, title),
         description = COALESCE(?, description),
         required_diploma = COALESCE(?, required_diploma),
         application_deadline = COALESCE(?, application_deadline),
         start_date = COALESCE(?, start_date),
         duration_weeks = COALESCE(?, duration_weeks),
         salary_per_month = COALESCE(?, salary_per_month),
         status = COALESCE(?, status)
       WHERE id = ? AND enterprise_id = ?`,
      [title, description, diploma_required, deadline, start_date, duration_weeks, salary_per_month, status, id, enterprise_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Update skills if provided
    if (skills && Array.isArray(skills)) {
      // Validate skill weights sum to exactly 1.0
      const totalWeight = skills.reduce((sum, skill) => sum + (parseFloat(skill.weight) || 0), 0);
      if (Math.abs(totalWeight - 1.0) > 0.001) { // Allow 0.001 floating point tolerance
        return res.status(400).json({
          error: `Total skill weights must equal exactly 1.0 (currently ${totalWeight.toFixed(2)})`,
          total_weight: totalWeight
        });
      }

      // Delete existing skills
      await pool.query('DELETE FROM offer_skills_detailed WHERE offer_id = ?', [id]);

      // Insert new skills
      for (const skill of skills) {
        if (skill.name && skill.name.trim()) {
          await pool.query(
            `INSERT INTO offer_skills_detailed (offer_id, skill_name, skill_weight)
             VALUES (?, ?, ?)`,
            [id, skill.name.trim(), skill.weight || 1]
          );
        }
      }
    }

    // Get updated offer
    const [updatedOffers] = await pool.query(
      `SELECT
        id,
        title,
        description,
        required_diploma,
        duration_weeks,
        salary_per_month,
        status,
        DATE_FORMAT(application_deadline, '%Y-%m-%d') as application_deadline,
        DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
        selected_student_id,
        filled_at,
        created_at,
        enterprise_id
       FROM internship_offers
       WHERE id = ? AND enterprise_id = ?`,
      [id, enterprise_id]
    );

    if (updatedOffers.length === 0) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const offer = updatedOffers[0];

    // Get skills
    const [updatedSkills] = await pool.query(
      'SELECT skill_name, skill_weight FROM offer_skills_detailed WHERE offer_id = ?',
      [id]
    );

    res.json({
      ...offer,
      skills: updatedSkills
    });

  } catch (error) {
    console.error('Update offer error:', error);
    res.status(500).json({ error: 'Failed to update offer', details: error.message });
  }
};

exports.deleteOffer = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    // Get enterprise profile ID
    const [enterpriseProfiles] = await connection.query(
      'SELECT id FROM enterprise_profiles WHERE user_id = ?',
      [user_id]
    );

    if (enterpriseProfiles.length === 0) {
      return res.status(404).json({ error: 'Enterprise profile not found' });
    }

    const enterprise_id = enterpriseProfiles[0].id;

    await connection.beginTransaction();

    try {
      // Get offer details before deleting (for notification message)
      const [offerDetails] = await connection.query(
        'SELECT title FROM internship_offers WHERE id = ? AND enterprise_id = ?',
        [id, enterprise_id]
      );

      if (offerDetails.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Offer not found' });
      }

      const offerTitle = offerDetails[0].title;

      // Get offer status to check if it has a winner
      const [offerStatus] = await connection.query(
        'SELECT status FROM internship_offers WHERE id = ? AND enterprise_id = ?',
        [id, enterprise_id]
      );

      if (offerStatus.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Offer not found' });
      }

      // Only notify applicants if offer hasn't been filled (no winner yet)
      let applicants = [];
      if (offerStatus[0].status !== 'filled') {
        const [applicantsList] = await connection.query(
          `SELECT DISTINCT a.student_id FROM applications a
           WHERE a.offer_id = ? AND a.status IN ('pending', 'accepted')`,
          [id]
        );
        applicants = applicantsList;
      }
      console.error(`[DELETE OFFER] Found ${applicants.length} applicants to notify for offer ${id}`);

      // Delete related skills
      await connection.query(
        'DELETE FROM offer_skills_detailed WHERE offer_id = ?',
        [id]
      );

      // Delete offer
      const [result] = await connection.query(
        `DELETE FROM internship_offers
         WHERE id = ? AND enterprise_id = ?`,
        [id, enterprise_id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Offer not found' });
      }

      console.error(`[DELETE OFFER] Offer ${id} deleted, now notifying ${applicants.length} applicants`);

      // Notify all applicants
      for (const app of applicants) {
        const [studentUser] = await connection.query(
          'SELECT user_id FROM student_profiles WHERE id = ?',
          [app.student_id]
        );
        if (studentUser && studentUser[0]) {
          console.error(`[DELETE OFFER] Creating notification for user ${studentUser[0].user_id} (student ${app.student_id})`);
          await createNotification(
            connection,
            studentUser[0].user_id,
            'offer_deadline',
            `The offer "${offerTitle}" has been cancelled by the enterprise`,
            id,
            null
          );
        } else {
          console.error(`[DELETE OFFER] Failed to find student user for student_id ${app.student_id}`);
        }
      }

      await connection.commit();

      res.json({ message: 'Offer deleted successfully' });

    } catch (txError) {
      await connection.rollback();
      throw txError;
    }

  } catch (error) {
    console.error('Delete offer error:', error);
    res.status(500).json({ error: 'Failed to delete offer', details: error.message });
  } finally {
    connection.release();
  }
};

