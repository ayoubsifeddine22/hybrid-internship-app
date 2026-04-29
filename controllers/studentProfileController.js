

const { pool } = require('../config/database');

exports.getProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    // Get user info including full_name
    const [users] = await pool.query(
      'SELECT full_name, email FROM users WHERE id = ?',
      [user_id]
    );

    // Get student profile
    const [profile] = await pool.query(
      `SELECT sp.id, sp.diploma_level, sp.field_of_study, sp.university_name, sp.graduation_year, sp.city, sp.country, sp.cv_url
       FROM student_profiles sp
       WHERE sp.user_id = ?`,
      [user_id]
    );

    if (profile.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const studentProfile = profile[0];

    // Get student skills
    const [skills] = await pool.query(
      'SELECT skill_name FROM student_skills WHERE student_id = ? ORDER BY skill_name',
      [studentProfile.id]
    );

    res.json({
      profile: studentProfile,
      skills: skills.map(s => s.skill_name),
      user: users.length > 0 ? {
        full_name: users[0].full_name,
        email: users[0].email
      } : null
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
  }
};

exports.updateEducation = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { diploma_level, field_of_study, university_name, graduation_year } = req.body;

    // Validate diploma level
    const validDiplomas = ['high_school', '2nd_year', 'bachelor', 'master'];
    if (diploma_level && !validDiplomas.includes(diploma_level)) {
      return res.status(400).json({
        error: 'Invalid diploma level',
        valid: validDiplomas
      });
    }

    // Get student profile ID
    const [profiles] = await pool.query(
      'SELECT id FROM student_profiles WHERE user_id = ?',
      [user_id]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const student_id = profiles[0].id;

    // Update education details
    const updateFields = [];
    const updateValues = [];

    if (diploma_level) {
      updateFields.push('diploma_level = ?');
      updateValues.push(diploma_level);
    }
    if (field_of_study !== undefined) {
      updateFields.push('field_of_study = ?');
      updateValues.push(field_of_study);
    }
    if (university_name !== undefined) {
      updateFields.push('university_name = ?');
      updateValues.push(university_name);
    }
    if (graduation_year !== undefined) {
      updateFields.push('graduation_year = ?');
      updateValues.push(graduation_year);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(student_id);

    const [result] = await pool.query(
      `UPDATE student_profiles SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Profile update failed' });
    }

    res.json({ message: 'Education details updated successfully' });

  } catch (error) {
    console.error('Update education error:', error);
    res.status(500).json({ error: 'Failed to update education', details: error.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { city, country } = req.body;

    if (!city || !country) {
      return res.status(400).json({ error: 'City and country are required' });
    }

    // Get student profile ID
    const [profiles] = await pool.query(
      'SELECT id FROM student_profiles WHERE user_id = ?',
      [user_id]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const student_id = profiles[0].id;

    // Update location
    const [result] = await pool.query(
      'UPDATE student_profiles SET city = ?, country = ? WHERE id = ?',
      [city, country, student_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Profile update failed' });
    }

    res.json({ message: 'Location updated successfully' });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location', details: error.message });
  }
};

exports.updateSkills = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const user_id = req.user.user_id;
    const { skills } = req.body;

    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: 'Skills must be a non-empty array' });
    }

    // Validate skills (basic: no empty strings, lowercase)
    const normalizedSkills = skills
      .map(s => String(s).trim().toLowerCase())
      .filter(s => s.length > 0);

    if (normalizedSkills.length === 0) {
      return res.status(400).json({ error: 'No valid skills provided' });
    }

    // Get student profile ID
    const [profiles] = await connection.query(
      'SELECT id FROM student_profiles WHERE user_id = ?',
      [user_id]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const student_id = profiles[0].id;

    await connection.beginTransaction();

    try {
      // Delete existing skills
      await connection.query(
        'DELETE FROM student_skills WHERE student_id = ?',
        [student_id]
      );

      // Insert new skills
      for (const skill of normalizedSkills) {
        await connection.query(
          'INSERT INTO student_skills (student_id, skill_name) VALUES (?, ?)',
          [student_id, skill]
        );
      }

      await connection.commit();

      res.json({
        message: 'Skills updated successfully',
        skills: normalizedSkills
      });

    } catch (txError) {
      await connection.rollback();
      throw txError;
    }

  } catch (error) {
    console.error('Update skills error:', error);
    res.status(500).json({ error: 'Failed to update skills', details: error.message });
  } finally {
    connection.release();
  }
};

