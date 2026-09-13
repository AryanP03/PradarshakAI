// Exhaustive Job / Business Livelihood Taxonomy for PradarshakAI
// SIH PS 26092 - Categorized options for citizen livelihood, business, and employment

export interface JobGroup {
  group: string;
  options: { id: string; label: string }[];
}

export const JOB_CATEGORIES: JobGroup[] = [
  {
    group: 'Employment / Salaried Jobs',
    options: [
      { id: 'govt_employee', label: 'Government Employee' },
      { id: 'private_employee', label: 'Private Sector Employee' },
      { id: 'bank_finance_employee', label: 'Bank / Financial Services Employee' },
      { id: 'education_employee', label: 'School / College / University Employee' },
      { id: 'healthcare_worker', label: 'Healthcare Worker' },
      { id: 'nurse', label: 'Nurse' },
      { id: 'doctor_medical', label: 'Doctor / Medical Professional' },
      { id: 'teacher_lecturer', label: 'Teacher / Lecturer' },
      { id: 'engineer', label: 'Engineer' },
      { id: 'it_software_pro', label: 'IT / Software Professional' },
      { id: 'accountant_finance', label: 'Accountant / Finance Professional' },
      { id: 'legal_pro', label: 'Legal Professional' },
      { id: 'office_admin', label: 'Office / Administrative Work' },
      { id: 'sales_marketing', label: 'Sales / Marketing' },
      { id: 'security_services', label: 'Security Services' },
      { id: 'driver', label: 'Driver' },
      { id: 'delivery_logistics_worker', label: 'Delivery / Logistics Worker' },
      { id: 'construction_worker', label: 'Construction Worker' },
      { id: 'electrician', label: 'Electrician' },
      { id: 'plumber', label: 'Plumber' },
      { id: 'mechanic', label: 'Mechanic' },
      { id: 'technician', label: 'Technician' },
      { id: 'tailor', label: 'Tailor' },
      { id: 'beautician', label: 'Beautician' },
      { id: 'hairdresser_barber', label: 'Hairdresser / Barber' },
      { id: 'cook_food_service', label: 'Cook / Food Service Worker' },
      { id: 'domestic_worker', label: 'Domestic Worker' },
      { id: 'artisan_craft_worker', label: 'Artisan / Craft Worker' },
      { id: 'agricultural_worker', label: 'Agricultural Worker' },
      { id: 'dairy_worker', label: 'Dairy Worker' },
      { id: 'fisheries_worker', label: 'Fisher / Fisheries Worker' },
      { id: 'other_skilled_worker', label: 'Other Skilled Worker' },
      { id: 'other_unskilled_worker', label: 'Other Unskilled Worker' },
    ]
  },
  {
    group: 'Business / Self-Employment',
    options: [
      { id: 'retail_kirana', label: 'Retail / Kirana Store' },
      { id: 'wholesale_trading', label: 'Wholesale / Trading' },
      { id: 'grocery_provisions', label: 'Grocery / Provisions' },
      { id: 'clothing_garments', label: 'Clothing / Garments' },
      { id: 'tailoring_boutique', label: 'Tailoring / Boutique' },
      { id: 'beauty_salon_parlour', label: 'Beauty Salon / Parlour' },
      { id: 'barber_shop', label: 'Barber Shop' },
      { id: 'handicrafts_artisan_biz', label: 'Handicrafts / Artisan Business' },
      { id: 'food_processing', label: 'Food Processing' },
      { id: 'restaurant_catering', label: 'Restaurant / Food Stall / Catering' },
      { id: 'transport_logistics_biz', label: 'Transport / Logistics' },
      { id: 'auto_erickshaw', label: 'Auto / E-Rickshaw' },
      { id: 'commercial_vehicle', label: 'Commercial Vehicle' },
      { id: 'repair_maintenance', label: 'Repair / Maintenance Services' },
      { id: 'mobile_electronics_repair', label: 'Mobile / Electronics Repair' },
      { id: 'computer_it_services', label: 'Computer / IT Services' },
      { id: 'printing_dtp', label: 'Printing / DTP' },
      { id: 'construction_biz', label: 'Construction Business' },
      { id: 'electrical_services', label: 'Electrical Services' },
      { id: 'plumbing_services', label: 'Plumbing Services' },
      { id: 'manufacturing_small_scale', label: 'Small-Scale Manufacturing' },
      { id: 'recycling_waste_management', label: 'Recycling / Waste Management' },
      { id: 'solar_green_biz', label: 'Solar / Green Business' },
      { id: 'education_coaching_biz', label: 'Education / Coaching / Training' },
      { id: 'professional_services_biz', label: 'Professional Services' },
      { id: 'consulting_biz', label: 'Consulting' },
      { id: 'online_ecommerce', label: 'Online / E-commerce Business' },
    ]
  },
  {
    group: 'Agriculture & Allied',
    options: [
      { id: 'farmer', label: 'Farmer' },
      { id: 'dairy_farming', label: 'Dairy Farming' },
      { id: 'poultry_farming', label: 'Poultry' },
      { id: 'agriculture_farming', label: 'Agriculture / Farming' },
      { id: 'horticulture', label: 'Horticulture' },
      { id: 'fisheries', label: 'Fisheries' },
      { id: 'livestock', label: 'Livestock' },
      { id: 'agricultural_entrepreneur', label: 'Agricultural Entrepreneur' },
      { id: 'dairy_entrepreneur', label: 'Dairy Entrepreneur' },
      { id: 'poultry_entrepreneur', label: 'Poultry Entrepreneur' },
      { id: 'fisheries_entrepreneur', label: 'Fisheries Entrepreneur' },
      { id: 'agri_processing', label: 'Agri-processing' },
      { id: 'agri_allied_biz', label: 'Agri-allied Business' },
    ]
  },
  {
    group: 'Entrepreneurship & Startups',
    options: [
      { id: 'startup', label: 'Startup' },
      { id: 'early_stage_startup', label: 'Early-Stage Startup' },
      { id: 'existing_entrepreneur', label: 'Existing Entrepreneur' },
      { id: 'family_business', label: 'Family Business' },
      { id: 'self_employed_pro', label: 'Self-Employed Professional' },
      { id: 'freelancer', label: 'Freelancer' },
      { id: 'home_based_business', label: 'Home-Based Business' },
    ]
  },
  {
    group: 'Livelihood & Other Status',
    options: [
      { id: 'student', label: 'Student' },
      { id: 'homemaker', label: 'Homemaker' },
      { id: 'retired', label: 'Retired' },
      { id: 'unemployed', label: 'Unemployed' },
      { id: 'looking_for_work', label: 'Looking for Work' },
    ]
  },
  {
    group: 'Other',
    options: [
      { id: 'other', label: 'Other (Please specify below)' },
    ]
  }
];

