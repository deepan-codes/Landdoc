'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { properties } from '@/mockData';

function AddPropertyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams ? searchParams.get('edit') : null;
  const existingProp = editId ? properties.find((p) => p.id === editId) : null;

  // Form State
  const [propertyName, setPropertyName] = useState(existingProp ? existingProp.name : 'Avadi Land');
  const [location, setLocation] = useState(existingProp ? existingProp.location : 'Avadi, Chennai');
  const [ownerName, setOwnerName] = useState('Sundaram V.');
  const [pattaNumber, setPattaNumber] = useState(existingProp?.pattaNumber || '1845');
  const [notes, setNotes] = useState(
    'Canara Bank safe locker custody, inherited through 1974 settlement deed, original parent documents preserved in steel trunk at native home...'
  );

  // Survey Numbers & Sub-Divisions State
  const [surveys, setSurveys] = useState(
    existingProp
      ? [
          {
            id: '1',
            number: existingProp.surveyNumber,
            subdivisions: existingProp.subdivisions || [],
          },
        ]
      : [
          { id: '1', number: '25', subdivisions: ['25/1A', '25/1B', '25/2A'] },
          { id: '2', number: '26', subdivisions: ['26/1'] },
        ]
  );

  // Adding new survey state
  const [isAddingSurvey, setIsAddingSurvey] = useState(false);
  const [newSurveyNumber, setNewSurveyNumber] = useState('');
  const [newSubdivisions, setNewSubdivisions] = useState('');

  // Inline subdivision addition state
  const [activeSubdivSurveyId, setActiveSubdivSurveyId] = useState(null);
  const [inlineSubdivValue, setInlineSubdivValue] = useState('');

  // Validation / Feedback
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Remove entire survey number
  const handleRemoveSurvey = (id) => {
    setSurveys((prev) => prev.filter((s) => s.id !== id));
  };

  // Remove individual subdivision
  const handleRemoveSubdivision = (surveyId, subdivToRemove) => {
    setSurveys((prev) =>
      prev.map((s) => {
        if (s.id === surveyId) {
          return {
            ...s,
            subdivisions: s.subdivisions.filter((sub) => sub !== subdivToRemove),
          };
        }
        return s;
      })
    );
  };

  // Add new survey number block
  const handleAddSurvey = (e) => {
    e.preventDefault();
    if (!newSurveyNumber.trim()) return;

    const parsedSubdivs = newSubdivisions
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newEntry = {
      id: Date.now().toString(),
      number: newSurveyNumber.trim(),
      subdivisions: parsedSubdivs.length > 0 ? parsedSubdivs : [`${newSurveyNumber.trim()}/1`],
    };

    setSurveys((prev) => [...prev, newEntry]);
    setNewSurveyNumber('');
    setNewSubdivisions('');
    setIsAddingSurvey(false);
    if (errors.surveys) {
      setErrors((prev) => ({ ...prev, surveys: null }));
    }
  };

  // Add inline subdivision
  const handleAddInlineSubdivision = (surveyId) => {
    if (!inlineSubdivValue.trim()) {
      setActiveSubdivSurveyId(null);
      return;
    }

    setSurveys((prev) =>
      prev.map((s) => {
        if (s.id === surveyId) {
          if (!s.subdivisions.includes(inlineSubdivValue.trim())) {
            return {
              ...s,
              subdivisions: [...s.subdivisions, inlineSubdivValue.trim()],
            };
          }
        }
        return s;
      })
    );

    setInlineSubdivValue('');
    setActiveSubdivSurveyId(null);
  };

  // Save Property
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!propertyName.trim()) {
      newErrors.propertyName = 'Property name is required';
    }
    if (!location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (surveys.length === 0) {
      newErrors.surveys = 'At least one survey number is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitted(true);
    setTimeout(() => {
      router.push(existingProp ? `/properties/${existingProp.id}` : '/properties');
    }, 800);
  };

  return (
    <div className="max-w-[760px] mx-auto py-4 sm:py-8">
      {/* Top Folio Entry Tag */}
      <div className="flex items-center gap-2 mb-2">
        <svg
          className="w-4 h-4 text-[#B8893B]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
          />
        </svg>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#967035]">
          Ancestral Land Registry • Folio Entry
        </span>
      </div>

      {/* Main Title & Subtitle */}
      <h1 className="text-3xl sm:text-4xl font-serif text-text-primary font-normal leading-tight mb-2">
        {existingProp ? 'Edit property details' : 'Add a property'}
      </h1>
      <p className="text-sm sm:text-base text-text-muted mb-6 sm:mb-8">
        {existingProp
          ? `Update recorded parcel boundaries, patta registration, and safekeeping folio for ${existingProp.name}.`
          : 'Create a private archival folder for a land parcel or family home.'}
      </p>

      {/* Success Notification */}
      {isSubmitted && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">
            Property saved successfully! Redirecting to dashboard...
          </span>
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-border rounded-xl p-5 sm:p-8 space-y-7 shadow-subtle">
          {/* 1. Basic Details */}
          <div className="space-y-4">
            {/* Property Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="propertyName" className="text-xs sm:text-sm font-semibold text-text-primary">
                  Property name <span className="text-danger">*</span>
                </label>
                <span className="text-xs text-text-muted">
                  Identifiable folio name
                </span>
              </div>
              <input
                id="propertyName"
                type="text"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="e.g. Avadi Land or Family House"
                className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-none focus:border-green-dark transition-colors ${
                  errors.propertyName ? 'border-danger' : 'border-border'
                }`}
              />
              {errors.propertyName && (
                <p className="text-xs text-danger mt-1">{errors.propertyName}</p>
              )}
            </div>

            {/* Location / Village / Taluk */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="location" className="text-xs sm:text-sm font-semibold text-text-primary">
                  Location / Village / Taluk <span className="text-danger">*</span>
                </label>
                <span className="text-xs text-text-muted">
                  Sub-registrar jurisdiction
                </span>
              </div>
              <div className="relative">
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Avadi, Chennai"
                  className={`w-full pl-3.5 pr-10 py-2.5 text-sm bg-white border rounded-lg focus:outline-none focus:border-green-dark transition-colors ${
                    errors.location ? 'border-danger' : 'border-border'
                  }`}
                />
                <svg
                  className="w-4 h-4 text-text-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
              </div>
              {errors.location && (
                <p className="text-xs text-danger mt-1">{errors.location}</p>
              )}
            </div>
          </div>

          <hr className="border-border/70" />

          {/* 2. Survey Numbers & Sub-Divisions */}
          <div>
            <div className="mb-3">
              <h2 className="text-sm sm:text-base font-serif font-semibold text-text-primary">
                Survey Numbers & Sub-Divisions <span className="text-danger font-sans text-xs sm:text-sm">*</span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Constituent survey parcels cataloged in revenue records and sale deeds.
              </p>
            </div>

            {/* List of Survey Blocks */}
            <div className="space-y-2.5 mb-3">
              {surveys.map((survey) => (
                <div
                  key={survey.id}
                  className="bg-[#F8F6F2] border border-border/80 rounded-lg p-3 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  {/* Left: Icon, Number & Sub-Division Chips */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 min-w-0">
                    {/* Register Icon */}
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-text-muted flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                      <span className="text-xs sm:text-sm font-semibold text-text-primary whitespace-nowrap">
                        Survey No. {survey.number}
                      </span>
                    </div>

                    {/* Sub-Division Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 ml-1">
                      {survey.subdivisions.map((subdiv) => (
                        <span
                          key={subdiv}
                          className="bg-[#EAE6DE] text-text-primary text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1 group/chip"
                        >
                          <span>{subdiv}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubdivision(survey.id, subdiv)}
                            className="text-text-muted hover:text-danger ml-0.5 transition-colors"
                            title={`Remove subdivision ${subdiv}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      {/* Add Inline Sub-division */}
                      {activeSubdivSurveyId === survey.id ? (
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="e.g. 25/3"
                            value={inlineSubdivValue}
                            onChange={(e) => setInlineSubdivValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddInlineSubdivision(survey.id);
                              } else if (e.key === 'Escape') {
                                setActiveSubdivSurveyId(null);
                              }
                            }}
                            className="w-20 px-1.5 py-0.5 text-xs bg-white border border-border rounded focus:outline-none focus:border-green-dark"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleAddInlineSubdivision(survey.id)}
                            className="text-xs text-green-dark hover:underline font-semibold"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveSubdivSurveyId(null)}
                            className="text-xs text-text-muted hover:text-danger"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSubdivSurveyId(survey.id);
                            setInlineSubdivValue('');
                          }}
                          className="text-[11px] text-green-dark hover:text-green-900 font-medium px-1.5 py-0.5 rounded border border-dashed border-green-dark/30 hover:border-green-dark transition-colors"
                          title="Add sub-division"
                        >
                          + sub-div
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Remove Entire Survey Row */}
                  <button
                    type="button"
                    onClick={() => handleRemoveSurvey(survey.id)}
                    className="text-text-muted hover:text-danger p-1 transition-colors ml-auto"
                    title={`Remove Survey No. ${survey.number}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Error if no surveys */}
            {errors.surveys && (
              <p className="text-xs text-danger mb-2">{errors.surveys}</p>
            )}

            {/* Add New Survey Form / Button */}
            {isAddingSurvey ? (
              <div className="bg-[#FAF8F5] border border-border rounded-lg p-3.5 space-y-3 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary">
                    New Survey Parcel Details
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingSurvey(false)}
                    className="text-xs text-text-muted hover:text-text-primary"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted block mb-1">
                      Survey Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 27"
                      value={newSurveyNumber}
                      onChange={(e) => setNewSurveyNumber(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-border rounded focus:outline-none focus:border-green-dark"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">
                      Sub-Divisions (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 27/1, 27/2A"
                      value={newSubdivisions}
                      onChange={(e) => setNewSubdivisions(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-border rounded focus:outline-none focus:border-green-dark"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingSurvey(false)}
                    className="px-3 py-1 text-xs border border-border rounded text-text-muted hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSurvey}
                    className="px-3.5 py-1 text-xs bg-green-dark text-white rounded font-medium hover:bg-opacity-90"
                  >
                    Add Survey
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingSurvey(true)}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-green-dark hover:text-green-900 transition-colors pt-1"
              >
                <svg
                  className="w-4 h-4 text-green-dark"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Add another survey number</span>
              </button>
            )}
          </div>

          <hr className="border-border/70" />

          {/* 3. Optional Details */}
          <div className="space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-serif font-semibold text-text-primary">
                Optional Details
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Supplementary custodial references to preserve ancestral lineage.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Owner Name */}
              <div>
                <label htmlFor="ownerName" className="text-xs sm:text-sm font-medium text-text-primary block mb-1.5">
                  Registered owner / Executant name
                </label>
                <input
                  id="ownerName"
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Sundaram V."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark transition-colors"
                />
              </div>

              {/* Patta Number */}
              <div>
                <label htmlFor="pattaNumber" className="text-xs sm:text-sm font-medium text-text-primary block mb-1.5">
                  Revenue Patta number (if assigned)
                </label>
                <input
                  id="pattaNumber"
                  type="text"
                  value={pattaNumber}
                  onChange={(e) => setPattaNumber(e.target.value)}
                  placeholder="e.g. 1845"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark transition-colors"
                />
              </div>
            </div>

            {/* Custodial Notes */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="notes" className="text-xs sm:text-sm font-medium text-text-primary">
                  Custodial notes or historical background
                </label>
                <span className="text-xs text-text-muted">
                  Physical document locations
                </span>
              </div>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Canara Bank safe locker custody, inherited through 1974 settlement deed, original parent documents preserved in steel trunk at native home..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark transition-colors placeholder:text-text-muted/60"
              />
            </div>
          </div>

          {/* 4. Archival record stored locally callout */}
          <div className="bg-[#F8F6F2] border border-border/80 rounded-xl p-3.5 sm:p-4 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-[#B8893B] flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-text-primary leading-tight">
                Archival record stored locally
              </h3>
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                Data remains unindexed across public cloud directories and is archived exclusively to your device storage partition.
              </p>
            </div>
          </div>

          {/* 5. Form Actions: Cancel & Prominent Save Button */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 text-sm text-text-muted hover:text-text-primary py-2.5 px-4 transition-colors"
            >
              <span>←</span>
              <span>Cancel</span>
            </Link>

            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3 sm:py-2.5 bg-green-dark text-white text-sm font-medium rounded-lg hover:bg-[#134e3b] active:scale-[0.99] shadow-xs transition-all text-center"
            >
              Save property
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function AddPropertyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted">Loading property form...</div>}>
      <AddPropertyForm />
    </Suspense>
  );
}
