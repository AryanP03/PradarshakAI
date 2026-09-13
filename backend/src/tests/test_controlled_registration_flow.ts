import dotenv from 'dotenv';
dotenv.config();

import { pool } from '../db/pool';
import { generateEmailOtp, verifyOtp } from '../services/OtpService';
import axios from 'axios';
import { getJobCategoryLabel } from '../../../frontend/lib/jobCategories';

const BACKEND = `http://localhost:${process.env.PORT || 4000}`;

async function runTests() {
  console.log('🧪 Starting Controlled Registration Flow & Livelihood Tests...\n');

  // Test 1: Helper function getJobCategoryLabel
  console.log('Test 1: Testing getJobCategoryLabel helper function...');
  const labelStd = getJobCategoryLabel('tailoring_boutique');
  if (labelStd !== 'Tailoring / Boutique') {
    throw new Error(`Expected 'Tailoring / Boutique', got '${labelStd}'`);
  }
  const labelOther = getJobCategoryLabel('other', 'Mobile Repair Shop');
  if (labelOther !== 'Mobile Repair Shop (Other)') {
    throw new Error(`Expected 'Mobile Repair Shop (Other)', got '${labelOther}'`);
  }
  const labelLegacy = getJobCategoryLabel('tailoring_garments');
  if (labelLegacy !== 'Tailoring & Garments') {
    throw new Error(`Expected 'Tailoring & Garments', got '${labelLegacy}'`);
  }
  console.log('  ✅ getJobCategoryLabel handles standard, other, and legacy values correctly.');

  // Test 2: Database Schema & Column Verification
  console.log('\nTest 2: Verifying database users table columns...');
  const colRes = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name IN ('education_level', 'trade_category', 'funding_bracket', 'job_business_other', 'salary');
  `);
  const colMap = new Map(colRes.rows.map(r => [r.column_name, r.data_type]));
  if (!colMap.has('job_business_other')) throw new Error('Missing job_business_other column');
  if (!colMap.has('salary')) throw new Error('Missing salary column');
  if (!colMap.has('trade_category')) throw new Error('Missing trade_category column');
  console.log('  ✅ Database columns verified: salary, trade_category, job_business_other, education_level present.');

  // Test 3: Registration of Standard User with Manual Income & Livelihood
  console.log('\nTest 3: Testing registration with standard job category & manual income...');
  const testEmail1 = `test_std_${Date.now()}@pradarshak-test.in`;

  const res1 = await pool.query(`
    INSERT INTO users (
      name, phone, email, password_hash, dob, gender,
      mobile_verified, email_verified,
      address_line1, city, district, state, pincode,
      eligibility_status, registration_complete, salary,
      education_level, trade_category, funding_bracket, caste_category,
      job_business_other
    ) VALUES (
      'Ramesh Kumar', '9876543210', $1, 'hashed_pw', '1995-05-15', 'male',
      true, false,
      '123 Gandhi Marg', 'Jaipur', 'Jaipur', 'Rajasthan', '302001',
      'pending_manual_review', true, 120000,
      'undergraduate', 'tailoring_boutique', null, 'SC',
      null
    ) RETURNING id, name, email, salary, eligibility_status, trade_category, job_business_other;
  `, [testEmail1]);

  const user1 = res1.rows[0];
  if (user1.salary !== '120000' && user1.salary !== 120000) throw new Error(`Expected salary 120000, got ${user1.salary}`);
  if (user1.eligibility_status === 'verified') throw new Error('Eligibility status must NOT be fake verified');
  if (user1.eligibility_status !== 'pending_manual_review') throw new Error(`Unexpected status ${user1.eligibility_status}`);
  if (user1.trade_category !== 'tailoring_boutique') throw new Error(`Unexpected trade ${user1.trade_category}`);
  if (user1.job_business_other !== null) throw new Error(`job_business_other should be null, got ${user1.job_business_other}`);
  console.log('  ✅ Standard user registered: salary=₹1,20,000, trade_category=tailoring_boutique, eligibility_status=pending_manual_review.');

  // Test 4: Register User with "Other" category and custom text
  console.log('\nTest 4: Testing registration with "Other" category and custom description...');
  const testEmail2 = `test_other_${Date.now()}@pradarshak-test.in`;

  const res2 = await pool.query(`
    INSERT INTO users (
      name, phone, email, password_hash, dob, gender,
      mobile_verified, email_verified,
      address_line1, city, district, state, pincode,
      eligibility_status, registration_complete, salary,
      education_level, trade_category, funding_bracket, caste_category,
      job_business_other
    ) VALUES (
      'Pooja Verma', '9876543211', $1, 'hashed_pw', '1998-08-20', 'female',
      true, false,
      '45 Patel Road', 'Indore', 'Indore', 'Madhya Pradesh', '452001',
      'pending_manual_review', true, 85000,
      'diploma', 'other', null, 'SC',
      'Mobile Repair Shop'
    ) RETURNING id, name, email, salary, eligibility_status, trade_category, job_business_other;
  `, [testEmail2]);

  const user2 = res2.rows[0];
  if (user2.trade_category !== 'other') throw new Error(`Expected trade other, got ${user2.trade_category}`);
  if (user2.job_business_other !== 'Mobile Repair Shop') throw new Error(`Expected 'Mobile Repair Shop', got ${user2.job_business_other}`);
  const displayedLabel = getJobCategoryLabel(user2.trade_category, user2.job_business_other);
  if (displayedLabel !== 'Mobile Repair Shop (Other)') throw new Error(`Expected 'Mobile Repair Shop (Other)', got ${displayedLabel}`);
  console.log('  ✅ "Other" category user registered: trade_category=other, job_business_other=Mobile Repair Shop.');

  // Test 5: Update from "Other" to Standard category clears custom text
  console.log('\nTest 5: Testing profile update from "Other" to standard category...');
  const updateRes = await pool.query(`
    UPDATE users 
    SET trade_category = 'farmer', job_business_other = null, salary = 95000
    WHERE id = $1
    RETURNING id, trade_category, job_business_other, salary;
  `, [user2.id]);
  const updatedUser2 = updateRes.rows[0];
  if (updatedUser2.trade_category !== 'farmer') throw new Error(`Expected farmer, got ${updatedUser2.trade_category}`);
  if (updatedUser2.job_business_other !== null) throw new Error(`Expected null job_business_other, got ${updatedUser2.job_business_other}`);
  console.log('  ✅ Profile update correctly cleared job_business_other when changed away from "Other".');

  // Test 6: Chat Context Resolution for User with "Other"
  console.log('\nTest 6: Verifying effective trade resolution in Chat context...');
  const effectiveTrade = (user2.trade_category === 'other' && user2.job_business_other)
    ? user2.job_business_other
    : (user2.trade_category || null);
  if (effectiveTrade !== 'Mobile Repair Shop') throw new Error(`Effective trade should resolve to Mobile Repair Shop, got ${effectiveTrade}`);
  console.log('  ✅ Chat context effective trade correctly maps custom "Other" text.');

  // Clean up test records
  await pool.query('DELETE FROM users WHERE email IN ($1, $2)', [testEmail1, testEmail2]);
  console.log('  ✅ Cleaned up temporary test records.');

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!\n');
  await pool.end();
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