// Flat lookup dictionary including backward-compatible historical legacy categories
export const ALL_JOB_OPTIONS_MAP: Record<string, string> = {
  // Legacy mappings
  retail_shop: 'Retail & Kirana Store',
  tailoring_garments: 'Tailoring & Garments',
  agriculture_allied: 'Dairy & Agri Allied',
  transport_logistics: 'Transport & Logistics',
  it_technical_services: 'IT & Tech Services',
  artisans_handicrafts: 'Artisans & Handicrafts',
  education_training: 'Education & Training',
  sanitation_green_business: 'Sanitation & Green Biz',
};

// Populate the lookup map with all options
JOB_CATEGORIES.forEach(grp => {
  grp.options.forEach(opt => {
    ALL_JOB_OPTIONS_MAP[opt.id] = opt.label;
  });
});

/**
 * Returns a human-friendly display label for a user's job/business category.
 * If user selected 'other' and provided custom text, displays that custom text.
 */
export function getJobCategoryLabel(category?: string | null, otherText?: string | null): string {
  if (!category) return 'Not provided';
  if (category === 'other' || category.toLowerCase() === 'other') {
    return otherText?.trim() ? `${otherText.trim()} (Other)` : 'Other';
  }
  return ALL_JOB_OPTIONS_MAP[category] || category;
}
