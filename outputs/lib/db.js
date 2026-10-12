import { openDB } from 'idb';

/**
 * Database configuration
 */
export const DB_NAME = 'landdoc-db';
export const DB_VERSION = 1;

export const STORES = {
  PROPERTIES: 'properties',
  DOCUMENTS: 'documents',
};

// Cached database connection promise
let dbPromise = null;

/**
 * Check whether IndexedDB is available in the current environment.
 * Safe for Next.js App Router (handles SSR vs Browser).
 * 
 * @returns {boolean} True if running in a browser environment with IndexedDB support.
 */
export function isIndexedDBSupported() {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

/**
 * Generate a unique identifier with a given prefix.
 * Uses Web Crypto API when available with a timestamp fallback.
 * 
 * @param {string} [prefix='id']
 * @returns {string} Unique identifier
 */
export function generateId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Open and return the 'landdoc-db' IndexedDB instance.
 * Automatically handles schema migrations and connection lifecycle.
 * Throws an informative error if invoked outside browser environments.
 * 
 * @returns {Promise<import('idb').IDBPDatabase>}
 */
export async function getDB() {
  if (!isIndexedDBSupported()) {
    throw new Error(
      'IndexedDB is only accessible in the browser environment. ' +
      'Ensure database operations are triggered client-side (e.g. inside useEffect or user event handlers).'
    );
  }

  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // 1. Properties Store
        if (!db.objectStoreNames.contains(STORES.PROPERTIES)) {
          const propStore = db.createObjectStore(STORES.PROPERTIES, { keyPath: 'id' });
          propStore.createIndex('name', 'name', { unique: false });
          propStore.createIndex('pattaNumber', 'pattaNumber', { unique: false });
          propStore.createIndex('owner', 'owner', { unique: false });
          propStore.createIndex('createdAt', 'createdAt', { unique: false });
          propStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // 2. Documents Store
        if (!db.objectStoreNames.contains(STORES.DOCUMENTS)) {
          const docStore = db.createObjectStore(STORES.DOCUMENTS, { keyPath: 'id' });
          // Link document to property using propertyId
          docStore.createIndex('propertyId', 'propertyId', { unique: false });
          docStore.createIndex('documentType', 'documentType', { unique: false });
          docStore.createIndex('isImportant', 'isImportant', { unique: false });
          docStore.createIndex('createdAt', 'createdAt', { unique: false });
          docStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      },
      blocked() {
        console.warn(`[${DB_NAME}] Database upgrade blocked: another tab or connection is open.`);
      },
      blocking() {
        console.warn(`[${DB_NAME}] Database upgrade blocking: closing connection.`);
        if (dbPromise) {
          dbPromise.then((db) => db.close()).catch(() => {});
          dbPromise = null;
        }
      },
      terminated() {
        console.error(`[${DB_NAME}] Database connection terminated abnormally.`);
        dbPromise = null;
      },
    });
  }

  return dbPromise;
}

/**
 * Close the current active database connection if open.
 */
export async function closeDB() {
  if (dbPromise) {
    try {
      const db = await dbPromise;
      db.close();
    } catch {
      // Ignore errors on close
    } finally {
      dbPromise = null;
    }
  }
}

/**
 * Normalize array fields (e.g., survey numbers or subdivisions).
 * @private
 */
function normalizeStringArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  return [String(value)];
}

/* =========================================================================
   PROPERTY OPERATIONS
   ========================================================================= */

/**
 * Add a new property to the database.
 * 
 * @param {Object} property - Property details
 * @param {string} [property.id] - Optional custom ID, auto-generated if omitted
 * @param {string} property.name - Property name (required)
 * @param {string} [property.location] - Property location
 * @param {string} [property.owner] - Property owner
 * @param {string} [property.pattaNumber] - Patta number
 * @param {string[]|string} [property.surveyNumbers] - Multiple survey numbers
 * @param {string[]|string} [property.subdivisions] - Subdivisions
 * @param {string} [property.notes] - Notes or remarks
 * @returns {Promise<Object>} The stored property record
 */
export async function addProperty(property) {
  if (!property || typeof property !== 'object') {
    throw new Error('addProperty: Invalid property data provided.');
  }
  if (!property.name || !property.name.trim()) {
    throw new Error('addProperty: Property name is required.');
  }

  const now = new Date().toISOString();
  const id = property.id || generateId('prop');

  const newProperty = {
    ...property,
    id,
    name: property.name.trim(),
    location: property.location || '',
    owner: property.owner || '',
    pattaNumber: property.pattaNumber || '',
    surveyNumbers: normalizeStringArray(property.surveyNumbers),
    subdivisions: normalizeStringArray(property.subdivisions),
    notes: property.notes || '',
    createdAt: property.createdAt || now,
    updatedAt: now,
  };

  try {
    const db = await getDB();
    await db.add(STORES.PROPERTIES, newProperty);
    return newProperty;
  } catch (error) {
    throw new Error(`Failed to add property "${property.name}": ${error.message}`);
  }
}

/**
 * Retrieve a property by its ID.
 * 
 * @param {string} id - Property ID
 * @returns {Promise<Object|null>} The property object or null if not found
 */
