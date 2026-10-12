/**
 * LandDoc Global Search Engine
 * Multi-field matching with strict survey-number boundaries, AND-logic,
 * linked property resolution, and match explanation tags.
 */

/**
 * Split a raw search query into normalized, non-empty terms.
 * Supports splitting by comma, semicolon, or other standard delimiters.
 * 
 * @param {string} query - Raw user search input
 * @returns {Array<string>} List of cleaned, trimmed search terms
 */
export function parseQueryTerms(query) {
  if (!query || typeof query !== 'string') return [];
  return query
    .split(/[,;]+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 0);
}

/**
 * Inspect whether a search term is specifically a survey number or subdivision query.
 * Handles prefixes like "survey", "sy", "s.no", "survey no." and numbers/subdivisions.
 * 
 * @param {string} term - A single search term (e.g. "25", "25/1A", "Survey 25")
 * @returns {Object|null} Parsed survey query descriptor or null if not a survey pattern
 */
export function parseSurveyQuery(term) {
  if (!term || typeof term !== 'string') return null;
  const trimmed = term.trim();

  // Strip common survey prefixes
  const withoutPrefix = trimmed
    .replace(/^(?:survey(?:\s*(?:no\.?|number|#))?|sy\.?|s\.?no\.?|sno)\s*/i, '')
    .trim();

  // Match survey numbers: "25", "25/1", "25/1A", "25-1A", "25 / 1A", "101/2B"
  const surveyRegex = /^(\d+)(?:\s*[/\\-]\s*([a-zA-Z0-9]+(?:\s*[/\\-]\s*[a-zA-Z0-9]+)?))?$/;
  const match = withoutPrefix.match(surveyRegex);

  if (match) {
    const base = match[1];
    const sub = match[2] ? match[2].replace(/\s+/g, '').toUpperCase() : null;
    return {
      base, // e.g. "25"
      sub, // e.g. "1A" or null
      canonical: sub ? `${base}/${sub}` : base, // "25/1A" or "25"
      isSpecificSubdivision: Boolean(sub),
      hasExplicitPrefix: withoutPrefix !== trimmed,
    };
  }

  return null;
}

/**
 * Normalize and extract all survey tokens (base and subdivisions) from a record.
 * 
 * @param {Object} record - Property or Document record
 * @returns {Array<string>} List of normalized survey tokens
 */
export function extractSurveyTokens(record) {
  if (!record) return [];
  const tokens = new Set();

  const addValue = (val) => {
    if (!val) return;
    if (Array.isArray(val)) {
      val.forEach(addValue);
      return;
    }
    if (typeof val !== 'string') return;

    // Split on commas, semicolons, slashes if list
    const parts = val.split(/[,;\n]+/);
    for (const part of parts) {
      const p = part.trim();
      if (!p) continue;

      const clean = p.replace(/^(?:survey(?:\s*(?:no\.?|number|#))?|sy\.?|s\.?no\.?|sno)\s*/i, '').trim();
      if (!clean) continue;

      const m = clean.match(/^(\d+)(?:\s*[/\\-]\s*([a-zA-Z0-9]+))?/i);
      if (m) {
        const base = m[1];
        const sub = m[2] ? m[2].replace(/\s+/g, '').toUpperCase() : null;
        tokens.add(base);
        if (sub) {
          tokens.add(`${base}/${sub}`);
          tokens.add(sub);
        }
      }
      tokens.add(clean.replace(/\s*[/\\-]\s*/g, '/').toUpperCase());
    }
  };

  addValue(record.surveyNumber);
  addValue(record.surveyNumbers);
  addValue(record.subdivisions);
  addValue(record.subdivision);

  return Array.from(tokens);
}

/**
 * Check whether a set of survey tokens matches a parsed survey query.
 * Ensures:
 * - Query "25" matches "25", "25/1", "25/1A", "25/2"
 * - Query "25" NEVER matches "125" or "250"
 * - Query "25/1A" prioritizes/matches that specific subdivision
 * 
 * @param {Array<string>} tokens - Candidate record's survey tokens
 * @param {Object} surveyQuery - Result of parseSurveyQuery()
 * @returns {boolean} True if candidate survey tokens match the query
 */
export function checkSurveyMatch(tokens, surveyQuery) {
  if (!tokens || tokens.length === 0 || !surveyQuery) return false;

  const targetBase = surveyQuery.base;
  const targetCanonical = surveyQuery.canonical;

  if (surveyQuery.isSpecificSubdivision) {
    // Exact or subdivision-specific match required
    return tokens.some((token) => {
      const normalized = token.toUpperCase();
      return (
        normalized === targetCanonical ||
        normalized === surveyQuery.sub ||
        normalized.startsWith(`${targetCanonical}/`)
      );
    });
  }

  // Base survey match (e.g. "25"):
  // Must match exact base "25" OR start with "25/" or "25-"
  // Must NOT match "125" or "250"
  return tokens.some((token) => {
    const normalized = token.toUpperCase();
    return (
      normalized === targetBase ||
      normalized.startsWith(`${targetBase}/`) ||
      normalized.startsWith(`${targetBase}-`)
    );
  });
}

/**
 * Safe substring search with word boundary protection for numbers
 * so that e.g. "25" does not accidentally match "1250" in text.
 */
function safeIncludesText(sourceText, queryTerm) {
  if (!sourceText || typeof sourceText !== 'string') return false;
  const s = sourceText.toLowerCase();
  const q = queryTerm.toLowerCase().trim();
  if (!q) return false;

  // If query is pure numeric, require word boundaries in source text
  if (/^\d+$/.test(q)) {
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${q}(?:[^a-zA-Z0-9]|$)`, 'i');
    return regex.test(s);
  }

  return s.includes(q);
}

/**
 * Evaluate whether a Property record matches a single query term,
 * returning match description if matched.
 */
export function evaluatePropertyTermMatch(property, term) {
  const surveyQuery = parseSurveyQuery(term);
  const lowerTerm = term.toLowerCase().trim();

  // 1. Survey match
  if (surveyQuery) {
    const tokens = extractSurveyTokens(property);
    if (checkSurveyMatch(tokens, surveyQuery)) {
      const displaySurvey = property.surveyNumber || (property.surveyNumbers && property.surveyNumbers[0]) || surveyQuery.canonical;
      return { matched: true, field: 'Survey', label: `Survey ${displaySurvey}` };
    }
  }

  // 2. Location match
  if (safeIncludesText(property.location, lowerTerm) || safeIncludesText(property.taluk, lowerTerm)) {
    return { matched: true, field: 'Location', label: `Location: ${property.location}` };
  }

  // 3. Property Name match
  if (safeIncludesText(property.name, lowerTerm)) {
    return { matched: true, field: 'Name', label: `Property: ${property.name}` };
  }

  // 4. Owner Name match
  if (safeIncludesText(property.owner, lowerTerm)) {
    return { matched: true, field: 'Owner', label: `Owner: ${property.owner}` };
  }

  // 5. Patta Number match
  if (safeIncludesText(property.pattaNumber, lowerTerm)) {
    return { matched: true, field: 'Patta', label: `Patta #${property.pattaNumber}` };
  }

  // 6. Notes / Category match
  if (safeIncludesText(property.notes, lowerTerm) || safeIncludesText(property.category, lowerTerm)) {
    return { matched: true, field: 'Notes', label: `Notes: ${lowerTerm}` };
  }

  return { matched: false };
}

/**
 * Evaluate whether a Document record (and its linked Property) matches a single query term,
 * returning match description if matched.
 */
export function evaluateDocumentTermMatch(document, linkedProperty, term) {
  const surveyQuery = parseSurveyQuery(term);
  const lowerTerm = term.toLowerCase().trim();

  // 1. Survey match (Document's own survey OR linked Property's survey)
  if (surveyQuery) {
    const docTokens = extractSurveyTokens(document);
    const propTokens = linkedProperty ? extractSurveyTokens(linkedProperty) : [];
    const combinedTokens = Array.from(new Set([...docTokens, ...propTokens]));

    if (checkSurveyMatch(combinedTokens, surveyQuery)) {
      const displaySurvey = document.surveyNumber || (linkedProperty && (linkedProperty.surveyNumber || linkedProperty.surveyNumbers?.[0])) || surveyQuery.canonical;
      return { matched: true, field: 'Survey', label: `Survey ${displaySurvey}` };
    }
  }

  // 2. Document Title / Name match
  if (safeIncludesText(document.name, lowerTerm) || safeIncludesText(document.title, lowerTerm) || safeIncludesText(document.fileName, lowerTerm)) {
    return { matched: true, field: 'Title', label: `Title: ${document.name || document.title}` };
  }

  // 3. Document Category / Type match (e.g. "sale deed", "patta", "ec", "encumbrance", "tax")
  if (safeIncludesText(document.documentType, lowerTerm) || safeIncludesText(document.type, lowerTerm) || safeIncludesText(document.category, lowerTerm)) {
    return { matched: true, field: 'Type', label: document.documentType || document.type || 'Document Type' };
  }

  // 4. Document Registration / Ref Number match
  if (safeIncludesText(document.documentNumber, lowerTerm) || safeIncludesText(document.docNumber, lowerTerm) || safeIncludesText(document.reference, lowerTerm)) {
    return { matched: true, field: 'Number', label: `Doc No: ${document.documentNumber || document.docNumber || document.reference}` };
  }

  // 5. Linked Property Location match
  if (linkedProperty && (safeIncludesText(linkedProperty.location, lowerTerm) || safeIncludesText(linkedProperty.taluk, lowerTerm))) {
    return { matched: true, field: 'Location', label: `Location: ${linkedProperty.location}` };
  }

  // 6. Linked Property Name match
  if (safeIncludesText(document.propertyName, lowerTerm) || (linkedProperty && safeIncludesText(linkedProperty.name, lowerTerm))) {
    return { matched: true, field: 'Property', label: `Property: ${document.propertyName || linkedProperty?.name}` };
  }

  // 7. Linked Property Owner match
  if (linkedProperty && safeIncludesText(linkedProperty.owner, lowerTerm)) {
    return { matched: true, field: 'Owner', label: `Owner: ${linkedProperty.owner}` };
  }

  // 8. Patta Number match (doc or linked property)
  if (safeIncludesText(document.pattaNumber, lowerTerm) || (linkedProperty && safeIncludesText(linkedProperty.pattaNumber, lowerTerm))) {
    const patta = document.pattaNumber || linkedProperty?.pattaNumber;
    return { matched: true, field: 'Patta', label: `Patta #${patta}` };
  }

  // 9. Document Notes / Archival safekeeping
  if (safeIncludesText(document.notes, lowerTerm) || safeIncludesText(document.description, lowerTerm)) {
    return { matched: true, field: 'Notes', label: `Notes: ${lowerTerm}` };
  }

  // 10. Important / Key document status
  if ((lowerTerm === 'important' || lowerTerm === 'key') && (document.isImportant || document.isKey)) {
    return { matched: true, field: 'Key', label: 'Key Document' };
  }

  return { matched: false };
}

/**
 * Execute Multi-Field Global Search with AND-logic across all query terms.
 * 
 * @param {Array<Object>} properties - All properties in database
 * @param {Array<Object>} documents - All documents in database
 * @param {string} query - Multi-term search input (e.g. "25, Avadi, sale deed")
 * @returns {Object} { matchedProperties: Array, matchedDocuments: Array, totalCount: number, terms: Array }
 */
export function executeGlobalSearch(properties = [], documents = [], query = '') {
  const terms = parseQueryTerms(query);

  if (terms.length === 0) {
    return {
      matchedProperties: properties,
      matchedDocuments: documents.map((doc) => {
        const linkedProp = properties.find((p) => p.id === doc.propertyId) || null;
        return { ...doc, linkedProperty: linkedProp, matchReasons: [] };
      }),
      totalCount: properties.length + documents.length,
      terms: [],
      isFiltered: false,
    };
  }

  // Create property map for quick lookup
  const propertyMap = new Map();
  properties.forEach((p) => propertyMap.set(String(p.id), p));

  // 1. Filter Properties (AND-logic: must match every term)
  const matchedProperties = [];
  for (const prop of properties) {
    const reasons = [];
    let matchesAll = true;

    for (const term of terms) {
      const result = evaluatePropertyTermMatch(prop, term);
      if (!result.matched) {
        matchesAll = false;
        break;
      }
      reasons.push(result.label);
    }

    if (matchesAll) {
      matchedProperties.push({
        ...prop,
        matchReasons: Array.from(new Set(reasons)),
      });
    }
  }

  // 2. Filter Documents (AND-logic: must match every term using document + linked property fields)
  const matchedDocuments = [];
  const seenDocIds = new Set();

  for (const doc of documents) {
    if (seenDocIds.has(doc.id)) continue;

    const linkedProp = propertyMap.get(String(doc.propertyId)) || null;
    const reasons = [];
    let matchesAll = true;

    for (const term of terms) {
      const result = evaluateDocumentTermMatch(doc, linkedProp, term);
      if (!result.matched) {
        matchesAll = false;
        break;
      }
      reasons.push(result.label);
    }

    if (matchesAll) {
      seenDocIds.add(doc.id);
      matchedDocuments.push({
        ...doc,
        linkedProperty: linkedProp,
        matchReasons: Array.from(new Set(reasons)),
      });
    }
  }

  return {
    matchedProperties,
    matchedDocuments,
    totalCount: matchedProperties.length + matchedDocuments.length,
    terms,
    isFiltered: true,
  };
}
