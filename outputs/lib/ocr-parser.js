/**
 * LandDoc Local OCR - Metadata Parsing Engine
 * Conservative heuristic parser for English & Tamil land records.
 * 
 * Rules:
 * - Never invent values; return empty string/null if not confidently matched.
 * - Do not treat arbitrary numbers as survey numbers without contextual evidence.
 * - Support both English and Tamil land administration terminology.
 */

/**
 * Clean and normalize OCR text for regex inspection
 * @param {string} text 
 * @returns {string}
 */
export function normalizeOcrText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Suggest document category based on textual evidence
 * @param {string} text 
 * @returns {string|null}
 */
export function extractDocumentType(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  // Patta / Chitta
  if (
    /(?:patta\s*\/?\s*chitta|chitta\s*extract|patta\s*passbook|patta\s*order|பட்டா\s*சிட்டா|நத்தம்\s*பட்டா|பட்டா\s*எண்)/i.test(text) ||
    /கிராம\s*கணக்கு\s*எண்\s*3/i.test(text)
  ) {
    return 'Patta / Chitta Extract';
  }

  // Encumbrance Certificate
  if (
    /(?:encumbrance\s*certificate|certificate\s*of\s*encumbrance|ec\s*statement|form\s*no\.?\s*15|form\s*no\.?\s*16|வில்லங்கச்\s*சான்று|வில்லங்க\s*சான்றிதழ்)/i.test(text)
  ) {
    return 'Encumbrance Certificate (EC)';
  }

  // Property Tax
  if (
    /(?:property\s*tax|tax\s*receipt|kist\s*receipt|corporation\s*tax|municipality\s*tax|சொத்து\s*வரி|நில\s*வரி\s*ரசீது|கிஸ்தி\s*ரசீது)/i.test(text)
  ) {
    return 'Property Tax Receipt';
  }

  // Field Measurement Book (FMB)
  if (
    /(?:field\s*measurement\s*book|fmb\s*sketch|fmb\s*extract|புல\s*வரைபடம்|நில\s*அளவை\s*வரைபடம்)/i.test(text)
  ) {
    return 'Field Measurement Book (FMB)';
  }

  // Settlement or Partition Deed
  if (
    /(?:settlement\s*deed|partition\s*deed|deed\s*of\s*partition|பாகப்\s*பிரிவினை|செட்டில்மெண்ட்\s*பத்திரம்|தான\s*பத்திரம்)/i.test(text)
  ) {
    return 'Settlement / Partition Deed';
  }

  // Adangal Extract
  if (
    /(?:adangal|adangal\s*extract|அடங்கல்\s*பதிவு|அடங்கல்)/i.test(text)
  ) {
    return 'Adangal Extract';
  }

  // Layout Approval
  if (
    /(?:layout\s*approval|dtcp\s*approval|cmda\s*approved|planning\s*permission|மனைப்பிரிவு\s*அனுமதி)/i.test(text)
  ) {
    return 'Layout Approval / Order';
  }

  // Power of Attorney
  if (
    /(?:power\s*of\s*attorney|general\s*power|பொது\s*அதிகாரப்\s*பத்திரம்)/i.test(text)
  ) {
    return 'Power of Attorney';
  }

  // Registered Sale Deed
  if (
    /(?:sale\s*deed|conveyance\s*deed|deed\s*of\s*sale|registered\s*sale\s*deed|கிரையப்\s*பத்திரம்|கிரய\s*பத்திரம்|விற்பனை\s*பத்திரம்)/i.test(text)
  ) {
    return 'Registered Sale Deed';
  }

  return null;
}

/**
 * Extract survey number with conservative boundary rules
 * @param {string} text 
 * @returns {{ surveyNumber: string|null, subdivision: string|null }}
 */