export async function getProperty(id) {
  if (!id) {
    throw new Error('getProperty: Property ID is required.');
  }

  try {
    const db = await getDB();
    const result = await db.get(STORES.PROPERTIES, String(id));
    return result || null;
  } catch (error) {
    throw new Error(`Failed to retrieve property with ID "${id}": ${error.message}`);
  }
}

/**
 * Retrieve all properties stored in the database.
 * 
 * @returns {Promise<Array<Object>>}
 */
export async function getAllProperties() {
  try {
    const db = await getDB();
    return await db.getAll(STORES.PROPERTIES);
  } catch (error) {
    throw new Error(`Failed to retrieve all properties: ${error.message}`);
  }
}

/**
 * Update an existing property.
 * 
 * @param {string} id - Property ID to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} The updated property object
 */
export async function updateProperty(id, updates) {
  if (!id) {
    throw new Error('updateProperty: Property ID is required.');
  }
  if (!updates || typeof updates !== 'object') {
    throw new Error('updateProperty: Updates object is required.');
  }

  try {
    const db = await getDB();
    const existing = await db.get(STORES.PROPERTIES, String(id));
    if (!existing) {
      throw new Error(`Property with ID "${id}" does not exist.`);
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
      createdAt: existing.createdAt, // Preserve original creation timestamp
      updatedAt: new Date().toISOString(),
    };

    if (updates.surveyNumbers !== undefined) {
      updated.surveyNumbers = normalizeStringArray(updates.surveyNumbers);
    }
    if (updates.subdivisions !== undefined) {
      updated.subdivisions = normalizeStringArray(updates.subdivisions);
    }
    if (updates.name !== undefined) {
      updated.name = updates.name.trim();
    }

    await db.put(STORES.PROPERTIES, updated);
    return updated;
  } catch (error) {
    throw new Error(`Failed to update property with ID "${id}": ${error.message}`);
  }
}

/**
 * Delete a property by its ID.
 * Optionally cascades deletion to all documents belonging to this property.
 * 
 * @param {string} id - Property ID
 * @param {Object} [options]
 * @param {boolean} [options.cascadeDocuments=true] - Delete associated documents as well
 * @returns {Promise<boolean>} True if operation succeeded
 */
export async function deleteProperty(id, { cascadeDocuments = true } = {}) {
  if (!id) {
    throw new Error('deleteProperty: Property ID is required.');
  }

  const propId = String(id);

  try {
    const db = await getDB();

    if (cascadeDocuments) {
      // Use a single transaction to ensure atomicity
      const tx = db.transaction([STORES.PROPERTIES, STORES.DOCUMENTS], 'readwrite');
      const propStore = tx.objectStore(STORES.PROPERTIES);
      const docStore = tx.objectStore(STORES.DOCUMENTS);
      const docIndex = docStore.index('propertyId');

      // Delete all documents referencing this property
      let cursor = await docIndex.openCursor(propId);
      while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
      }

      // Delete the property
      await propStore.delete(propId);
      await tx.done;
    } else {
      await db.delete(STORES.PROPERTIES, propId);
    }

    return true;
  } catch (error) {
    throw new Error(`Failed to delete property with ID "${id}": ${error.message}`);
  }
}

/* =========================================================================
   DOCUMENT OPERATIONS
   ========================================================================= */

/**
 * Add a new document linked to a property.
 * 
 * @param {Object} document - Document details
 * @param {string} [document.id] - Optional custom document ID, auto-generated if omitted
 * @param {string} document.propertyId - Property ID to link to (required)
 * @param {string} [document.documentType='General'] - Document category / type
 * @param {Object} [document.metadata={}] - Arbitrary metadata (file name, notes, reference, etc.)
 * @param {Blob|File|null} [document.fileBlob=null] - Actual binary image or PDF file as a Blob
 * @param {boolean} [document.isImportant=false] - Important flag status
 * @returns {Promise<Object>} The stored document record
 */
export async function addDocument(document) {
  if (!document || typeof document !== 'object') {
    throw new Error('addDocument: Invalid document data provided.');
  }
  if (!document.propertyId) {
    throw new Error('addDocument: "propertyId" is required to link the document to a property.');
  }

  const now = new Date().toISOString();
  const id = document.id || generateId('doc');
  const isImportant = Boolean(document.isImportant ?? document.important ?? false);

  const newDoc = {
    ...document,
    id,
    propertyId: String(document.propertyId),
    documentType: document.documentType || 'General',
    metadata: document.metadata && typeof document.metadata === 'object' ? document.metadata : {},
    fileBlob: document.fileBlob || null,
    isImportant,
    createdAt: document.createdAt || now,
    updatedAt: now,
  };

  try {
    const db = await getDB();
    await db.add(STORES.DOCUMENTS, newDoc);
    return newDoc;
  } catch (error) {
    throw new Error(`Failed to add document for property "${document.propertyId}": ${error.message}`);
  }
}

/**
 * Retrieve a single document by its ID.
 * 
 * @param {string} id - Document ID
 * @returns {Promise<Object|null>} The document object (including fileBlob) or null
 */
