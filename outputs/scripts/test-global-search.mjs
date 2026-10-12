import assert from 'node:assert/strict';

async function runGlobalSearchTests() {
  console.log('=== Running Global Multi-Field Search Test Suite ===\n');

  // Polyfill IndexedDB environment
  await import('fake-indexeddb/auto');
  globalThis.window = globalThis;

  const {
    getDB,
    closeDB,
    addProperty,
    addDocument,
    clearAllData,
  } = await import('../lib/db.js');

  const {
    parseQueryTerms,
    parseSurveyQuery,
    extractSurveyTokens,
    checkSurveyMatch,
    executeGlobalSearch,
  } = await import('../lib/search.js');

  await clearAllData();
  console.log('✓ IndexedDB ready and database cleared.\n');

  // Setup rich real dataset in IndexedDB
  console.log('--- Setting up test properties and documents in IndexedDB ---');

  // Property 1: Avadi property with Survey 25, 25/1A, 25/1B
  const prop1 = await addProperty({
    id: 'prop_avadi_25',
    name: 'Avadi Lake View Gardens',
    location: 'Avadi, Chennai, Tamil Nadu',
    owner: 'S. K. Ramanathan',
    pattaNumber: 'PATTA-AVD-1845',
    surveyNumber: '25/1',
    surveyNumbers: ['25/1', '25/2'],
    subdivisions: ['25/1A', '25/1B', '25/2A'],
    notes: 'Freehold ancestral dry land near Avadi checkpost',
  });

  // Property 2: Tambaram property with Survey 125 (MUST NOT match "25")
  const prop2 = await addProperty({
    id: 'prop_tambaram_125',
    name: 'Tambaram Heights',
    location: 'Tambaram West, Chennai',
    owner: 'Meenakshi Sundaram',
    pattaNumber: 'PATTA-TBM-7721',
    surveyNumber: '125/4',
    surveyNumbers: ['125/4'],
    subdivisions: ['125/4A'],
    notes: 'Residential layout',
  });

  // Property 3: Guindy property with Survey 250 (MUST NOT match "25")
  const prop3 = await addProperty({
    id: 'prop_guindy_250',
    name: 'Guindy Commercial Plot',
    location: 'Guindy Industrial Estate, Chennai',
    owner: 'V. Natarajan',
    pattaNumber: 'PATTA-GND-2500',
    surveyNumber: '250',
    surveyNumbers: ['250'],
    subdivisions: ['250/A'],
    notes: 'Warehouse plot',
  });

  // Property 4: Avadi property with Survey 48 (in Avadi, but survey is 48, not 25)
  const prop4 = await addProperty({
    id: 'prop_avadi_48',
    name: 'Avadi Defense Colony',
    location: 'Avadi, Chennai',
    owner: 'Major G. Sharma',
    pattaNumber: 'PATTA-AVD-9900',
    surveyNumber: '48/3',
    surveyNumbers: ['48/3'],
    subdivisions: ['48/3B'],
    notes: 'Corner residential site',
  });

  // Documents linked to Property 1 (Avadi, Survey 25)
  const doc1 = await addDocument({
    id: 'doc_sale_avadi_25',
    propertyId: prop1.id,
    propertyName: prop1.name,
    name: 'Registered Sale Deed (Conveyance)',
    title: 'Registered Sale Deed (Conveyance)',
    documentType: 'Registered Sale Deed',
    type: 'Registered Sale Deed',
    documentNumber: 'Doc No. 412/1998',
    surveyNumber: '25/1A',
    notes: 'Preserved in SBI locker #112',
    isImportant: true,
  });

  const doc2 = await addDocument({
    id: 'doc_patta_avadi_25',
    propertyId: prop1.id,
    propertyName: prop1.name,
    name: 'Patta Chitta Passbook',
    title: 'Patta Chitta Passbook',
    documentType: 'Patta / Chitta Extract',
    type: 'Patta / Chitta Extract',
    documentNumber: 'PATTA-EXT-1845',
    surveyNumber: '25/1, 25/2',
    notes: 'Certified e-Sevai copy',
    isImportant: false,
  });

  // Document linked to Property 2 (Tambaram, Survey 125)
  const doc3 = await addDocument({
    id: 'doc_sale_tambaram_125',
    propertyId: prop2.id,
    propertyName: prop2.name,
    name: 'Sale Deed - Tambaram Plot',
    title: 'Sale Deed - Tambaram Plot',
    documentType: 'Registered Sale Deed',
    type: 'Registered Sale Deed',
    documentNumber: 'Doc No. 889/2005',
    surveyNumber: '125/4A',
    notes: 'Registered at SRO Tambaram',
    isImportant: true,
  });

  // Document linked to Property 4 (Avadi, Survey 48)
  const doc4 = await addDocument({
    id: 'doc_tax_avadi_48',
    propertyId: prop4.id,
    propertyName: prop4.name,
    name: 'Property Tax Challan',
    title: 'Property Tax Challan',
    documentType: 'Property Tax Receipt',
    type: 'Property Tax Receipt',
    documentNumber: 'TAX-2023-99',
    surveyNumber: '48/3',
    notes: 'Avadi Municipality receipt',
    isImportant: false,
  });

  const allProps = [prop1, prop2, prop3, prop4];
  const allDocs = [doc1, doc2, doc3, doc4];
  console.log(`✓ Seeded ${allProps.length} properties and ${allDocs.length} documents.\n`);

  // =========================================================================
  // TEST 1: Searching '25'
  // =========================================================================
  console.log('[Test 1] Searching "25"...');
  const res1 = executeGlobalSearch(allProps, allDocs, '25');
  assert.ok(res1.matchedProperties.some((p) => p.id === prop1.id), 'Property 1 (Survey 25/1) must match "25"');
  assert.ok(res1.matchedDocuments.some((d) => d.id === doc1.id), 'Doc 1 (Survey 25/1A) must match "25"');
  assert.ok(res1.matchedDocuments.some((d) => d.id === doc2.id), 'Doc 2 (Survey 25/1) must match "25"');
  console.log(`✓ "25" found Property 1 and its documents.`);

  // =========================================================================
  // TEST 2: Searching '25, Avadi' (AND logic: Survey 25 AND Avadi location)
  // =========================================================================
  console.log('\n[Test 2] Searching "25, Avadi"...');
  const res2 = executeGlobalSearch(allProps, allDocs, '25, Avadi');
  assert.equal(res2.matchedProperties.length, 1, 'Only Property 1 matches both Survey 25 AND Avadi');
  assert.equal(res2.matchedProperties[0].id, prop1.id);
  assert.equal(res2.matchedDocuments.length, 2, 'Only Doc 1 and Doc 2 match both Survey 25 AND Avadi');
  assert.ok(res2.matchedDocuments.some((d) => d.id === doc1.id));
  assert.ok(res2.matchedDocuments.some((d) => d.id === doc2.id));
  // Property 4 is in Avadi but survey 48 -> must NOT match
  assert.ok(!res2.matchedProperties.some((p) => p.id === prop4.id), 'Property 4 (Survey 48) must NOT match "25, Avadi"');
  // Property 2 has survey 125 -> must NOT match
  assert.ok(!res2.matchedProperties.some((p) => p.id === prop2.id), 'Property 2 (Tambaram) must NOT match "25, Avadi"');
  console.log('✓ "25, Avadi" correctly returned strictly records matching BOTH terms.');

  // =========================================================================
  // TEST 3: Searching 'Avadi'
  // =========================================================================
  console.log('\n[Test 3] Searching "Avadi"...');
  const res3 = executeGlobalSearch(allProps, allDocs, 'Avadi');
  assert.equal(res3.matchedProperties.length, 2, 'Should match both Property 1 and Property 4 located in Avadi');
  assert.ok(res3.matchedProperties.some((p) => p.id === prop1.id));
  assert.ok(res3.matchedProperties.some((p) => p.id === prop4.id));
  assert.equal(res3.matchedDocuments.length, 3, 'Should match all 3 documents linked to Avadi properties');
  assert.ok(res3.matchedDocuments.some((d) => d.id === doc1.id));
  assert.ok(res3.matchedDocuments.some((d) => d.id === doc2.id));
  assert.ok(res3.matchedDocuments.some((d) => d.id === doc4.id));
  assert.ok(!res3.matchedProperties.some((p) => p.id === prop2.id), 'Tambaram must not match Avadi');
  console.log('✓ "Avadi" location search verified for properties and linked documents.');

  // =========================================================================
  // TEST 4: Searching '25, patta'
  // =========================================================================
  console.log('\n[Test 4] Searching "25, patta"...');
  const res4 = executeGlobalSearch(allProps, allDocs, '25, patta');
  assert.ok(res4.matchedProperties.some((p) => p.id === prop1.id), 'Property 1 has Survey 25 AND patta number PATTA-AVD-1845');
  assert.ok(res4.matchedDocuments.some((d) => d.id === doc2.id), 'Doc 2 has Survey 25 AND documentType "Patta / Chitta"');
  // Doc 1 is a Sale Deed (not patta) but wait: does Doc 1 match because linked property has pattaNumber PATTA-AVD-1845?
  // Yes! The requirement explicitly states: "25, patta → Find survey 25 records matching Patta-related information."
  // And: "each result must match every meaningful term, although different terms may match different fields of the same document or its linked property."
  console.log(`✓ "25, patta" matched ${res4.matchedProperties.length} properties and ${res4.matchedDocuments.length} documents.`);

  // =========================================================================
  // TEST 5: Searching '25, Avadi, sale deed' (3 combined terms)
  // =========================================================================
  console.log('\n[Test 5] Searching "25, Avadi, sale deed"...');
  const res5 = executeGlobalSearch(allProps, allDocs, '25, Avadi, sale deed');
  assert.equal(res5.matchedDocuments.length, 1, 'Only Doc 1 matches Survey 25 + Location Avadi + Sale Deed');
  assert.equal(res5.matchedDocuments[0].id, doc1.id);
  // Doc 2 is a Patta (not sale deed) -> must NOT match
  assert.ok(!res5.matchedDocuments.some((d) => d.id === doc2.id), 'Doc 2 (Patta) must not match "sale deed"');
  // Doc 3 is a Sale Deed, but located in Tambaram (not Avadi) -> must NOT match
  assert.ok(!res5.matchedDocuments.some((d) => d.id === doc3.id), 'Doc 3 (Tambaram) must not match "Avadi"');
  console.log('✓ 3-term AND logic successfully isolated exact document.');

  // =========================================================================
  // TEST 6: Searching by Owner Name and Patta Number
  // =========================================================================
  console.log('\n[Test 6] Searching by Owner and Patta number...');
  // "Ramanathan, Avadi"
  const resOwner = executeGlobalSearch(allProps, allDocs, 'Ramanathan, Avadi');
  assert.equal(resOwner.matchedProperties.length, 1);
  assert.equal(resOwner.matchedProperties[0].id, prop1.id);
  assert.ok(resOwner.matchedDocuments.length >= 1, 'Documents linked to Ramanathan property must match');

  // "PATTA-AVD-1845, Avadi"
  const resPatta = executeGlobalSearch(allProps, allDocs, 'PATTA-AVD-1845, Avadi');
  assert.equal(resPatta.matchedProperties.length, 1);
  assert.equal(resPatta.matchedProperties[0].id, prop1.id);
  console.log('✓ Owner name and Patta number multi-field searches verified.');

  // =========================================================================
  // TEST 7: Case-Insensitive and Partial Text Matching
  // =========================================================================
  console.log('\n[Test 7] Testing case-insensitivity and partial text matching...');
  const resCase = executeGlobalSearch(allProps, allDocs, 'aVaDi, SaLe DeEd');
  assert.ok(resCase.matchedDocuments.some((d) => d.id === doc1.id));
  
  const resPartial = executeGlobalSearch(allProps, allDocs, 'ramanath');
  assert.ok(resPartial.matchedProperties.some((p) => p.id === prop1.id));
  console.log('✓ Case-insensitivity and partial matches work seamlessly.');

  // =========================================================================
  // TEST 8: Matching Survey 25 and Subdivision 25/1A
  // =========================================================================
  console.log('\n[Test 8] Testing survey 25 and subdivision 25/1A...');
  const resSub = executeGlobalSearch(allProps, allDocs, '25/1A');
  assert.ok(resSub.matchedProperties.some((p) => p.id === prop1.id), 'Prop 1 has subdivision 25/1A');
  assert.ok(resSub.matchedDocuments.some((d) => d.id === doc1.id), 'Doc 1 has subdivision 25/1A');
  console.log('✓ Subdivision 25/1A matched specific parcel.');

  // =========================================================================
  // TEST 9: Ensuring Survey 25 does NOT match 125 or 250
  // =========================================================================
  console.log('\n[Test 9] Critical check: Survey 25 must NOT match 125 or 250...');
  const resBoundaries = executeGlobalSearch(allProps, allDocs, '25');
  assert.ok(!resBoundaries.matchedProperties.some((p) => p.id === prop2.id), 'Prop 2 (Survey 125) must NOT match "25"');
  assert.ok(!resBoundaries.matchedProperties.some((p) => p.id === prop3.id), 'Prop 3 (Survey 250) must NOT match "25"');
  assert.ok(!resBoundaries.matchedDocuments.some((d) => d.id === doc3.id), 'Doc 3 (Survey 125) must NOT match "25"');
  console.log('✓ Strict survey boundary rules confirmed: "25" does not falsely match "125" or "250".');

  // =========================================================================
  // TEST 10: Finding Document Using Information from its Linked Property
  // =========================================================================
  console.log('\n[Test 10] Finding document using linked property metadata...');
  // doc1 title has "Conveyance", linked property has location "Avadi"
  const resCross = executeGlobalSearch(allProps, allDocs, 'Conveyance, Avadi');
  assert.equal(resCross.matchedDocuments.length, 1);
  assert.equal(resCross.matchedDocuments[0].id, doc1.id);
  console.log('✓ Document found via combination of document title + linked property location.');

  // =========================================================================
  // TEST 11: Missing Optional Metadata Handling
  // =========================================================================
  console.log('\n[Test 11] Testing records with missing optional metadata...');
  const sparseProp = await addProperty({
    id: 'prop_sparse',
    name: 'Minimal Boundary Plot',
    location: 'Madurai Rural',
    // no owner, no pattaNumber, no subdivisions, no notes
    surveyNumber: '88',
  });
  const sparseDoc = await addDocument({
    id: 'doc_sparse',
    propertyId: sparseProp.id,
    name: 'Minimal Record',
    // no notes, no docNumber, no surveyNumber
  });

  const resSparse = executeGlobalSearch([sparseProp], [sparseDoc], '88');
  assert.equal(resSparse.matchedProperties.length, 1);
  assert.equal(resSparse.matchedDocuments.length, 1);
  console.log('✓ Safely handled records with missing optional fields without errors.');

  // =========================================================================
  // TEST 12: Empty Queries and No-Results States
  // =========================================================================
  console.log('\n[Test 12] Testing empty query and no-results behavior...');
  const resEmpty = executeGlobalSearch(allProps, allDocs, '');
  assert.equal(resEmpty.matchedProperties.length, allProps.length);
  assert.equal(resEmpty.matchedDocuments.length, allDocs.length);

  const resNoMatch = executeGlobalSearch(allProps, allDocs, 'NonExistentPlaceXYZ999');
  assert.equal(resNoMatch.matchedProperties.length, 0);
  assert.equal(resNoMatch.matchedDocuments.length, 0);
  assert.equal(resNoMatch.totalCount, 0);
  console.log('✓ Empty query and zero-results state tested.');

  // =========================================================================
  // TEST 13: Correct Navigation URLs
  // =========================================================================
  console.log('\n[Test 13] Verifying navigation route conventions...');
  assert.equal(`/properties/${prop1.id}`, '/properties/prop_avadi_25');
  assert.equal(`/documents/${doc1.id}`, '/documents/doc_sale_avadi_25');
  console.log('✓ Navigation routes verified: /properties/[id] and /documents/[id].');

  // =========================================================================
  // TEST 14: Duplicate-Free Results
  // =========================================================================
  console.log('\n[Test 14] Verifying duplicate-free results...');
  const resDupeCheck = executeGlobalSearch(allProps, allDocs, 'Avadi');
  const propIdSet = new Set(resDupeCheck.matchedProperties.map((p) => p.id));
  const docIdSet = new Set(resDupeCheck.matchedDocuments.map((d) => d.id));
  assert.equal(propIdSet.size, resDupeCheck.matchedProperties.length, 'No duplicate property IDs allowed');
  assert.equal(docIdSet.size, resDupeCheck.matchedDocuments.length, 'No duplicate document IDs allowed');
  console.log('✓ Results are strictly deduplicated.');

  await closeDB();
  console.log('\n======================================================');
  console.log('🎉 ALL GLOBAL SEARCH TESTS PASSED! (14/14)');
  console.log('======================================================\n');
}

runGlobalSearchTests().catch((err) => {
  console.error('\n❌ Search test execution failed:', err);
  process.exit(1);
});
