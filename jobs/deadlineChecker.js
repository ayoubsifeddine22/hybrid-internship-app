

const cron = require('node-cron');
const { pool } = require('../config/database');
const { createNotification } = require('../controllers/notificationController');

const processExpiredOffers = async () => {
  let connection;

  try {
    connection = await pool.getConnection();

    // Find all offers with expired deadline that are still open
    const [expiredOffers] = await connection.query(
      `SELECT id, title, enterprise_id
       FROM internship_offers
       WHERE application_deadline < NOW()
       AND status = 'open'`
    );

    if (expiredOffers.length === 0) {
      console.log('[Deadline Job] No expired offers found');
      return;
    }

    console.log(`[Deadline Job] Processing ${expiredOffers.length} expired offer(s)`);

    // Process each expired offer
    for (const offer of expiredOffers) {
      await processOfferDeadline(connection, offer);
    }

    console.log(`[Deadline Job] Completed processing expired offers`);

  } catch (error) {
    console.error('[Deadline Job] Error processing expired offers:', error);
  } finally {
    if (connection) connection.release();
  }
};

const processOfferDeadline = async (connection, offer) => {
  try {
    const { id: offerId, title: offerTitle, enterprise_id } = offer;

    // Get highest-scoring pending application for this offer
    const [applications] = await connection.query(
      `SELECT a.id, a.student_id, a.total_score
       FROM applications a
       WHERE a.offer_id = ?
       AND a.status = 'pending'
       ORDER BY a.total_score DESC
       LIMIT 1`,
      [offerId]
    );

    if (applications.length === 0) {
      console.log(`[Deadline Job] Offer ${offerId}: No pending applications found`);
      return;
    }

    const selectedApp = applications[0];
    const selectedApplicationId = selectedApp.id;
    const selectedStudentId = selectedApp.student_id;

    console.log(`[Deadline Job] Offer ${offerId}: Auto-accepting application ${selectedApplicationId} (score: ${selectedApp.total_score})`);

    // Start transaction for consistency
    await connection.beginTransaction();

    try {
      // 1. Update selected application to 'accepted'
      await connection.query(
        `UPDATE applications
         SET status = 'accepted', accepted_at = NOW()
         WHERE id = ?`,
        [selectedApplicationId]
      );

      // 2. Update offer to 'filled' and store winner info
      await connection.query(
        `UPDATE internship_offers
         SET status = 'filled', selected_student_id = ?, selected_application_id = ?, filled_at = NOW()
         WHERE id = ?`,
        [selectedStudentId, selectedApplicationId, offerId]
      );

      // 3. Reject all other pending/accepted applications for this offer
      await connection.query(
        `UPDATE applications
         SET status = 'rejected', rejected_at = NOW()
         WHERE offer_id = ?
         AND id != ?
         AND status IN ('pending', 'accepted')`,
        [offerId, selectedApplicationId]
      );

      // 4. Get all rejected applications to notify
      const [rejectedApps] = await connection.query(
        `SELECT DISTINCT student_id
         FROM applications
         WHERE offer_id = ?
         AND status = 'rejected'
         AND id != ?`,
        [offerId, selectedApplicationId]
      );

      // 5. Get winner and enterprise profiles BEFORE committing
      const [winnerProfile] = await connection.query(
        'SELECT user_id FROM student_profiles WHERE id = ?',
        [selectedStudentId]
      );

      const [enterpriseProfile] = await connection.query(
        'SELECT user_id FROM enterprise_profiles WHERE id = ?',
        [enterprise_id]
      );

      // 6. Get rejected student profiles BEFORE committing
      const rejectedProfiles = [];
      for (const rejectedApp of rejectedApps) {
        const [profile] = await connection.query(
          'SELECT user_id FROM student_profiles WHERE id = ?',
          [rejectedApp.student_id]
        );
        if (profile && profile[0]) {
          rejectedProfiles.push(profile[0].user_id);
        }
      }

      await connection.commit();

      // 7. Send notifications (after commit to ensure data is persisted)
      // If notifications fail, data changes are still committed (acceptable trade-off)

      // Notify winning student
      if (winnerProfile && winnerProfile[0]) {
        await createNotification(
          connection,
          winnerProfile[0].user_id,
          'offer_granted',
          `Congratulations! You have been selected for "${offerTitle}"`,
          offerId,
          null
        );
      }

      // Notify enterprise
      if (enterpriseProfile && enterpriseProfile[0]) {
        await createNotification(
          connection,
          enterpriseProfile[0].user_id,
          'offer_granted',
          `Deadline passed. Selected student with score ${selectedApp.total_score.toFixed(2)} for "${offerTitle}"`,
          offerId,
          null
        );
      }

      // Notify rejected students
      for (const userId of rejectedProfiles) {
        await createNotification(
          connection,
          userId,
          'application_rejected',
          `Your application for "${offerTitle}" was not selected after deadline processing`,
          offerId,
          null
        );
      }

      console.log(`[Deadline Job] Offer ${offerId}: Successfully processed (winner notified, ${rejectedApps.length} rejected)`);

    } catch (txError) {
      await connection.rollback();
      console.error(`[Deadline Job] Offer ${offerId}: Transaction error:`, txError);
    }

  } catch (error) {
    console.error(`[Deadline Job] Error processing offer:`, error);
  }
};

const startDeadlineChecker = () => {
  console.log('[Deadline Job] Starting deadline checker job (every 6 hours)');

  cron.schedule('0 */6 * * *', () => {
    console.log('[Deadline Job] Checking for expired offers...');
    processExpiredOffers();
  });
};

module.exports = { startDeadlineChecker };