export async function getDocument(id) {
  if (!id) {
    throw new Error('getDocument: Document ID is required.');
  }

  try {
    const db = await getDB();
    const result = await db.get(STORES.DOCUMENTS, String(id));
    return result || null;
  } catch (error) {
    throw new Error(`Failed to retrieve document with ID "${id}": ${error.message}`);
  }
}

/**
 * Retrieve all documents belonging to a specific property.
 * Uses the 'propertyId' index for direct, high-performance querying.
 * 
 * @param {string} propertyId - The target property ID
 * @returns {Promise<Array<Object>>} List of documents belonging to the property
 */
export async function getDocumentsByProperty(propertyId) {
  if (!propertyId) {
    throw new Error('getDocumentsByProperty: propertyId is required.');
  }

  try {
    const db = await getDB();
    return await db.getAllFromIndex(STORES.DOCUMENTS, 'propertyId', String(propertyId));
  } catch (error) {
    throw new Error(`Failed to retrieve documents for property "${propertyId}": ${error.message}`);
  }
}

/**
 * Retrieve all documents in the database.
 * 
 * @returns {Promise<Array<Object>>}
 */
export async function getAllDocuments() {
  try {
    const db = await getDB();
    return await db.getAll(STORES.DOCUMENTS);
  } catch (error) {
    throw new Error(`Failed to retrieve all documents: ${error.message}`);
  }
}

/**
 * Update an existing document record.
 * 
 * @param {string} id - Document ID
 * @param {Object} updates - Fields to update (metadata, fileBlob, isImportant, documentType, etc.)
 * @returns {Promise<Object>} The updated document record
 */
export async function updateDocument(id, updates) {
  if (!id) {
    throw new Error('updateDocument: Document ID is required.');
  }
  if (!updates || typeof updates !== 'object') {
    throw new Error('updateDocument: Updates object is required.');
  }

  try {
    const db = await getDB();
    const existing = await db.get(STORES.DOCUMENTS, String(id));
    if (!existing) {
      throw new Error(`Document with ID "${id}" does not exist.`);
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
      propertyId: updates.propertyId ? String(updates.propertyId) : existing.propertyId,
      metadata: updates.metadata ? { ...existing.metadata, ...updates.metadata } : existing.metadata,
      createdAt: existing.createdAt, // Preserve creation timestamp
      updatedAt: new Date().toISOString(),
    };

    if (updates.isImportant !== undefined) {
      updated.isImportant = Boolean(updates.isImportant);
    } else if (updates.important !== undefined) {
      updated.isImportant = Boolean(updates.important);
    }

    await db.put(STORES.DOCUMENTS, updated);
    return updated;
  } catch (error) {
    throw new Error(`Failed to update document with ID "${id}": ${error.message}`);
  }
}

/**
 * Delete a document by its ID.
 * 
 * @param {string} id - Document ID
 * @returns {Promise<boolean>} True if operation succeeded
 */
export async function deleteDocument(id) {
  if (!id) {
    throw new Error('deleteDocument: Document ID is required.');
  }

  try {
    const db = await getDB();
    await db.delete(STORES.DOCUMENTS, String(id));
    return true;
  } catch (error) {
    throw new Error(`Failed to delete document with ID "${id}": ${error.message}`);
  }
}

/**
 * Delete all documents belonging to a specific property.
 * 
 * @param {string} propertyId - Property ID
 * @returns {Promise<number>} Number of documents deleted
 */
export async function deleteDocumentsByProperty(propertyId) {
  if (!propertyId) {
    throw new Error('deleteDocumentsByProperty: propertyId is required.');
  }

  const propId = String(propertyId);

  try {
    const db = await getDB();
    const tx = db.transaction(STORES.DOCUMENTS, 'readwrite');
    const index = tx.store.index('propertyId');
    let count = 0;

    let cursor = await index.openCursor(propId);
    while (cursor) {
      await cursor.delete();
      count++;
      cursor = await cursor.continue();
    }

    await tx.done;
    return count;
  } catch (error) {
    throw new Error(`Failed to delete documents for property "${propertyId}": ${error.message}`);
  }
}

/* =========================================================================
   UTILITIES & MAINTENANCE
   ========================================================================= */

/**
 * Clear all data from both object stores without deleting the database schema.
 */
export async function clearAllData() {
  try {
    const db = await getDB();
    const tx = db.transaction([STORES.PROPERTIES, STORES.DOCUMENTS], 'readwrite');
    await tx.objectStore(STORES.PROPERTIES).clear();
    await tx.objectStore(STORES.DOCUMENTS).clear();
    await tx.done;
  } catch (error) {
    throw new Error(`Failed to clear database data: ${error.message}`);
  }
}

/**
 * Completely delete the 'landdoc-db' IndexedDB database.
 */
export async function deleteDatabase() {
  await closeDB();
  if (typeof indexedDB !== 'undefined') {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(new Error(`Failed to delete database: ${e.target.error}`));
      request.onblocked = () => {
        console.warn(`[${DB_NAME}] Database deletion blocked: connections still open.`);
      };
    });
  }
}
