import assert from 'node:assert/strict';

async function runAddDocumentTests() {
  console.log('=== Running Add Document & Blob Storage Test Suite ===\n');

  // STEP 1: Polyfill IndexedDB browser globals for Node.js
  console.log('[Test 1] Initializing fake-indexeddb environment...');
  await import('fake-indexeddb/auto');
  globalThis.window = globalThis;

  const {
    getDB,
    closeDB,
    addProperty,
    getProperty,
    addDocument,
    getDocument,
    getAllDocuments,
    getDocumentsByProperty,
    deleteDocument,
    clearAllData,
  } = await import('../lib/db.js');

  await clearAllData();
  console.log('✓ IndexedDB ready and database cleared for fresh test run.');

  // STEP 2: Create a target Property in IndexedDB
  console.log('\n[Test 2] Creating test property for document linkage...');
  const testProperty = await addProperty({
    name: 'Sri Lakshmi Farms & Orchards',
    location: 'Kanchipuram, Tamil Nadu',
    owner: 'R. Balasubramanian',
    pattaNumber: 'TN-KPM-8429',
    surveyNumber: '142/3',
    surveyNumbers: ['142/3', '142/4'],
    subdivisions: ['142/3A', '142/4B'],
    notes: 'Ancestral agricultural holding',
  });

  assert.ok(testProperty.id, 'Property must receive a valid ID');
  console.log(`✓ Property created: "${testProperty.name}" (ID: ${testProperty.id})`);

  // STEP 3: Upload & Save an Image Document as a real binary Blob
  console.log('\n[Test 3] Testing Image upload with real binary Blob storage...');
  
  // Construct a simulated binary JPEG file blob
  const imageBytes = new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0xff, 0xd9,
  ]);
  const imageBlob = new Blob([imageBytes], { type: 'image/jpeg' });

  const imageDocPayload = {
    propertyId: testProperty.id,
    propertyName: testProperty.name,
    name: 'Settlement Deed - Survey 142/3',
    title: 'Settlement Deed - Survey 142/3',
    documentType: 'Settlement / Partition Deed',
    type: 'Settlement / Partition Deed',
    documentNumber: 'Doc No. 1045/2012',
    surveyNumber: '142/3A',
    notes: 'Preserved in domestic fireproof steel safe box #2',
    isImportant: true,
    fileBlob: imageBlob,
    fileName: 'Settlement_Deed_Scan.jpg',
    fileSize: '34 B',
    fileType: 'image/jpeg',
  };

  const savedImageDoc = await addDocument(imageDocPayload);
  assert.ok(savedImageDoc.id, 'Image document must receive a generated ID');
  assert.equal(savedImageDoc.propertyId, testProperty.id);
  assert.equal(savedImageDoc.name, 'Settlement Deed - Survey 142/3');
  assert.equal(savedImageDoc.documentType, 'Settlement / Partition Deed');
  assert.equal(savedImageDoc.documentNumber, 'Doc No. 1045/2012');
  assert.equal(savedImageDoc.surveyNumber, '142/3A');
  assert.equal(savedImageDoc.isImportant, true);
  assert.ok(savedImageDoc.fileBlob instanceof Blob, 'Stored fileBlob must be an instance of Blob');
  assert.equal(savedImageDoc.fileBlob.size, imageBytes.length);
  assert.equal(savedImageDoc.fileBlob.type, 'image/jpeg');
  console.log(`✓ Image document saved: "${savedImageDoc.name}" (ID: ${savedImageDoc.id}, Size: ${savedImageDoc.fileBlob.size} bytes)`);

  // STEP 4: Upload & Save a PDF Document as a real binary Blob
  console.log('\n[Test 4] Testing PDF upload with real binary Blob storage...');

  // Construct a simulated binary PDF file blob
  const pdfContent = '%PDF-1.4\n1 0 obj\n<< /Title (Patta Extract TN-KPM-8429) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF';
  const pdfBytes = new TextEncoder().encode(pdfContent);
  const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

  const pdfDocPayload = {
    propertyId: testProperty.id,
    propertyName: testProperty.name,
    name: 'Patta Chitta Revenue Extract',
    title: 'Patta Chitta Revenue Extract',
    documentType: 'Patta / Chitta Extract',
    type: 'Patta / Chitta Extract',
    documentNumber: 'TK-8429/2023',
    surveyNumber: '142/3, 142/4',
    notes: 'Verified via e-Sevai revenue portal',
    isImportant: false,
    fileBlob: pdfBlob,
    fileName: 'Patta_Extract_8429.pdf',
    fileSize: `${pdfBytes.length} B`,
    fileType: 'application/pdf',
  };

  const savedPdfDoc = await addDocument(pdfDocPayload);
  assert.ok(savedPdfDoc.id, 'PDF document must receive a generated ID');
  assert.equal(savedPdfDoc.propertyId, testProperty.id);
  assert.equal(savedPdfDoc.name, 'Patta Chitta Revenue Extract');
  assert.equal(savedPdfDoc.documentType, 'Patta / Chitta Extract');
  assert.equal(savedPdfDoc.isImportant, false);
  assert.ok(savedPdfDoc.fileBlob instanceof Blob, 'Stored fileBlob must be an instance of Blob');
  assert.equal(savedPdfDoc.fileBlob.size, pdfBytes.length);
  assert.equal(savedPdfDoc.fileBlob.type, 'application/pdf');
  console.log(`✓ PDF document saved: "${savedPdfDoc.name}" (ID: ${savedPdfDoc.id}, Size: ${savedPdfDoc.fileBlob.size} bytes)`);

  // STEP 5: Browser Refresh Simulation (Close & Reopen DB connection)
  console.log('\n[Test 5] Simulating browser page reload (close DB & reconnect)...');
  await closeDB();

  // Retrieve image document after refresh
  const refreshedImageDoc = await getDocument(savedImageDoc.id);
  assert.ok(refreshedImageDoc, 'Image document must persist across refresh');
  assert.equal(refreshedImageDoc.id, savedImageDoc.id);
  assert.equal(refreshedImageDoc.name, 'Settlement Deed - Survey 142/3');
  assert.equal(refreshedImageDoc.isImportant, true);
  assert.ok(refreshedImageDoc.fileBlob instanceof Blob, 'Persisted fileBlob must remain a Blob');
  assert.equal(refreshedImageDoc.fileBlob.size, imageBytes.length);

  // Verify image binary content
  const retrievedImageArray = new Uint8Array(await refreshedImageDoc.fileBlob.arrayBuffer());
  assert.deepEqual(retrievedImageArray, imageBytes, 'Retrieved image binary content must match exactly');
  console.log('✓ Verified: Image Blob and metadata persisted completely through refresh.');

  // Retrieve PDF document after refresh
  const refreshedPdfDoc = await getDocument(savedPdfDoc.id);
  assert.ok(refreshedPdfDoc, 'PDF document must persist across refresh');
  assert.equal(refreshedPdfDoc.id, savedPdfDoc.id);
  assert.equal(refreshedPdfDoc.name, 'Patta Chitta Revenue Extract');
  assert.ok(refreshedPdfDoc.fileBlob instanceof Blob, 'Persisted PDF fileBlob must remain a Blob');
  assert.equal(refreshedPdfDoc.fileBlob.size, pdfBytes.length);

  // Verify PDF text content
  const retrievedPdfText = new TextDecoder().decode(await refreshedPdfDoc.fileBlob.arrayBuffer());
  assert.equal(retrievedPdfText, pdfContent, 'Retrieved PDF binary content must match exactly');
  console.log('✓ Verified: PDF Blob and metadata persisted completely through refresh.');

  // STEP 6: Query documents by Property ID
  console.log('\n[Test 6] Testing getDocumentsByProperty(propertyId)...');
  const propertyDocs = await getDocumentsByProperty(testProperty.id);
  assert.equal(propertyDocs.length, 2, 'Should find exactly 2 documents for test property');
  
  const foundImage = propertyDocs.find((d) => d.id === savedImageDoc.id);
  const foundPdf = propertyDocs.find((d) => d.id === savedPdfDoc.id);
  assert.ok(foundImage, 'Image doc must be present in property documents list');
  assert.ok(foundPdf, 'PDF doc must be present in property documents list');
  console.log(`✓ Successfully retrieved all ${propertyDocs.length} documents linked to property.`);

  // STEP 7: Validation and error handling
  console.log('\n[Test 7] Testing validation errors for invalid document submissions...');
  let missingPropError = false;
  try {
    await addDocument({ name: 'Orphan Document', fileBlob: imageBlob });
  } catch (err) {
    missingPropError = true;
    assert.match(err.message, /propertyId.*required/, 'Should reject missing propertyId');
  }
  assert.equal(missingPropError, true, 'addDocument must require propertyId');

  let invalidDataError = false;
  try {
    await addDocument(null);
  } catch (err) {
    invalidDataError = true;
    assert.match(err.message, /Invalid document data/, 'Should reject null document data');
  }
  assert.equal(invalidDataError, true, 'addDocument must reject null');
  console.log('✓ Validation guards work as expected.');

  // STEP 8: Deletion test
  console.log('\n[Test 8] Testing document deletion...');
  await deleteDocument(savedImageDoc.id);
  const checkDeleted = await getDocument(savedImageDoc.id);
  assert.equal(checkDeleted, null, 'Deleted document should return null');

  const remainingDocs = await getDocumentsByProperty(testProperty.id);
  assert.equal(remainingDocs.length, 1, 'Exactly 1 document should remain');
  assert.equal(remainingDocs[0].id, savedPdfDoc.id);
  console.log('✓ Document deletion and remaining count verified.');

  console.log('\n======================================================');
  console.log('🎉 ALL ADD DOCUMENT & BLOB TESTS PASSED! (8/8)');
  console.log('======================================================\n');
}

runAddDocumentTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
