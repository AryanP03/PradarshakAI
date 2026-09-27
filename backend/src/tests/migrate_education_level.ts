import { pool } from '../db/pool';

async function runMigration() {
  console.log('=== RUNNING EDUCATION_LEVEL SCHEMA MIGRATION ===');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Add columns to schemes table
    await client.query(`
      ALTER TABLE schemes 
      ADD COLUMN IF NOT EXISTS education_level text DEFAULT 'not_applicable',
      ADD COLUMN IF NOT EXISTS education_levels text[] DEFAULT ARRAY['not_applicable'];
    `);

    // Add columns to updated_schemes table as well
    await client.query(`
      ALTER TABLE updated_schemes 
      ADD COLUMN IF NOT EXISTS education_level text DEFAULT 'not_applicable',
      ADD COLUMN IF NOT EXISTS education_levels text[] DEFAULT ARRAY['not_applicable'];
    `);

    // Reset default for non-education schemes
    await client.query(`UPDATE schemes SET education_level = 'not_applicable', education_levels = ARRAY['not_applicable'];`);
    await client.query(`UPDATE updated_schemes SET education_level = 'not_applicable', education_levels = ARRAY['not_applicable'];`);

    // Helper to update both tables
    const setLevel = async (ids: number[], level: string, levels: string[]) => {
      await client.query(`
        UPDATE schemes 
        SET education_level = $1, education_levels = $2 
        WHERE id = ANY($3::int[])
      `, [level, levels, ids]);

      await client.query(`
        UPDATE updated_schemes 
        SET education_level = $1, education_levels = $2 
        WHERE id = ANY($3::int[])
      `, [level, levels, ids]);
    };

    // Central Education Schemes
    // ID 10: ELS - Educational Loan Scheme (Undergrad, Postgrad, Doctoral, Overseas)
    await setLevel([10], 'undergraduate', ['undergraduate', 'postgraduate', 'doctoral', 'overseas', 'higher_education']);

    // ID 11: VETLS - Vocational Education & Training Loan Scheme
    await setLevel([11], 'vocational', ['vocational']);

    // ID 19: Top Class Education Scheme for SC Students (IITs, IIMs, NITs, Medical, Law)
    await setLevel([19], 'undergraduate', ['undergraduate', 'postgraduate', 'higher_education']);

    // ID 20: Post-Matric Scholarship for SC Students
    await setLevel([20], 'post_matric', ['post_matric', 'undergraduate', 'postgraduate', 'higher_education']);

    // ID 21: Pre-Matric Scholarship for SC Students (Classes IX and X only)
    await setLevel([21], 'pre_matric', ['pre_matric']);

    // ID 22: National Fellowship for Scheduled Caste Students (M.Phil / PhD)
    await setLevel([22], 'doctoral', ['doctoral', 'postgraduate', 'higher_education']);

    // ID 23: National Overseas Scholarship for SC Students (Masters & PhD abroad)
    await setLevel([23], 'overseas', ['overseas', 'postgraduate', 'doctoral', 'higher_education']);

    // ID 24: Dr. Ambedkar Central Sector Scheme of Interest Subsidy (Overseas studies)
    await setLevel([24], 'overseas', ['overseas', 'postgraduate', 'doctoral', 'higher_education']);

    // ID 26: Babu Jagjivan Ram Chhatrawas Yojana (Hostels for higher education)
    await setLevel([26], 'undergraduate', ['post_matric', 'undergraduate', 'postgraduate', 'higher_education']);

    // ID 31: Dr. Ambedkar Post-Matric Scholarship for EBC Students
    await setLevel([31], 'post_matric', ['post_matric', 'undergraduate', 'higher_education']);

    // ID 32: Rajiv Gandhi National Fellowship for SC Students (M.Phil / PhD)
    await setLevel([32], 'doctoral', ['doctoral', 'postgraduate', 'higher_education']);

    // State Schemes: Pre-Matric Scholarships (Class IX-X / School)
    const preMatricIds = [
      89,  // Pre-Matric MP
      131, // Pre-Matric Rajasthan
      138, // Pre-Matric UP
      143, // Savitribai Phule Balika Shiksha Madad UP (Classes IX-XII)
      146, // Pre-Matric Bihar
      151, // SC Residential Schools Bihar
      165, // Jagananna Vidya Kanuka AP (Classes I-X)
      180, // Sabooj Sathi WB (Classes IX-XII bicycles)
    ];
    await setLevel(preMatricIds, 'pre_matric', ['pre_matric']);

    // State Schemes: Post-Matric Scholarships (Class XI to PhD)
    const postMatricIds = [
      65, 66, 67, // Maharashtra Post-Matric & Tuition
      88,         // MP Post-Matric
      93,         // Jharkhand SC Scholarship
      98, 103,    // Delhi SC Scholarship & Education Assistance
      104, 105, 106, // Goa Laptop & Scholarships
      110,        // Assam SC Scholarship
      115,        // Tamil Nadu SC Scholarship
      125,        // Kerala SC Scholarship
      130,        // Rajasthan Post-Matric
      137,        // UP Post-Matric
      145,        // Bihar Post-Matric
      152,        // Punjab Post-Matric
      158,        // Haryana Post-Matric
      164,        // AP Post-Matric
      170,        // Telangana Post-Matric
      176, 177,   // West Bengal Post-Matric & Aikyashree
      182,        // Odisha Post-Matric
      187,        // HP Post-Matric
      191,        // Uttarakhand Post-Matric
      195,        // Chhattisgarh Post-Matric
    ];
    await setLevel(postMatricIds, 'post_matric', ['post_matric', 'undergraduate', 'higher_education']);

    // State Higher Education / Merit / Overseas:
    // ID 64: Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti (Higher Education fees)
    await setLevel([64], 'undergraduate', ['undergraduate', 'postgraduate', 'higher_education']);

    // ID 76: Dr. P. G. Solanki Scheme - Medical Graduate Doctors (Gujarat)
    await setLevel([76], 'undergraduate', ['undergraduate', 'higher_education']);

    // ID 79: SC Education Schemes - Gujarat
    await setLevel([79], 'undergraduate', ['undergraduate', 'higher_education']);

    // ID 119: SC/ST Scholarship Schemes - Karnataka (Includes Ambedkar Overseas Scholarship & Vidyasiri)
    await setLevel([119], 'overseas', ['overseas', 'post_matric', 'undergraduate', 'postgraduate', 'higher_education']);

    // ID 153: Dr. Ambedkar Scholarship Scheme - Punjab (Merit higher education)
    await setLevel([153], 'undergraduate', ['undergraduate', 'higher_education']);

    // ID 190: Dr. Ambedkar Medhavi Chhatra Yojana - HP (Merit higher education)
    await setLevel([190], 'undergraduate', ['undergraduate', 'higher_education']);

    // Corporation loan schemes with broad education component (undergrad / professional degree)
    const corpEducationIds = [70, 77, 87, 122, 127, 132, 147, 171, 178, 183];
    await setLevel(corpEducationIds, 'undergraduate', ['undergraduate', 'higher_education', 'vocational']);

    await client.query('COMMIT');
    console.log('Migration committed successfully!');

    // Verification summary
    const summary = await client.query(`
      SELECT education_level, count(*) 
      FROM schemes 
      GROUP BY education_level 
      ORDER BY count(*) DESC;
    `);
    console.log('\nEducation Level Distribution in schemes:');
    summary.rows.forEach(r => console.log(`- ${r.education_level}: ${r.count} schemes`));

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back:', e);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error(err);
  process.exit(1);
});
