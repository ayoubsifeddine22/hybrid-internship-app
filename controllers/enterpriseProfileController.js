

const { pool } = require('../config/database');

exports.getProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    // Get enterprise profile
    const [profile] = await pool.query(
      `SELECT ep.id, ep.user_id, ep.company_name, ep.company_location, ep.company_description, ep.company_website,
              ep.contact_person_name, ep.contact_person_email, ep.contact_person_phone,
              ep.created_at, ep.updated_at,
              u.email AS account_email,
              u.phone AS account_phone,
              u.full_name AS account_name
       FROM enterprise_profiles ep
       JOIN users u ON ep.user_id = u.id
       WHERE ep.user_id = ?`,
      [user_id]
    );

    if (profile.length === 0) {
      return res.status(404).json({ error: 'Enterprise profile not found' });
    }

    const profileData = profile[0];

    res.json({
      profile: profileData,
      user: {
        id: profileData.user_id,
        full_name: profileData.account_name,
        email: profileData.account_email,
        phone: profileData.account_phone
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
  }
};

exports.updateCompanyInfo = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { company_name, company_location, company_description, company_website } = req.body;

    // Get enterprise profile ID
    const [profiles] = await pool.query(
      'SELECT id FROM enterprise_profiles WHERE user_id = ?',
      [user_id]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ error: 'Enterprise profile not found' });
    }

    const enterprise_id = profiles[0].id;

    const [currentProfileRows] = await pool.query(
      'SELECT company_name FROM enterprise_profiles WHERE id = ?',
      [enterprise_id]
    );

    // Update company info
    const updateFields = [];
    const updateValues = [];

    if (company_name !== undefined) {
      updateFields.push('company_name = ?');
      updateValues.push(company_name);
    }
    if (company_location !== undefined) {
      updateFields.push('company_location = ?');
      updateValues.push(company_location);
    }
    if (company_description !== undefined) {
      updateFields.push('company_description = ?');
      updateValues.push(company_description);
    }
    if (company_website !== undefined) {
      updateFields.push('company_website = ?');
      updateValues.push(company_website);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(enterprise_id);

    const [result] = await pool.query(
      `UPDATE enterprise_profiles SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (company_name !== undefined || company_name !== null) {
      const companyNameToStore = company_name || currentProfileRows[0]?.company_name || null;
      if (companyNameToStore) {
        await pool.query(
          'UPDATE users SET full_name = ? WHERE id = ?',
          [companyNameToStore, user_id]
        );
      }
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Profile update failed' });
    }

    const [updatedProfile] = await pool.query(
      `SELECT ep.id, ep.user_id, ep.company_name, ep.company_location, ep.company_description, ep.company_website,
              ep.contact_person_name, ep.contact_person_email, ep.contact_person_phone,
              u.email AS account_email,
              u.phone AS account_phone,
              u.full_name AS account_name
       FROM enterprise_profiles ep
       JOIN users u ON ep.user_id = u.id
       WHERE ep.id = ?`,
      [enterprise_id]
    );

    res.json({
      message: 'Company information updated successfully',
      profile: updatedProfile[0]
    });

  } catch (error) {
    console.error('Update company info error:', error);
    res.status(500).json({ error: 'Failed to update company info', details: error.message });
  }
};

exports.updateContactInfo = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { contact_person_name, contact_person_email, contact_person_phone } = req.body;

    // Get enterprise profile ID
    const [profiles] = await pool.query(
      'SELECT id FROM enterprise_profiles WHERE user_id = ?',
      [user_id]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ error: 'Enterprise profile not found' });
    }

    const enterprise_id = profiles[0].id;

    // Update contact info
    const updateFields = [];
    const updateValues = [];

    if (contact_person_name !== undefined) {
      updateFields.push('contact_person_name = ?');
      updateValues.push(contact_person_name);
    }
    if (contact_person_email !== undefined) {
      updateFields.push('contact_person_email = ?');
      updateValues.push(contact_person_email);
    }
    if (contact_person_phone !== undefined) {
      updateFields.push('contact_person_phone = ?');
      updateValues.push(contact_person_phone);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(enterprise_id);

    const [result] = await pool.query(
      `UPDATE enterprise_profiles SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Profile update failed' });
    }

    const [updatedProfile] = await pool.query(
      `SELECT ep.id, ep.user_id, ep.company_name, ep.company_location, ep.company_description, ep.company_website,
              ep.contact_person_name, ep.contact_person_email, ep.contact_person_phone,
              u.email AS account_email,
              u.phone AS account_phone,
              u.full_name AS account_name
       FROM enterprise_profiles ep
       JOIN users u ON ep.user_id = u.id
       WHERE ep.id = ?`,
      [enterprise_id]
    );

    res.json({
      message: 'Contact information updated successfully',
      profile: updatedProfile[0]
    });

  } catch (error) {
    console.error('Update contact info error:', error);
    res.status(500).json({ error: 'Failed to update contact info', details: error.message });
  }
};

