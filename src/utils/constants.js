// As per the requirements, this is the hard-coded list for suggestions.
// The 'type' is correctly assigned at the sub-category level.
export const SUGGESTED_CATEGORIES = [
  {
    id: 'cat_01',
    name: 'Housing',
    subcategories: [
      { id: 'sub_001', name: 'Mortgage', type: 'expense' },
      { id: 'sub_002', name: 'Property Taxes', type: 'sinking_fund' },
      { id: 'sub_003', name: 'Home Insurance', type: 'sinking_fund' },
      { id: 'sub_004', name: 'HOA Dues', type: 'expense' },
      { id: 'sub_005', name: 'Home Maintenance', type: 'sinking_fund' },
    ],
  },
  {
    id: 'cat_02',
    name: 'Utilities',
    subcategories: [
      { id: 'sub_006', name: 'Electric Bill', type: 'sinking_fund' },
      { id: 'sub_007', name: 'Water Bill', type: 'sinking_fund' },
      { id: 'sub_008', name: 'Gas Bill', type: 'sinking_fund' },
      { id: 'sub_009', name: 'Internet', type: 'expense' },
      { id: 'sub_010', name: 'Phone Bill', type: 'expense' },
    ],
  },
  {
    id: 'cat_03',
    name: 'Transportation',
    subcategories: [
      { id: 'sub_011', name: 'Car Payment', type: 'expense' },
      { id: 'sub_012', name: 'Car Insurance', type: 'sinking_fund' },
      { id: 'sub_013', name: 'Gas', type: 'expense' },
      { id: 'sub_014', name: 'Car Maintenance', type: 'sinking_fund' },
      { id: 'sub_015', name: 'Public Transit', type: 'expense' },
      { id: 'sub_016', name: 'Rideshare (Uber / Lyft)', type: 'expense' },
    ],
  },
  {
    id: 'cat_04',
    name: 'Food',
    subcategories: [
      { id: 'sub_017', name: 'Groceries', type: 'expense' },
      { id: 'sub_018', name: 'Restaurants', type: 'expense' },
      { id: 'sub_019', name: 'Coffee Shops', type: 'expense' },
      { id: 'sub_020', name: 'Work Lunches', type: 'expense' },
    ],
  },
  {
    id: 'cat_05',
    name: 'Personal',
    subcategories: [
      { id: 'sub_021', name: 'Clothing', type: 'expense' },
      { id: 'sub_022', name: 'Personal Care', type: 'expense' },
      { id: 'sub_023', name: 'Gym / Fitness', type: 'expense' },
      { id: 'sub_024', name: 'Hobbies', type: 'expense' },
      { id: 'sub_025', name: 'Baby Sitting / Childcare', type: 'expense' },
    ],
  },
  {
    id: 'cat_06',
    name: 'Health',
    subcategories: [
      { id: 'sub_026', name: 'Health Insurance', type: 'expense' },
      { id: 'sub_027', name: 'Doctor Visits', type: 'sinking_fund' },
      { id: 'sub_028', name: 'Prescriptions', type: 'sinking_fund' },
      { id: 'sub_029', name: 'Dental', type: 'sinking_fund' },
      { id: 'sub_030', name: 'Vision', type: 'sinking_fund' },
    ],
  },
  {
    id: 'cat_07',
    name: 'Debts',
    subcategories: [
      { id: 'sub_031', name: 'Student Loans', type: 'expense' },
      { id: 'sub_032', name: 'Credit Card Payments', type: 'expense' },
      { id: 'sub_033', name: 'Personal Loans', type: 'expense' },
    ],
  },
  {
    id: 'cat_08',
    name: 'Entertainment',
    subcategories: [
      { id: 'sub_034', name: 'Subscriptions', type: 'expense' },
      { id: 'sub_035', name: 'Events', type: 'expense' },
      { id: 'sub_036', name: 'Dates', type: 'expense' },
    ],
  },
  {
    id: 'cat_09',
    name: 'Giving',
    subcategories: [
      { id: 'sub_037', name: 'Tithe', type: 'expense' },
      { id: 'sub_038', name: 'Gifts', type: 'sinking_fund' },
      { id: 'sub_039', name: 'Charity', type: 'expense' },
    ],
  },
  {
    id: 'cat_10',
    name: 'Annual Expenses',
    // Request 4: Removed Property Tax, HOA, Home/Car/Health Insurance
    subcategories: [
      { id: 'sub_040', name: 'Car Registration', type: 'sinking_fund' },
      { id: 'sub_041', name: 'Annual Subscriptions', type: 'sinking_fund' },
      { id: 'sub_042', name: 'Holiday Gifts', type: 'sinking_fund' },
    ],
  },
  {
    id: 'cat_11',
    name: 'Future Goals',
    subcategories: [
      { id: 'sub_048', name: 'Vacation', type: 'sinking_fund' },
      { id: 'sub_049', name: 'New Car', type: 'sinking_fund' },
      { id: 'sub_050', name: 'Home Down Payment', type: 'sinking_fund' },
      { id: 'sub_051', name: 'Emergency Fund', type: 'sinking_fund' },
      { id: 'sub_052', name: 'Furniture', type: 'sinking_fund' },
      { id: 'sub_053', name: 'Home Improvement', type: 'sinking_fund' },
    ],
  },
  // Request 5: Add Misc. category
  {
    id: 'cat_12',
    name: 'Miscellaneous',
    subcategories: [
      { id: 'sub_054', name: 'Discretionary', type: 'expense' },
      { id: 'sub_055', name: 'General Misc.', type: 'expense' },
      { id: 'sub_056', name: 'Buffer', type: 'sinking_fund' },
    ],
  },
];