export function extractSurveyNumber(text) {
  if (!text) return { surveyNumber: null, subdivision: null };

  // 1. Explicit labeled markers:
  // "Survey No. 25/1A", "Survey: 25/1A", "Sy No. 25/1A", "S.No: 142/3", "S.F.No. 10", "T.S.No. 5", "புல எண் 25/1A", "சர்வே எண்: 101/2"
  const explicitPattern = /(?:(?:town\s*survey|survey|sy\.?|s\.?\s*f\.?|r\.?\s*s\.?|t\.?\s*s\.?|s\.?)\s*(?:no\.?|number|#|nos\.?)?|புல\s*எண்|சர்வே\s*எண்|மறு\s*அளவை\s*எண்|நில\s*அளவை\s*எண்)\s*[:.\-]?\s*([0-9]{1,4}(?:\s*[\/\-]\s*[0-9A-Za-z]{1,4})?)\b/i;
  const explicitMatch = text.match(explicitPattern);

  if (explicitMatch && explicitMatch[1]) {
    const rawVal = explicitMatch[1].replace(/\s+/g, '');
    const parts = rawVal.split(/[\/\-]/);
    return {
      surveyNumber: rawVal,
      subdivision: parts.length > 1 ? parts.slice(1).join('/') : null,
    };
  }

  // 2. Contextual pattern: parcel notation like "25/1A" or "142/3" near land/property keywords
  const contextPattern = /(?:comprised\s*in|schedule\s*(?:of\s*property)?|boundaries|land|property|parcel|village|plot|extent|நிலத்தின்\s*அமைவிடம்|அளவை)[\s\S]{1,120}?\b([0-9]{1,4}\/[0-9A-Za-z]{1,4})\b/i;
  const contextMatch = text.match(contextPattern);

  if (contextMatch && contextMatch[1]) {
    const rawVal = contextMatch[1].replace(/\s+/g, '');
    const parts = rawVal.split('/');
    return {
      surveyNumber: rawVal,
      subdivision: parts[1] || null,
    };
  }

  return { surveyNumber: null, subdivision: null };
}

/**
 * Extract Patta Number
 * @param {string} text 
 * @returns {string|null}
 */
export function extractPattaNumber(text) {
  if (!text) return null;

  // "Patta No. 1248", "Patta # 452", "Patta: 894", "Patta Passbook No: 1248", "பட்டா எண்: 894", "பட்டா: 894"
  const pattern = /(?:patta(?:\s*passbook)?\s*(?:no\.?|number|#)?|பட்டா(?:\s*எண்)?)\s*[:.\-]?\s*([0-9]{1,6})\b/i;
  const match = text.match(pattern);
  return match && match[1] ? match[1].trim() : null;
}

/**
 * Extract Document Number / Registered Deed Number
 * @param {string} text 
 * @returns {string|null}
 */
export function extractDocumentNumber(text) {
  if (!text) return null;

  // Pattern with year: "Doc No. 412/1998", "Document No. 412 of 1998", "Deed No. 1254/2015", "ஆவண எண் 412/1998"
  const patternWithYear = /(?:(?:doc(?:ument)?|deed|reg(?:istration)?)\s*(?:no\.?|number|#)?|ஆவண\s*எண்|பத்திர\s*எண்|பதிவு\s*எண்)\s*[:.\-]?\s*([0-9]{1,6})\s*(?:[\/\-]|of)\s*((?:19|20)[0-9]{2})\b/i;
  const matchWithYear = text.match(patternWithYear);
  if (matchWithYear && matchWithYear[1] && matchWithYear[2]) {
    return `${matchWithYear[1].trim()}/${matchWithYear[2].trim()}`;
  }

  // Standard Doc No with slash: "Doc No. 412/1998"
  const patternWithSlash = /(?:doc(?:ument)?\.?\s*(?:no\.?|number|#)|deed\s*no\.?|ஆவண\s*எண்|பத்திர\s*எண்)\s*[:.\-]?\s*([0-9]{1,6}\s*[\/\-]\s*(?:19|20)[0-9]{2})\b/i;
  const matchWithSlash = text.match(patternWithSlash);
  if (matchWithSlash && matchWithSlash[1]) {
    return matchWithSlash[1].replace(/\s+/g, '');
  }

  // Standalone document number: "Doc No. 412", "Doc # 412", "ஆவண எண் 412"
  const patternStandalone = /(?:doc(?:ument)?\.?\s*(?:no\.?|number|#)|deed\s*no\.?|ஆவண\s*எண்|பத்திர\s*எண்)\s*[:.\-]?\s*([0-9]{1,6})\b/i;
  const matchStandalone = text.match(patternStandalone);
  if (matchStandalone && matchStandalone[1]) {
    return matchStandalone[1].trim();
  }

  return null;
}

/**
 * Extract Owner / Purchaser / Pattadhar name
 * @param {string} text 
 * @returns {string|null}
 */
export function extractOwnerName(text) {
  if (!text) return null;

  // Tamil: பட்டாதாரர் பெயர்: கந்தசாமி அல்லது உரிமையாளர் பெயர்: திரு. கந்தசாமி
  const tamilPattern = /(?:பட்டாதாரர்(?:\s*பெயர்)?|உரிமையாளர்(?:\s*பெயர்)?|கிரயதாரர்|வாங்குபவர்)\s*[:.\-]?\s*(?:திரு\.?|திருமதி\.?|செல்வி\.?)?\s*([\u0B80-\u0BFF\s.]{3,35})(?:\n|,|$)/;
  const tamilMatch = text.match(tamilPattern);
  if (tamilMatch && tamilMatch[1]) {
    const cleaned = tamilMatch[1].replace(/^(?:திரு\.?|திருமதி\.?|செல்வி\.?)\s*/, '').trim();
    if (cleaned.length >= 2) return cleaned;
  }

  // English: "Pattadhar Name: K. Raman", "In favour of: S. Deepan", "Purchaser: M. Suresh"
  const engPattern = /(?:pattadhar(?:\s*name)?|owner(?:\s*name)?|purchaser|in\s*favour\s*of|vendee)\s*[:.\-]?\s*(?:mr\.?|mrs\.?|thiru\.?)?\s*([A-Za-z\s.]{3,35})(?:\n|,|$)/i;
  const engMatch = text.match(engPattern);
  if (engMatch && engMatch[1]) {
    const cleaned = engMatch[1].replace(/^(?:mr\.?|mrs\.?|thiru\.?)\s*/i, '').trim();
    if (cleaned.length >= 2) return cleaned;
  }

  return null;
}

/**
 * Extract Property Location / Village / Taluk
 * @param {string} text 
 * @returns {string|null}
 */
export function extractLocation(text) {
  if (!text) return null;

  // Tamil village / taluk
  const tamilPattern = /(?:கிராமம்|வட்டம்|வருவாய்\s*கிராமம்)\s*[:.\-]?\s*([\u0B80-\u0BFF\s]{3,30})(?:\n|,|$)/;
  const tamilMatch = text.match(tamilPattern);
  if (tamilMatch && tamilMatch[1]) {
    return tamilMatch[1].trim();
  }

  // English village / taluk / district
  const engPattern = /(?:revenue\s*village|village|taluk|district)\s*[:.\-]?\s*([A-Za-z\s]{3,30})(?:\n|,|$)/i;
  const engMatch = text.match(engPattern);
  if (engMatch && engMatch[1]) {
    return engMatch[1].trim();
  }

  return null;
}

/**
 * Extract Sub-Registrar Office (SRO)
 * @param {string} text 
 * @returns {string|null}
 */
export function extractSroOffice(text) {
  if (!text) return null;

  // "SRO Poonamallee", "Sub-Registrar Office, Avadi", "சார் பதிவாளர் அலுவலகம் ஆவடி"
  const sroPattern = /(?:sub[\s\-]*registrar(?:\s*office)?|sro|joint[\s\-]*sro|சார்\s*பதிவாளர்\s*அலுவலகம்)\s*[:.\-,]?\s*([A-Za-z\s]{3,30}|[\u0B80-\u0BFF\s]{3,30})(?:\n|,|$)/i;
  const match = text.match(sroPattern);
  if (match && match[1]) {
    const raw = match[1].trim();
    return raw.startsWith('SRO ') ? raw : `SRO ${raw}`;
  }

  return null;
}

/**
 * Extract Registration Date
 * @param {string} text 
 * @returns {string|null} YYYY-MM-DD or readable date
 */
export function extractRegistrationDate(text) {
  if (!text) return null;

  // Date with registration context
  const regPattern = /(?:registered\s*(?:on|date)|date\s*of\s*registration|reg\.?\s*date|பதிவு\s*நாள்|தேதி)\s*[:.\-]?\s*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.](?:19|20)[0-9]{2}|(?:19|20)[0-9]{2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{1,2})\b/i;
  const match = text.match(regPattern);
  if (match && match[1]) {
    const rawDate = match[1];
    // Normalize to YYYY-MM-DD if DD/MM/YYYY
    const dmy = rawDate.match(/^([0-9]{1,2})[\/\-.]([0-9]{1,2})[\/\-.]([0-9]{4})$/);
    if (dmy) {
      const day = dmy[1].padStart(2, '0');
      const month = dmy[2].padStart(2, '0');
      const year = dmy[3];
      return `${year}-${month}-${day}`;
    }
    return rawDate;
  }

  return null;
}

/**
 * Extract Land Extent / Area
 * @param {string} text 
 * @returns {string|null}
 */
export function extractExtent(text) {
  if (!text) return null;

  // Contextual pattern with label: "பரப்பளவு: 2.50 ஏக்கர்", "Extent: 1200 sq.ft"
  const labeledPattern = /(?:extent|area|பரப்பளவு|அளவை|நிலப்பரப்பு)\s*[:.\-]?\s*([0-9]+(?:\.[0-9]+)?\s*(?:sq\.?\s*ft|sq\.?\s*feet|cents?|acres?|are|hectares?|சென்ட்|ஏக்கர்|சதுர\s*அடி|குழி))/i;
  const labeledMatch = text.match(labeledPattern);
  if (labeledMatch && labeledMatch[1]) {
    return labeledMatch[1].trim();
  }

  const extentPattern = /(?:^|\s)([0-9]+(?:\.[0-9]+)?\s*(?:sq\.?\s*ft|sq\.?\s*feet|cents?|acres?|are|hectares?|சென்ட்|ஏக்கர்|சதுர\s*அடி|குழி))/i;
  const match = text.match(extentPattern);
  return match && match[1] ? match[1].trim() : null;
}

/**
 * Extract Consideration / Stamp Value
 * @param {string} text 
 * @returns {string|null}
 */
export function extractConsideration(text) {
  if (!text) return null;

  const valuePattern = /(?:consideration|sale\s*price|market\s*value|தொகை|மதிப்பு)\s*[:.\-]?\s*(?:rs\.?|₹|inr)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)/i;
  const match = text.match(valuePattern);
  return match && match[1] ? `₹${match[1].trim()}` : null;
}

/**
 * Master parser: takes raw OCR text and produces a conservative suggested metadata object
 * @param {string} rawText 
 * @returns {Object} suggestions, confidences, rawText
 */
export function parseLandDocumentMetadata(rawText) {
  const normalized = normalizeOcrText(rawText);
  if (!normalized) {
    return {
      rawText: '',
      hasExtraction: false,
      suggestions: {
        documentType: null,
        title: null,
        surveyNumber: null,
        subdivision: null,
        pattaNumber: null,
        documentNumber: null,
        ownerName: null,
        location: null,
        sroOffice: null,
        regDate: null,
        extent: null,
        consideration: null,
        notes: null,
      },
    };
  }

  const docType = extractDocumentType(normalized);
  const { surveyNumber, subdivision } = extractSurveyNumber(normalized);
  const pattaNumber = extractPattaNumber(normalized);
  const docNumber = extractDocumentNumber(normalized);
  const ownerName = extractOwnerName(normalized);
  const location = extractLocation(normalized);
  const sroOffice = extractSroOffice(normalized);
  const regDate = extractRegistrationDate(normalized);
  const extent = extractExtent(normalized);
  const consideration = extractConsideration(normalized);

  // Suggested Document Title
  let title = null;
  if (docType) {
    if (surveyNumber) {
      title = `${docType} - Survey ${surveyNumber}`;
    } else if (docNumber) {
      title = `${docType} (${docNumber})`;
    } else {
      title = docType;
    }
  } else if (surveyNumber) {
    title = `Property Document - Survey ${surveyNumber}`;
  } else if (docNumber) {
    title = `Property Document (${docNumber})`;
  }

  // Compile archival notes
  const notesParts = [];
  if (sroOffice) notesParts.push(`SRO: ${sroOffice}`);
  if (regDate) notesParts.push(`Reg Date: ${regDate}`);
  if (extent) notesParts.push(`Extent: ${extent}`);
  if (consideration) notesParts.push(`Consideration: ${consideration}`);
  if (ownerName) notesParts.push(`Pattadhar/Owner: ${ownerName}`);
  const notes = notesParts.length > 0 ? notesParts.join(' • ') : null;

  const suggestions = {
    documentType: docType,
    title,
    surveyNumber,
    subdivision,
    pattaNumber,
    documentNumber: docNumber,
    ownerName,
    location,
    sroOffice,
    regDate,
    extent,
    consideration,
    notes,
  };

  const matchedCount = Object.values(suggestions).filter(Boolean).length;

  return {
    rawText: normalized,
    hasExtraction: matchedCount > 0,
    matchedCount,
    suggestions,
  };
}
