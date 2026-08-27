/* Optional remote collection of quiz responses (off by default).
   GitHub Pages has no backend, so responses are always kept in each visitor's
   localStorage (see analytics.html for the dashboard + JSON/CSV export).

   To ALSO collect every visitor's responses in one Google Sheet you own:
   1. Create a Google Form with exactly ONE question: a "Paragraph" question
      (its text can be anything, e.g. "payload").
   2. Click the three-dot menu → "Get pre-filled link", type X in the answer box,
      and copy the generated link. It looks like:
      https://docs.google.com/forms/d/e/FORM_ID/viewform?usp=pp_url&entry.123456789=X
   3. Fill the two values below from that link.
   4. In the Form's Responses tab, click the Sheets icon to link a spreadsheet —
      every quiz completion then lands there as one JSON row you can point
      Claude (or anything else) at.
*/
window.ANALYTICS_REMOTE = {
  formId: null,        // e.g. "1FAIpQLSc...long id..."
  entryId: null        // e.g. "entry.123456789"
};
