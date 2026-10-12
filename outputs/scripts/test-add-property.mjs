import assert from 'node:assert/strict';

async function testAddPropertyFlow() {
  console.log('--- Testing Add Property Form Submission & Persistence Flow ---');

  // Set up browser-like IndexedDB environment using fake-indexeddb
  await import('fake-indexeddb/auto');
  globalThis.window = globalThis;

  const {
    getDB,
    closeDB,
    addProperty,
    getProperty,
    getAllProperties,
    updateProperty,
  } = await import('../lib/db.js');

  // STEP 1: Simulate the Add Property form submission payload
  console.log('\n[Step 1] Simulating Add Property form submission with multiple surveys and subdivisions...');
  
  // These match the state gathered in AddPropertyForm.handleSubmit
  const formPayload = {
    name: 'Green Acres Plantation',
    location: 'Kodaikanal Hills, Dindigul',
    owner: 'R. Ramanathan',
    pattaNumber: 'KOD-7890',
    surveyNumber: '145/2',
    surveyNumbers: ['145/2', '146/1'],
    subdivisions: ['145/2A', '145/2B', '146/1A'],
    surveys: [
      { id: '1', number: '145/2', subdivisions: ['145/2A', '145/2B'] },
      { id: '2', number: '146/1', subdivisions: ['146/1A'] },
    ],
    notes: 'Acquired in 1985, title deed safe custody.',
    category: 'AGRICULTURAL PLANTATION',
    documents: 0,
    requiredDocuments: 9,
    addedDocuments: 0,
    photo: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500&h=300&fit=crop',
    lastUpdated: 'Just now',
    updatedDays: 0,
  };

  const savedProperty = await addProperty(formPayload);
  assert.ok(savedProperty.id, 'Saved property must have a unique generated ID');
  assert.ok(savedProperty.id.startsWith('prop_'), 'Saved property ID should have "prop_" prefix');
  assert.equal(savedProperty.name, 'Green Acres Plantation');
  assert.deepEqual(savedProperty.surveyNumbers, ['145/2', '146/1']);
  assert.deepEqual(savedProperty.subdivisions, ['145/2A', '145/2B', '146/1A']);
  assert.ok(savedProperty.createdAt, 'Should contain createdAt timestamp');
  assert.ok(savedProperty.updatedAt, 'Should contain updatedAt timestamp');
  console.log(`✓ Property successfully saved to IndexedDB: ID=${savedProperty.id}`);

  // STEP 2: Simulate navigating to Properties list (/properties)
  console.log('\n[Step 2] Simulating Properties List (/properties) data loading...');
  const allProperties = await getAllProperties();
  assert.ok(allProperties.length >= 1, 'Should find at least 1 property');
  
  const foundInList = allProperties.find((p) => p.id === savedProperty.id);
  assert.ok(foundInList, 'Saved property must appear in the retrieved properties list');
  assert.equal(foundInList.name, 'Green Acres Plantation');
  console.log(`✓ Found newly saved property "${foundInList.name}" in properties list.`);

  // STEP 3: Simulate browser page reload / new session
  console.log('\n[Step 3] Simulating browser page reload (closing & re-opening IndexedDB connection)...');
  await closeDB();

  // Re-open fresh connection as a page refresh does
  const allPropertiesAfterRefresh = await getAllProperties();
  const foundAfterRefresh = allPropertiesAfterRefresh.find((p) => p.id === savedProperty.id);
  assert.ok(foundAfterRefresh, 'Property must persist and remain available after page refresh');
  assert.equal(foundAfterRefresh.name, 'Green Acres Plantation');
  assert.equal(foundAfterRefresh.pattaNumber, 'KOD-7890');
  console.log('✓ Verified property persistence across connection lifecycle (page refresh simulation).');

  // STEP 4: Simulate navigating to Property Details (/properties/[id])
  console.log('\n[Step 4] Simulating Property Details page (/properties/[id]) loading by ID...');
  const detailProperty = await getProperty(savedProperty.id);
  assert.ok(detailProperty, 'Property details must load for saved ID');
  assert.equal(detailProperty.id, savedProperty.id);
  assert.equal(detailProperty.owner, 'R. Ramanathan');
  assert.equal(detailProperty.notes, 'Acquired in 1985, title deed safe custody.');
  assert.deepEqual(detailProperty.surveys.length, 2);
  console.log(`✓ Property details verified successfully: Name="${detailProperty.name}", Owner="${detailProperty.owner}".`);

  // STEP 5: Duplicate submission prevention verification
  console.log('\n[Step 5] Verifying validation of required fields...');
  let nameErrorCaught = false;
  try {
    await addProperty({ location: 'Missing name' });
  } catch (err) {
    nameErrorCaught = true;
  }
  assert.ok(nameErrorCaught, 'Missing name must throw an error');
  console.log('✓ Validation correctly caught missing required fields.');

  await closeDB();
  console.log('\n======================================================');
  console.log('🎉 ADD PROPERTY INTEGRATION TEST PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

testAddPropertyFlow().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
