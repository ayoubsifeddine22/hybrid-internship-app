import React, { useEffect, useMemo, useState } from 'react';
import { enterpriseAPI } from '../../services/api';
import './EnterpriseOffers.css';

const emptySkill = () => ({ name: '', weight: '1' });

const EnterpriseOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [selectedOfferId, setSelectedOfferId] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    requiredDiploma: 'bachelor',
    durationWeeks: '',
    salaryPerMonth: '',
    deadline: '',
    startDate: '',
    skills: [emptySkill()]
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await enterpriseAPI.getOffers();
      setOffers(response.data.offers || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      requiredDiploma: 'bachelor',
      durationWeeks: '',
      salaryPerMonth: '',
      deadline: '',
      startDate: '',
      skills: [emptySkill()]
    });
  };

  const updateSkill = (index, key, value) => {
    setForm((prev) => {
      const skills = [...prev.skills];
      skills[index] = { ...skills[index], [key]: value };
      return { ...prev, skills };
    });
  };

  const addSkill = () => setForm((prev) => ({ ...prev, skills: [...prev.skills, emptySkill()] }));
  const removeSkill = (index) => setForm((prev) => ({ ...prev, skills: prev.skills.filter((_, skillIndex) => skillIndex !== index) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const skills = form.skills
      .map((skill) => ({ name: skill.name.trim(), weight: Number(skill.weight) }))
      .filter((skill) => skill.name);

    const totalWeight = skills.reduce((sum, skill) => sum + (Number.isFinite(skill.weight) ? skill.weight : 0), 0);

    if (!skills.length) {
      setError('Add at least one required skill');
      return;
    }

    if (totalWeight !== 1) {
      setError(`Total skill weights must equal exactly 1.0 (currently ${totalWeight.toFixed(2)})`);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: form.title,
        description: form.description,
        diploma_required: form.requiredDiploma,
        deadline: form.deadline && !form.deadline.includes('Missing') ? form.deadline : undefined,
        start_date: form.startDate && !form.startDate.includes('Missing') ? form.startDate : undefined,
        duration_weeks: form.durationWeeks && !form.durationWeeks.includes('Missing') ? Number(form.durationWeeks) : undefined,
        salary_per_month: form.salaryPerMonth && !form.salaryPerMonth.includes('Missing') ? Number(form.salaryPerMonth) : undefined,
        skills,
        location: ''
      };

      if (editingOfferId) {
        await enterpriseAPI.updateOffer(editingOfferId, payload);
        setMessage('Offer updated successfully!');
      } else {
        await enterpriseAPI.createOffer(payload);
        setMessage('Offer created successfully!');
      }

      resetForm();
      setEditingOfferId(null);
      setShowForm(false);
      await fetchOffers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save offer');
    } finally {
      setSaving(false);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    // Just extract the date portion as-is
    const dateOnly = dateString.split('T')[0];
    return dateOnly || '';
  };

  const handleEdit = (offer) => {
    // Prevent modification of filled offers
    if (offer.status === 'filled') {
      setError('Cannot modify a filled offer');
      return;
    }

    // Process skills - handle database format (skill_name, skill_weight) and object formats
    let processedSkills = [];
    if (offer.skills && offer.skills.length > 0) {
      processedSkills = offer.skills.map(skill => {
        if (typeof skill === 'string') {
          return { name: skill, weight: '1' };
        }
        // Handle both database field names and normalized names
        const skillName = skill.name || skill.skill_name || '';
        const skillWeight = skill.weight || skill.skill_weight || '1';
        return {
          name: skillName,
          weight: String(skillWeight)
        };
      });
    } else {
      processedSkills = [emptySkill()];
    }

    const applicationDeadline = formatDateForInput(offer.application_deadline);
    const startDate = formatDateForInput(offer.start_date);

    setForm({
      title: offer.title || 'Missing, add title',
      description: offer.description || 'Missing, add description',
      requiredDiploma: offer.required_diploma || 'bachelor',
      durationWeeks: offer.duration_weeks ? String(offer.duration_weeks) : 'Missing, add duration',
      salaryPerMonth: offer.salary_per_month ? String(offer.salary_per_month) : 'Missing, add salary',
      deadline: applicationDeadline || 'Missing, add deadline',
      startDate: startDate || 'Missing, add start date',
      skills: processedSkills
    });
    setEditingOfferId(offer.id);
    setShowForm(true);
  };

  const handleDelete = async (offerId) => {
    const firstConfirm = window.confirm('Are you sure you want to delete this offer? This action cannot be undone.');
    if (!firstConfirm) return;

    const secondConfirm = window.confirm('Click OK to confirm deletion. This will permanently remove the offer.');
    if (!secondConfirm) return;

    try {
      await enterpriseAPI.deleteOffer(offerId);
      setMessage('Offer deleted successfully!');
      setSelectedOfferId(null);
      await fetchOffers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete offer');
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';
    // Just extract and display the date portion as-is
    const dateOnly = value.split('T')[0];
    return dateOnly || '-';
  };

  const headerSummary = useMemo(() => `${offers.length} offer${offers.length !== 1 ? 's' : ''}`, [offers.length]);

  if (loading) {
    return <div className="enterprise-tab-container"><p className="enterprise-loading">Loading offers...</p></div>;
  }

  return (
    <div className="enterprise-tab-container">
      {!selectedOfferId && (
        <div className="enterprise-tab-header enterprise-offers-header">
          <div>
            <h2>Offers</h2>
            <p>{headerSummary}</p>
          </div>
          <button className="enterprise-post-btn" onClick={() => { setShowForm((value) => !value); if (!showForm) { setEditingOfferId(null); resetForm(); } }}>
            {showForm ? 'Hide Form' : 'Post Offer'}
          </button>
        </div>
      )}

      {message && <div className="enterprise-success">{message}</div>}
      {error && <div className="enterprise-error">{error}</div>}

      {!selectedOfferId && showForm && (
        <div className="enterprise-form-card">
          <h3>Post a New Internship Offer</h3>
          <form onSubmit={handleSubmit} className="enterprise-offer-form">
            <div className="enterprise-form-grid">
              <div className="form-group"><label>Title</label><input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} required /></div>
              <div className="form-group"><label>Required Diploma</label><select value={form.requiredDiploma} onChange={(e) => setForm((prev) => ({ ...prev, requiredDiploma: e.target.value }))}><option value="high_school">High School</option><option value="2nd_year">2nd Year</option><option value="bachelor">Bachelor</option><option value="master">Master</option></select></div>
              <div className="form-group"><label>Duration (weeks)</label><input type="number" min="1" value={form.durationWeeks} onChange={(e) => setForm((prev) => ({ ...prev, durationWeeks: e.target.value }))} /></div>
              <div className="form-group"><label>Salary / Month</label><input type="number" min="0" step="0.01" value={form.salaryPerMonth} onChange={(e) => setForm((prev) => ({ ...prev, salaryPerMonth: e.target.value }))} /></div>
              <div className="form-group"><label>Application Deadline</label><input type="date" value={form.deadline} onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))} required /></div>
              <div className="form-group"><label>Start Date</label><input type="date" value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} /></div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows="4" required />
            </div>

            <div className="enterprise-skills-section">
              <div className="enterprise-skills-header">
                <label>Required Skills</label>
                <button type="button" className="enterprise-skill-add" onClick={addSkill}>Add Skill</button>
              </div>

              <div className="skills-info">
                <p><strong>How Skills Work:</strong> Each skill has a weight (0-1). The total of all skill weights must equal exactly 1.0. For example: 3 skills with weights 0.4 + 0.3 + 0.3 = 1.0. If the total doesn't equal 1.0, the form will show an error and prevent submission.</p>
              </div>

              {form.skills.map((skill, index) => (
                <div className="enterprise-skill-row" key={index}>
                  <input placeholder="Skill name" value={skill.name} onChange={(e) => updateSkill(index, 'name', e.target.value)} required />
                  <input type="number" min="0" max="1" step="0.05" placeholder="Weight" value={skill.weight} onChange={(e) => updateSkill(index, 'weight', e.target.value)} required />
                  <button type="button" className="enterprise-skill-remove" onClick={() => removeSkill(index)} disabled={form.skills.length === 1}>Remove</button>
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save" disabled={saving}>{saving ? (editingOfferId ? 'Updating...' : 'Posting...') : (editingOfferId ? 'Update Offer' : 'Post Offer')}</button>
              <button type="button" className="btn-cancel" onClick={() => { resetForm(); setShowForm(false); setEditingOfferId(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {selectedOfferId ? (
        // Detail view for selected offer
        offers.find(o => o.id === selectedOfferId) && (() => {
          const offer = offers.find(o => o.id === selectedOfferId);
          return (
            <div className="enterprise-offer-detail">
              <button className="btn-back" onClick={() => setSelectedOfferId(null)}>← Back to List</button>

              <div className="detail-header">
                <div>
                  <h2>{offer.title}</h2>
                  <span className={`enterprise-badge-status status-${offer.status}`}>{offer.status}</span>
                </div>
                <div className="detail-actions">
                  <button
                    className="btn-detail-edit"
                    onClick={() => { handleEdit(offer); setSelectedOfferId(null); }}
                    disabled={offer.status === 'filled'}
                    title={offer.status === 'filled' ? 'Cannot modify a filled offer' : 'Modify this offer'}
                  >
                    Modify
                  </button>
                  <button className="btn-detail-delete" onClick={() => handleDelete(offer.id)}>Delete</button>
                </div>
              </div>

              <div className="detail-content">
                <div className="detail-section">
                  <h3>Description</h3>
                  <p>{offer.description}</p>
                </div>

                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Diploma Required:</span>
                    <span className="detail-value">{offer.required_diploma || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Application Deadline:</span>
                    <span className="detail-value">{formatDate(offer.application_deadline)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Start Date:</span>
                    <span className="detail-value">{offer.start_date ? formatDate(offer.start_date) : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{offer.duration_weeks ? `${offer.duration_weeks} weeks` : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Salary:</span>
                    <span className="detail-value">{offer.salary_per_month ? `$${offer.salary_per_month} / month` : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{formatDate(offer.created_at)}</span>
                  </div>
                </div>

                {offer.skills && offer.skills.length > 0 && (
                  <div className="detail-section">
                    <h3>Required Skills</h3>
                    <div className="skills-list-detail">
                      {offer.skills.map((skill, idx) => {
                        let skillName = '';
                        let skillWeight = '';

                        if (typeof skill === 'string') {
                          skillName = skill;
                        } else {
                          skillName = skill.name || skill.skill_name || '';
                          skillWeight = skill.weight || skill.skill_weight || '';
                        }

                        return (
                          <div key={idx} className="skill-badge">
                            {skillName}{skillWeight ? ` (${skillWeight})` : ''}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()
      ) : offers.length === 0 ? (
        <div className="enterprise-empty">No offers found yet.</div>
      ) : (
        <div className="enterprise-card-list">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="enterprise-card enterprise-card-clickable"
              onClick={() => setSelectedOfferId(offer.id)}
            >
              <div className="enterprise-card-top">
                <h3>{offer.title}</h3>
                <span className={`enterprise-badge-status status-${offer.status}`}>{offer.status}</span>
              </div>
              <p className="enterprise-desc">{offer.description}</p>
              <div className="enterprise-grid">
                <div><strong>Deadline:</strong> {formatDate(offer.application_deadline)}</div>
                <div><strong>Duration:</strong> {offer.duration_weeks ? `${offer.duration_weeks} weeks` : '-'}</div>
                <div><strong>Salary:</strong> {offer.salary_per_month ? `$${offer.salary_per_month} / month` : '-'}</div>
                <div><strong>Created:</strong> {formatDate(offer.created_at)}</div>
              </div>
              <div className="click-hint">Click to view details</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnterpriseOffers;

