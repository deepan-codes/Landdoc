import assert from 'node:assert/strict';

async function testPropertyDetailsIntegration() {
  console.log('=== Running Property Details Integration Test Suite ===\n');

  // Set up browser-like IndexedDB environment
  await import('fake-indexeddb/auto');
  globalThis.window = globalThis;

  const {
    getDB,
    closeDB,
    addProperty,
    getProperty,
    deleteProperty,
    addDocument,
    getDocumentsByProperty,
    clearAllData,
  } = await import('../lib/db.js');

  // Clear any existing data
  await clearAllData();

  // =========================================================================
  // TEST 1: Valid Property ID with No Documents
  // =========================================================================
  console.log('[Test 1] Testing property creation & loading with no documents...');

  const propertyPayload = {
    name: 'Valparai Heritage Estate',
    location: 'Valparai Hills, Coimbatore',
    owner: 'K. Subramaniam',
    pattaNumber: 'VAL-101',
    surveyNumber: '55/1',
    surveyNumbers: ['55/1', '55/2'],
    subdivisions: ['55/1A', '55/2B'],
    notes: 'Preserved in native ancestral trunk, original settlement deed 1965.',
    category: 'AGRICULTURAL PLANTATION',
  };

  const savedProperty = await addProperty(propertyPayload);
  assert.ok(savedProperty.id, 'Saved property must have an ID');

  // Retrieve property from IndexedDB by URL parameter ID
  const retrievedProperty = await getProperty(savedProperty.id);
  assert.ok(retrievedProperty, 'Property must be retrieved from IndexedDB');
  assert.equal(retrievedProperty.name, 'Valparai Heritage Estate');
  assert.equal(retrievedProperty.location, 'Valparai Hills, Coimbatore');
  assert.equal(retrievedProperty.owner, 'K. Subramaniam');
  assert.equal(retrievedProperty.pattaNumber, 'VAL-101');
  assert.deepEqual(retrievedProperty.surveyNumbers, ['55/1', '55/2']);
  assert.deepEqual(retrievedProperty.subdivisions, ['55/1A', '55/2B']);
  assert.equal(retrievedProperty.notes, 'Preserved in native ancestral trunk, original settlement deed 1965.');

  // Check documents linked to this property (expect 0)
  const initialDocs = await getDocumentsByProperty(savedProperty.id);
  assert.equal(initialDocs.length, 0, 'New property must start with 0 documents');
  console.log('✓ Valid property loaded with all fields and 0 documents.');

  // =========================================================================
  // TEST 2: Valid Property ID with Linked Documents
  // =========================================================================
  console.log('\n[Test 2] Testing loading linked documents for this property...');

  const doc1 = await addDocument({
    propertyId: savedProperty.id,
    documentType: 'Sale Deed',
    name: 'Registered Settlement Deed 1965',
    metadata: { reference: 'Doc No. 412/1965', notes: 'Parent partition deed' },
    isImportant: true,
  });

  const doc2 = await addDocument({
    propertyId: savedProperty.id,
    documentType: 'Patta',
    name: 'Computer Patta Extract',
    metadata: { reference: 'Patta Transfer Order 2021' },
    isImportant: false,
  });

  const propertyDocs = await getDocumentsByProperty(savedProperty.id);
  assert.equal(propertyDocs.length, 2, 'Should retrieve 2 documents linked to this property');

  const docIds = propertyDocs.map((d) => d.id);
  assert.ok(docIds.includes(doc1.id), 'Should include document 1');
  assert.ok(docIds.includes(doc2.id), 'Should include document 2');
  console.log(`✓ Retrieved ${propertyDocs.length} linked documents from IndexedDB via propertyId index.`);

  // =========================================================================
  // TEST 3: Invalid Property ID (Not Found Handling)
  // =========================================================================
  console.log('\n[Test 3] Testing retrieval for non-existent / invalid property ID...');

  const nonExistent = await getProperty('non_existent_id_9999');
  assert.equal(nonExistent, null, 'Invalid property ID must return null so UI displays not-found state');

  const invalidDocs = await getDocumentsByProperty('non_existent_id_9999');
  assert.equal(invalidDocs.length, 0, 'Documents for non-existent property must be empty array');
  console.log('✓ Invalid ID correctly returns null and empty document list.');

  // =========================================================================
  // TEST 4: Deleted Property ID
  // =========================================================================
  console.log('\n[Test 4] Testing retrieval for deleted property ID...');

  const tempProp = await addProperty({ name: 'Temporary Parcel', location: 'To be deleted' });
  await addDocument({ propertyId: tempProp.id, documentType: 'Temporary' });

  // Delete property and verify cascading
  await deleteProperty(tempProp.id, { cascadeDocuments: true });

  const deletedCheck = await getProperty(tempProp.id);
  assert.equal(deletedCheck, null, 'Deleted property must return null');

  const deletedDocsCheck = await getDocumentsByProperty(tempProp.id);
  assert.equal(deletedDocsCheck.length, 0, 'Cascaded documents must also be deleted');
  console.log('✓ Deleted property correctly returns null (not-found).');

  // =========================================================================
  // TEST 5: Refresh Simulation (Persistence Across Connection Life-Cycle)
  // =========================================================================
  console.log('\n[Test 5] Simulating browser page reload (closing & reopening IndexedDB)...');

  await closeDB();

  // Reopen connection as browser reload does
  const refreshedProperty = await getProperty(savedProperty.id);
  assert.ok(refreshedProperty, 'Property must persist after connection restart / page reload');
  assert.equal(refreshedProperty.name, 'Valparai Heritage Estate');
  assert.equal(refreshedProperty.owner, 'K. Subramaniam');
  assert.equal(refreshedProperty.notes, 'Preserved in native ancestral trunk, original settlement deed 1965.');

  const refreshedDocs = await getDocumentsByProperty(savedProperty.id);
  assert.equal(refreshedDocs.length, 2, 'All linked documents must persist after refresh');
  console.log('✓ Verified: Property details and linked documents persist after page refresh simulation.');

  // =========================================================================
  // TEST 6: Search & Filter Logic on Loaded Documents
  // =========================================================================
  console.log('\n[Test 6] Testing document filtering (All, Key, Search query)...');

  // Key documents filter
  const keyDocs = refreshedDocs.filter((d) => d.isImportant);
  assert.equal(keyDocs.length, 1);
  assert.equal(keyDocs[0].name, 'Registered Settlement Deed 1965');

  // Search by document title
  const titleSearch = refreshedDocs.filter((d) =>
    (d.name || '').toLowerCase().includes('settlement')
  );
  assert.equal(titleSearch.length, 1);

  // Search by document reference
  const refSearch = refreshedDocs.filter((d) =>
    (d.metadata?.reference || '').toLowerCase().includes('412/1965')
  );
  assert.equal(refSearch.length, 1);
  console.log('✓ Document search and key filter logic successfully validated.');

  await closeDB();
  console.log('\n======================================================');
  console.log('🎉 ALL PROPERTY DETAILS INTEGRATION TESTS PASSED!');
  console.log('======================================================\n');
}

testPropertyDetailsIntegration().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
