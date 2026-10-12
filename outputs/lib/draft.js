import { openDB } from 'idb';

const DRAFT_DB_NAME = 'landdoc-draft-db';
const DRAFT_STORE = 'drafts';
const PENDING_KEY = 'pending_document_draft';

// In-memory cache for instant client-side route transitions
let inMemoryDraft = null;

async function getDraftDB() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return null;
  }
  return openDB(DRAFT_DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        db.createObjectStore(DRAFT_STORE);
      }
    },
  });
}

/**
 * Save pending draft document (including binary File/Blob and OCR results)
 * @param {Object} draftData 
 */
export async function savePendingDraft(draftData) {
  inMemoryDraft = { ...draftData, updatedAt: Date.now() };

  try {
    const db = await getDraftDB();
    if (db) {
      await db.put(DRAFT_STORE, inMemoryDraft, PENDING_KEY);
    }
  } catch (err) {
    console.warn('[Draft] Failed to persist draft to IndexedDB:', err);
  }

  // Also store lightweight metadata in sessionStorage as backup for filename/strings
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const lightweight = {
        propertyId: draftData.propertyId,
        propertyName: draftData.propertyName,
        fileName: draftData.fileName,
        fileSize: draftData.fileSize,
        docTitle: draftData.docTitle,
        docCategory: draftData.docCategory,
        surveyDetail: draftData.surveyDetail,
        docNumber: draftData.docNumber,
        notes: draftData.notes,
        hasBlob: Boolean(draftData.fileBlob),
      };
      sessionStorage.setItem('landdoc_pending_doc_meta', JSON.stringify(lightweight));
    }
  } catch (e) {
    // ignore
  }

  return inMemoryDraft;
}

/**
 * Retrieve pending draft document from memory or IndexedDB
 * @returns {Promise<Object|null>}
 */
export async function getPendingDraft() {
  if (inMemoryDraft) {
    return inMemoryDraft;
  }

  try {
    const db = await getDraftDB();
    if (db) {
      const stored = await db.get(DRAFT_STORE, PENDING_KEY);
      if (stored) {
        inMemoryDraft = stored;
        return stored;
      }
    }
  } catch (err) {
    console.warn('[Draft] Failed to load draft from IndexedDB:', err);
  }

  return null;
}

/**
 * Clear the pending draft once saved to vault or discarded
 */
export async function clearPendingDraft() {
  inMemoryDraft = null;

  try {
    const db = await getDraftDB();
    if (db) {
      await db.delete(DRAFT_STORE, PENDING_KEY);
    }
  } catch (err) {
    console.warn('[Draft] Failed to delete draft from IndexedDB:', err);
  }

  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('landdoc_pending_doc_meta');
      sessionStorage.removeItem('landdoc_pending_doc');
    }
  } catch (e) {
    // ignore
  }
}
