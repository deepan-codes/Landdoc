import assert from 'node:assert/strict';

async function runTests() {
  console.log('--- Starting IndexedDB (landdoc-db) Test Suite ---');

  // STEP 1: Verify SSR guard in non-browser environment
  console.log('\n[Test 1] Testing SSR guard behavior when window/indexedDB is undefined...');
  const { isIndexedDBSupported, getDB, closeDB } = await import('../lib/db.js');
  
  assert.equal(isIndexedDBSupported(), false, 'isIndexedDBSupported() should return false in standard Node.js without browser globals');
  
  let ssrErrorCaught = false;
  try {
    await getDB();
  } catch (err) {
    ssrErrorCaught = true;
    assert.match(err.message, /IndexedDB is only accessible in the browser environment/, 'Should give informative SSR error message');
  }
  assert.equal(ssrErrorCaught, true, 'getDB() should reject during SSR');
  console.log('✓ SSR guard works as expected.');

  // STEP 2: Initialize IndexedDB environment for testing
  console.log('\n[Test 2] Initializing fake-indexeddb browser polyfill for testing...');
  await import('fake-indexeddb/auto');
  globalThis.window = globalThis;

  assert.equal(isIndexedDBSupported(), true, 'isIndexedDBSupported() should now return true');
  console.log('✓ Polyfill active and isIndexedDBSupported() detected browser environment.');

  // Reload or use functions now that window.indexedDB is defined
  const {
    DB_NAME,
    DB_VERSION,
    STORES,
    addProperty,
    getProperty,
    getAllProperties,
    updateProperty,
    deleteProperty,
    addDocument,
    getDocument,
    getAllDocuments,
    getDocumentsByProperty,
    updateDocument,
    deleteDocument,
    clearAllData,
  } = await import('../lib/db.js');

  const db = await getDB();
  assert.equal(db.name, DB_NAME, `Database name should be "${DB_NAME}"`);
  assert.equal(db.version, DB_VERSION, `Database version should be ${DB_VERSION}`);
  assert.ok(db.objectStoreNames.contains(STORES.PROPERTIES), 'Database contains "properties" store');
  assert.ok(db.objectStoreNames.contains(STORES.DOCUMENTS), 'Database contains "documents" store');
  console.log(`✓ Database "${DB_NAME}" v${DB_VERSION} successfully opened with both object stores.`);

  // Clean slate
  await clearAllData();

  // STEP 3: Property Operations
  console.log('\n[Test 3] Testing Property CRUD operations...');
  const sampleProp1 = await addProperty({
    name: 'Sample Test Farm',
    location: 'Chengalpattu, Tamil Nadu',
    owner: 'Test Owner A',
    pattaNumber: 'TN-998811',
    surveyNumbers: ['101/1', '101/2'],
    subdivisions: ['101/1A', '101/2B'],
    notes: 'Initial property creation for test verification',
  });

  assert.ok(sampleProp1.id, 'Property must receive an auto-generated unique ID');
  assert.equal(sampleProp1.name, 'Sample Test Farm');
  assert.deepEqual(sampleProp1.surveyNumbers, ['101/1', '101/2']);
  assert.ok(sampleProp1.createdAt, 'Property must have createdAt timestamp');
  assert.ok(sampleProp1.updatedAt, 'Property must have updatedAt timestamp');
  console.log(`✓ Added property: ID=${sampleProp1.id}, Name=${sampleProp1.name}`);

  // Retrieve property
  const retrievedProp = await getProperty(sampleProp1.id);
  assert.equal(retrievedProp.id, sampleProp1.id);
  assert.equal(retrievedProp.owner, 'Test Owner A');
  console.log('✓ Successfully retrieved property by ID.');

  // Update property
  const updatedProp = await updateProperty(sampleProp1.id, {
    notes: 'Updated notes with verified boundary survey',
    subdivisions: ['101/1A', '101/1B', '101/2B'],
  });
  assert.equal(updatedProp.notes, 'Updated notes with verified boundary survey');
  assert.equal(updatedProp.subdivisions.length, 3);
  console.log('✓ Successfully updated property.');

  // Add second property
  const sampleProp2 = await addProperty({
    name: 'Sample Urban Plot',
    location: 'Guindy, Chennai',
    owner: 'Test Owner B',
    pattaNumber: 'TN-445566',
    surveyNumbers: ['88/4'],
    subdivisions: ['88/4A'],
    notes: 'Commercial plot sample',
  });
  console.log(`✓ Added second property: ID=${sampleProp2.id}`);

  const allProps = await getAllProperties();
  assert.equal(allProps.length, 2, 'Should have 2 properties in database');
  console.log(`✓ getAllProperties() returned ${allProps.length} properties.`);

  // STEP 4: Document Operations with Sample Blob
  console.log('\n[Test 4] Testing Document CRUD operations and sample Blob storage...');
  
  // Create sample binary Blobs
  const samplePdfContent = '%PDF-1.4 Mock Document Sample for LandDoc Testing %EOF';
  const samplePdfBlob = new Blob([samplePdfContent], { type: 'application/pdf' });

  const sampleImageContent = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header signature
  const sampleImageBlob = new Blob([sampleImageContent], { type: 'image/png' });

  // Add Document 1 (PDF Blob) linked to Property 1
  const doc1 = await addDocument({
    propertyId: sampleProp1.id,
    documentType: 'Patta Extract',
    metadata: {
      fileName: 'patta_extract_sample.pdf',
      fileSize: samplePdfBlob.size,
      mimeType: samplePdfBlob.type,
      registrationOffice: 'SRO Sample',
    },
    fileBlob: samplePdfBlob,
    isImportant: true,
  });

  assert.ok(doc1.id, 'Document must have a unique ID');
  assert.equal(doc1.propertyId, sampleProp1.id, 'Document must link to property 1');
  assert.equal(doc1.isImportant, true);
  console.log(`✓ Added document 1 (PDF Blob): ID=${doc1.id}, linked to Property ${doc1.propertyId}`);

  // Retrieve Document 1 and check Blob integrity
  const retrievedDoc1 = await getDocument(doc1.id);
  assert.ok(retrievedDoc1, 'Document should be found');
  assert.ok(retrievedDoc1.fileBlob, 'Document should contain stored Blob');
  assert.equal(retrievedDoc1.fileBlob.type, 'application/pdf');
  const retrievedBlobText = await retrievedDoc1.fileBlob.text();
  assert.equal(retrievedBlobText, samplePdfContent, 'Blob content must be identical after retrieval');
  console.log('✓ Successfully retrieved Document 1 and verified binary Blob content.');

  // Add Document 2 (Image Blob) linked to Property 1
  const doc2 = await addDocument({
    propertyId: sampleProp1.id,
    documentType: 'Field Sketch',
    metadata: {
      fileName: 'fmb_sketch_sample.png',
      fileSize: sampleImageBlob.size,
      mimeType: sampleImageBlob.type,
    },
    fileBlob: sampleImageBlob,
    isImportant: false,
  });
  console.log(`✓ Added document 2 (Image Blob): ID=${doc2.id}, linked to Property ${doc2.propertyId}`);

  // Add Document 3 linked to Property 2
  const doc3 = await addDocument({
    propertyId: sampleProp2.id,
    documentType: 'Sale Deed',
    metadata: {
      fileName: 'sale_deed_sample.pdf',
      docNumber: '123/2020',
    },
    fileBlob: new Blob(['Sale deed sample text content'], { type: 'application/pdf' }),
    isImportant: true,
  });
  console.log(`✓ Added document 3: ID=${doc3.id}, linked to Property ${doc3.propertyId}`);

  // STEP 5: Query documents by propertyId
  console.log('\n[Test 5] Testing getDocumentsByProperty(propertyId)...');
  const prop1Docs = await getDocumentsByProperty(sampleProp1.id);
  assert.equal(prop1Docs.length, 2, 'Property 1 should have exactly 2 documents');
  assert.ok(prop1Docs.every((d) => d.propertyId === sampleProp1.id), 'All documents returned must belong to Property 1');
  console.log(`✓ Retrieved ${prop1Docs.length} documents for Property 1.`);

  const prop2Docs = await getDocumentsByProperty(sampleProp2.id);
  assert.equal(prop2Docs.length, 1, 'Property 2 should have exactly 1 document');
  assert.equal(prop2Docs[0].id, doc3.id);
  console.log(`✓ Retrieved ${prop2Docs.length} document for Property 2.`);

  // STEP 6: Update document
  console.log('\n[Test 6] Testing document update...');
  const updatedDoc2 = await updateDocument(doc2.id, {
    isImportant: true,
    metadata: { ...doc2.metadata, verified: true },
  });
  assert.equal(updatedDoc2.isImportant, true);
  assert.equal(updatedDoc2.metadata.verified, true);
  console.log('✓ Successfully updated document flags and metadata.');

  // STEP 7: Delete single document
  console.log('\n[Test 7] Testing document deletion...');
  await deleteDocument(doc2.id);
  const deletedDocCheck = await getDocument(doc2.id);
  assert.equal(deletedDocCheck, null, 'Deleted document should not be found');
  const remainingProp1Docs = await getDocumentsByProperty(sampleProp1.id);
  assert.equal(remainingProp1Docs.length, 1, 'Property 1 should now have 1 document remaining');
  console.log('✓ Successfully deleted individual document.');

  // STEP 8: Cascading property deletion
  console.log('\n[Test 8] Testing cascading property deletion...');
  await deleteProperty(sampleProp2.id, { cascadeDocuments: true });
  const checkProp2 = await getProperty(sampleProp2.id);
  assert.equal(checkProp2, null, 'Deleted property should not exist');
  const checkProp2Docs = await getDocumentsByProperty(sampleProp2.id);
  assert.equal(checkProp2Docs.length, 0, 'Associated documents for Property 2 should be cascade deleted');
  console.log('✓ Successfully deleted Property 2 and verified cascaded document cleanup.');

  // STEP 9: Validation and error handling
  console.log('\n[Test 9] Testing validation and error handling...');
  let propErrorCaught = false;
  try {
    await addProperty({ location: 'Missing name property' });
  } catch (err) {
    propErrorCaught = true;
    assert.match(err.message, /Property name is required/);
  }
  assert.equal(propErrorCaught, true, 'Should reject property missing name');

  let docErrorCaught = false;
  try {
    await addDocument({ documentType: 'Missing propertyId document' });
  } catch (err) {
    docErrorCaught = true;
    assert.match(err.message, /propertyId/);
  }
  assert.equal(docErrorCaught, true, 'Should reject document missing propertyId');
  console.log('✓ Error handling and validation work as expected.');

  await closeDB();
  console.log('\n========================================');
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! (9/9)');
  console.log('========================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
