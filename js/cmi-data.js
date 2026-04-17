/* ============================================================
   ADCB Open Finance — CMI Dashboard Data
   All screen definitions, ACs, gaps, and RST test scenarios
   ============================================================ */

var CMI_SCREENS = {
  cmi01:{
    id:'CMI-01', name:'Current Consents Screen', type:'fe',
    story:{
      as:'TPP development portal user',
      want:'to view all current (active) Open Finance consents that ADCB holds as a TPP across connected LFIs in English and Arabic',
      so:'the CMI dashboard shows live consent status, LFI details, consent type, permissions, and expiry information for operational monitoring and CBUAE compliance'
    },
    what:[
      {icon:'\uD83D\uDCCB', text:'<strong>Default landing page</strong> of the CMI Dashboard. Opens automatically when the user logs in.'},
      {icon:'\uD83C\uDFE6', text:'Shows a list of consents in <strong>Authorized</strong> state, sorted by most recent consent ID first.'},
      {icon:'\uD83D\uDCCA', text:'A <strong>stat strip</strong> at the top shows live counts: Authorized, Suspended, Expiring within 30 days, and total.'},
      {icon:'\u26A0\uFE0F', text:'Any consent expiring <strong>within 30 days</strong> is highlighted in orange with a warning icon.'},
      {icon:'\uD83D\uDD0D', text:'User can <strong>search</strong> by LFI name or Account/IBAN, and <strong>filter</strong> by status, type, or LFI.'},
      {icon:'\uD83D\uDCC4', text:'Pagination shows <strong>10 consents per page</strong> with page number controls.'},
    ],
    feACs:[
      {id:'AC-01', note:'CMI-01 confirmed update: includes Authorized state. Summary strip counts must match actual data.',
        given:'the user navigates to the CMI Dashboard',
        when:'the Current Consents tab loads',
        then:'all consents in Authorized state are displayed with correct status badges and the summary strip shows accurate counts'},
      {id:'AC-02', note:'The mechanism for refresh is not defined \u2014 polling, WebSocket, or manual. This is an open gap.',
        given:'an LFI customer has authorized a new consent via CAAP',
        when:'the Current Consents screen refreshes',
        then:'the new consent appears in the list within 30 seconds of authorization'},
      {id:'AC-03',
        given:'a consent has fewer than 30 days until expiry',
        when:'displayed in the list',
        then:'the Permission Expires cell is highlighted in orange with a warning icon'},
      {id:'AC-04',
        given:'a consent is of type Combined (2 RAR objects)',
        when:'the row renders',
        then:'the Consent Type column shows a Combined badge with both permission types'},
      {id:'AC-05', note:'Confirmed: Consent ID masked as ****XXXX on all screens including CMI-04.',
        given:'the user clicks the Consent ID link (showing last 4 digits ****XXXX)',
        when:'the detail panel opens',
        then:'it navigates to CMI-04 with the correct consent loaded'},
      {id:'AC-06',
        given:'the summary strip shows the Expiring Within 30 Days count',
        when:'the user clicks the tile',
        then:'the list filters to show only those expiring consents and the result count updates'},
      {id:'AC-07',
        given:'the API Hub is unreachable',
        when:'the screen attempts to load',
        then:'a retry banner is shown and any cached data is displayed with a Stale Data indicator'},
      {id:'AC-08',
        given:'the user has zero active consents',
        when:'the screen loads',
        then:'an empty state message is shown with the text "No active consents found"'},
    ],
    gaps:[
      {id:'GAP-01',sev:'high',title:'No AC for Arabic / RTL support',
        what:'The user story says "in English and Arabic" but zero ACs cover language switching, right-to-left layout, or Arabic text rendering.',
        risk:'CBUAE requires bilingual support. Without an AC, there is no definition of done for Arabic \u2014 it could ship untested.',
        fix:'Add ACs covering: language toggle, RTL layout flip, Arabic bank name display, and date formatting in Arabic locale.'},
      {id:'GAP-02',sev:'high',title:'30-second refresh has no defined mechanism',
        what:'AC-02 says a new consent must appear within 30 seconds but does not say whether this happens via auto-polling, WebSocket push, or manual browser refresh.',
        risk:'Dev and QA will make different assumptions. The SLA cannot be reliably tested without knowing the mechanism.',
        fix:'Confirm and document the refresh mechanism in AC-02. Example: "via polling every 15 seconds."'},
      {id:'GAP-03',sev:'medium',title:'Search fields not fully confirmed',
        what:'The confirmed team answer says search by LFI name and Account/IBAN \u2014 but AC-07 in the original also mentioned searching by consent ID. These conflict.',
        risk:'Search may be built for the wrong fields. Operators will not be able to find consents the way they expect.',
        fix:'AC-07 updated in this document to: search by LFI name or Account/IBAN. Confirm and close.'},
      {id:'GAP-04',sev:'medium',title:'Suspend action has no AC',
        what:'Each consent card shows a Suspend button but there are no ACs for what happens when Suspend is clicked \u2014 no confirmation dialog, no state change behaviour, no feedback.',
        risk:'Suspend will be built without a testable definition of done. Behaviour may differ from Revoke in unexpected ways.',
        fix:'Add ACs: clicking Suspend \u2192 confirmation dialog \u2192 on confirm, consent state changes to Suspended \u2192 LFI notified.'},
      {id:'GAP-05',sev:'low',title:'LFI logo fallback not in any AC',
        what:'The team confirmed: fallback = initials or minimum resolution image. But no AC captures this.',
        risk:'If a logo fails in production, there is no agreed expected behaviour and no test to catch a broken fallback.',
        fix:'Add AC: given LFI logo fails to load, when the card renders, then LFI initials are shown as fallback avatar.'},
    ],
    rst:[
      {id:'T-01',level:'integration',title:'Screen cards exactly match what the API returned \u2014 nothing added or removed',
        why:'The most fundamental trust question: is what you see on screen actually what the API returned? If the screen silently adds, removes, or changes records, every compliance decision based on it is wrong.',
        steps:[
          {do:'Load the screen while watching network requests in browser developer tools.',expect:'A GET /consents API call is made with status=Authorized.'},
          {do:'Count the consent cards shown on page 1 of the screen.',expect:'Count matches the totalResults value in the API response.'},
          {do:'Pick any card and compare the Consent ID (****XXXX), LFI name, IBAN, and expiry date against the raw API data.',expect:'Every field matches exactly \u2014 no rounding, no extra data, no missing data beyond the agreed masking.'},
        ],
        impact:'If this fails, operators cannot trust the dashboard for compliance monitoring. Decisions could be made on wrong data.'},
      {id:'T-02',level:'system',title:'Expiry warning fires correctly at the 30-day boundary \u2014 not before, not after',
        why:'The orange warning is how operators know to act before a consent expires. If it fires too early they get false alarms. If it fires too late they miss real expiries.',
        steps:[
          {do:'Create test consents expiring in: 29 days, 30 days exactly, and 31 days.',expect:'Three consent cards visible on screen.'},
          {do:'Check which cards show the orange highlight and warning icon.',expect:'29-day card: orange + warning. 30-day card: orange + warning (\u226430 means 30 is included). 31-day card: no highlight.'},
          {do:'Change the configurable threshold to 14 days and reload.',expect:'Only the 29-day card now shows warning. The 30-day card has no highlight.'},
        ],
        impact:'Wrong boundary means operators miss real expiries or investigate false alarms \u2014 both cause compliance risk.'},
      {id:'T-03',level:'system',title:'API goes down \u2014 screen shows a banner and cached data, not a blank page or crash',
        why:'Outages happen. If the screen crashes when the API is unavailable, operators lose all visibility at the worst possible moment \u2014 during an incident.',
        steps:[
          {do:'Block the API Hub endpoint so the backend cannot reach it.',expect:'No response received from API Hub.'},
          {do:'Navigate to the Current Consents screen.',expect:'Screen does not crash. A yellow retry banner appears.'},
          {do:'Check whether the last-known consent list is visible.',expect:'Cached consents are shown. A "Stale Data" label is clearly visible.'},
        ],
        impact:'Without a stale data fallback, a 10-minute API outage makes the entire consent list invisible to operators.'},
      {id:'T-04',level:'uat',title:'A person who has never seen this screen can find a consent about to expire within 60 seconds',
        why:'This screen is a compliance monitoring tool. If operators struggle to find what they need, they will miss critical actions.',
        steps:[
          {do:'Give someone who has never used the CMI dashboard access. Ask: "Which consent expires soonest?"',expect:'They identify the orange-highlighted consent within 60 seconds without help.'},
          {do:'Ask: "How many consents are expiring within 30 days?"',expect:'They find the stat strip and read the correct count.'},
          {do:'Ask: "What would you do if you wanted to find all consents from Emirates NBD?"',expect:'They discover search or filter without guidance.'},
        ],
        impact:'If a new operator cannot use the screen without training, it will fail in practice even if every AC passes.'},
    ]
  },

  cmi02:{
    id:'CMI-02', name:'Consent History Screen', type:'fe',
    story:{as:'TPP development portal user',want:'to view all past and terminated consents across all LFIs',so:'I can audit historical activity, investigate issues, and meet CBUAE 7-year data retention requirements'},
    what:[
      {icon:'\uD83D\uDCC5', text:'Shows consents that have <strong>ended</strong> \u2014 Expired, Revoked, Consumed, or Rejected.'},
      {icon:'\uD83D\uDCDD', text:'Each entry shows <strong>when it ended</strong>, the reason, and who triggered it.'},
      {icon:'\uD83D\uDD0E', text:'Users can <strong>expand</strong> any entry to see the full activity timeline.'},
      {icon:'\uD83D\uDCE5', text:'A <strong>CSV export</strong> button downloads all visible records.'},
      {icon:'\uD83D\uDDC2\uFE0F', text:'History data is kept for <strong>7 years</strong> as required by CBUAE.'},
    ],
    feACs:[
      {id:'AC-09',given:'the user navigates to the History tab',when:'the screen loads',then:'all consents in Expired, Revoked, Rejected, and Consumed states are displayed with correct terminal state badges'},
      {id:'AC-10',given:'a consent was revoked by the customer',when:'displayed in history',then:'the reason shows "Revoked by customer" and the Revoked By field shows "Customer"'},
      {id:'AC-11',given:'a consent was a single-use consent that was executed',when:'displayed in history',then:'the state shows Consumed with the execution timestamp'},
      {id:'AC-12',given:'the user expands a history entry',when:'the activity timeline loads',then:'all lifecycle events are shown in chronological order with actor and timestamp'},
      {id:'AC-13',given:'the user clicks Export',when:'the export completes',then:'a CSV file is downloaded containing all displayed history records with all columns'},
      {id:'AC-14',given:'historical consents exist from more than 12 months ago',when:'the history view loads',then:'those consents are still visible (per CBUAE 7-year retention requirement)'},
    ],
    gaps:[
      {id:'GAP-06',sev:'high',title:'No AC for what happens when history is empty',what:'No acceptance criterion for the empty state on the History tab.',risk:'History tab may show a broken layout on first use.',fix:'Add AC: given no terminated consents exist, when History tab loads, then an empty state message is shown.'},
      {id:'GAP-07',sev:'medium',title:'CSV export column list not defined',what:'AC-13 says "all columns" but never defines what those columns are.',risk:'Dev will decide columns. QA has nothing to test against.',fix:'Add column spec: consentId (masked), lfiName, accountIBAN, type, finalState, stateReason, revokedBy, terminatedDate.'},
      {id:'GAP-08',sev:'low',title:'7-year retention has no backend enforcement mechanism documented',what:'AC-14 references 7-year requirement but no backend AC specifies how retention is enforced.',risk:'Data could be deleted before 7 years.',fix:'Add backend AC to CMI-05 or CMI-06 specifying records cannot be deleted within 7 years.'},
    ],
    rst:[
      {id:'T-05',level:'integration',title:'History shows exactly the right states \u2014 no active consents leak into history',why:'An Authorized consent appearing in History would confuse operators.',
        steps:[{do:'Set up: 2 Authorized, 1 Suspended, 2 Revoked, 1 Expired, 1 Consumed.',expect:'7 total consents across both tabs.'},{do:'Open History tab.',expect:'4 terminal records. No Authorized or Suspended.'},{do:'Open Current tab.',expect:'3 records. No terminal states.'}],
        impact:'If states bleed between tabs, operators cannot tell which consents are active.'},
      {id:'T-06',level:'system',title:'Activity timeline shows events in the right order with correct actors',why:'The timeline is the audit trail.',
        steps:[{do:'Open a Revoked consent and expand timeline.',expect:'Timeline visible.'},{do:'Check order.',expect:'Oldest first: Created \u2192 Authorized \u2192 Revoked.'},{do:'Check actor on Revoked event.',expect:'Shows "Customer", "System", or "TPP" as appropriate.'}],
        impact:'Wrong order or actor in the audit trail causes compliance investigation failures.'},
      {id:'T-07',level:'uat',title:'CSV export opens correctly in Excel and contains all the right data',why:'Operators open exports in Excel. Gibberish or missing columns is useless.',
        steps:[{do:'Filter to Revoked consents, click Export CSV.',expect:'A .csv file downloads.'},{do:'Open in Excel.',expect:'Columns labelled. Data readable.'},{do:'Check columns present.',expect:'All columns present. Consent ID masked.'}],
        impact:'Unreadable export means operators cannot do offline compliance reporting.'},
    ]
  },

  cmi03:{
    id:'CMI-03', name:'Filter, Search &amp; Sort', type:'fe',
    story:{as:'TPP development portal user',want:'to quickly narrow down the consent list using filters, search, and sorting',so:'I can find specific consents without scrolling through hundreds of records'},
    what:[
      {icon:'\uD83D\uDD0D', text:'<strong>Search</strong> by LFI name or Account/IBAN. Results within 500ms. Minimum 3 characters.'},
      {icon:'\uD83D\uDDC2\uFE0F', text:'<strong>Filter sheet</strong> with checkboxes for Status, Consent Type, and LFI.'},
      {icon:'\u26A1', text:'<strong>Expiring Soon toggle</strong> filters to consents expiring within 30 days.'},
      {icon:'\u2195\uFE0F', text:'<strong>Sort</strong> by column headers. Click for ascending, again for descending.'},
      {icon:'\uD83D\uDD22', text:'<strong>Results count</strong> updates live when filters or search change.'},
      {icon:'\u274C', text:'<strong>Clear All</strong> resets everything.'},
    ],
    feACs:[
      {id:'AC-15',given:'the user selects Consent Type = Data Sharing and LFI = Emirates NBD',when:'filters are applied',then:'only Data Sharing consents from Emirates NBD are displayed and the results count updates'},
      {id:'AC-16',note:'Confirmed: search is by LFI name and Account/IBAN.',given:'the user types at least 3 characters in the search bar',when:'the search executes',then:'matching results appear within 500ms'},
      {id:'AC-17',given:'multiple filters are active',when:'the user clicks Clear All',then:'all filters reset and the full unfiltered list is displayed'},
      {id:'AC-18',given:'the user clicks the Expiry Date column header',when:'sorting is applied',then:'consents are sorted by expiry date \u2014 soonest first on first click, then toggles'},
      {id:'AC-19',given:'the Expiring Soon toggle is switched ON',when:'the list updates',then:'only consents with Permission Expires within 30 days are shown'},
      {id:'AC-20',given:'any filter is applied',when:'the summary strip re-renders',then:'all four stat tile counts update to reflect only the filtered dataset'},
    ],
    gaps:[
      {id:'GAP-09',sev:'high',title:'500ms search SLA has no defined start point',what:'AC-16 says results within 500ms but does not say from keypress, 3rd char, or debounce.',risk:'Different interpretations produce different behaviour.',fix:'Define: 300ms debounce + 200ms execution = 500ms total.'},
      {id:'GAP-10',sev:'medium',title:'Filter + pagination interaction not defined',what:'Does pagination reset to page 1 when filters change?',risk:'User on page 3 could see empty page after filtering.',fix:'Add AC: filters reset pagination to page 1.'},
      {id:'GAP-11',sev:'low',title:'No AC for searching by partial IBAN',what:'Does partial IBAN search work (e.g. last 4 digits)?',risk:'Operators naturally type partial IBANs.',fix:'Add AC: search by last 4 digits of IBAN returns matches.'},
    ],
    rst:[
      {id:'T-08',level:'system',title:'Filter + sort + pagination all work together',why:'Each feature works alone. The real question is combined.',
        steps:[{do:'Filter: LFI = Emirates NBD. Note count.',expect:'Only ENBD consents visible.'},{do:'Sort by Expiry ascending.',expect:'Soonest-expiring ENBD consent at top.'},{do:'Go to page 2.',expect:'Page 2 still filtered and sorted. No duplicates.'}],
        impact:'Bug here silently shows wrong data on page 2.'},
      {id:'T-09',level:'system',title:'Clear All genuinely resets everything',why:'Common bug: UI resets but data stays filtered.',
        steps:[{do:'Apply 3 filters. Note count.',expect:'Small filtered number.'},{do:'Click Clear All.',expect:'All chips reset.'},{do:'Check results count and stat strip.',expect:'Match full unfiltered dataset.'}],
        impact:'Partial reset makes operators think there are fewer consents.'},
      {id:'T-10',level:'integration',title:'Search returns results within 500ms even with 200+ consents',why:'500ms SLA is a CBUAE requirement.',
        steps:[{do:'Ensure 200+ active consents.',expect:'Data loaded.'},{do:'Type "Emirates". Time from 3rd character.',expect:'Results appear.'},{do:'Check elapsed time.',expect:'Under 500ms. No freeze.'}],
        impact:'Slow search means operators scroll manually.'},
    ]
  },

  cmi04:{
    id:'CMI-04', name:'Consent Detail &amp; Actions', type:'fe',
    story:{as:'TPP development portal user',want:'to see the full details of a single consent and take actions on it',so:'I can investigate payment history, verify permissions, and revoke or suspend consents when needed'},
    what:[
      {icon:'\uD83D\uDCC4', text:'Shows the <strong>full consent record</strong>: consent ID (****XXXX), LFI, Account/IBAN, type, status, created date, and expiry.'},
      {icon:'\u2705', text:'Lists all <strong>granted permissions</strong>.'},
      {icon:'\uD83D\uDCB3', text:'For payment consents: <strong>creditor IBAN</strong> (masked), amount, currency, and CoP result.'},
      {icon:'\uD83D\uDD04', text:'For Multi-Payment: <strong>schedule type</strong>, frequency, per-payment limits, and all creditors.'},
      {icon:'\uD83C\uDF0D', text:'For International Payments: <strong>FX rate</strong>, currency pair, and AED 15,000 first-time limit.'},
      {icon:'\uD83D\uDCDC', text:'<strong>Activity Timeline</strong> shows every event with actor and timestamp.'},
      {icon:'\uD83D\uDEAB', text:'Action buttons are <strong>state-dependent</strong>: Authorized shows Revoke + Suspend; terminal states are read-only.'},
    ],
    feACs:[
      {id:'AC-21',given:'the user opens a Data Sharing consent',when:'the detail screen renders',then:'all granted permission scopes are listed with the linked LFI accounts'},
      {id:'AC-22',note:'Confirmed: creditor IBAN masked to last 4 digits.',given:'the user opens a Single Immediate Payment consent',when:'the detail renders',then:'the creditor IBAN is masked (last 4 digits), amount and currency are shown, and the CoP result is displayed'},
      {id:'AC-23',given:'the user opens a Multi-Payment consent',when:'the detail renders',then:'the schedule type, all creditors (2 to 10), frequency, and per-payment limits are displayed'},
      {id:'AC-24',given:'the user opens a consent with payment execution history',when:'the Payment History table loads',then:'all executed payments are listed with status, amount, date, and creditor'},
      {id:'AC-25',given:'the user opens a Combined Consent',when:'the detail renders',then:'each RAR object is displayed in a separate section or tab with its own permissions and payment details'},
      {id:'AC-26',given:'the user opens a consent with an International Payment',when:'the detail renders',then:'the FX details (rate, currencies) and the AED 15,000 first-time limit indicator are shown'},
      {id:'AC-27',given:'the user scrolls to the Activity Timeline',when:'the timeline loads',then:'all lifecycle events are displayed chronologically with actor and timestamp'},
      {id:'AC-28',given:'the consent is in Authorized state',when:'the detail screen is open',then:'Revoke and Suspend buttons are visible and enabled'},
      {id:'AC-29',given:'the consent is in Revoked, Consumed, or Rejected state',when:'the detail screen is open',then:'no action buttons are shown \u2014 the view is read-only'},
      {id:'AC-30',given:'the user clicks Revoke',when:'the confirmation dialog appears',then:'it shows the LFI name, consent type, masked consent ID, and a clear warning that revocation is permanent'},
    ],
    gaps:[
      {id:'GAP-12',sev:'high',title:'No AC for what Suspend does on this screen',what:'AC-28 says Suspend button is visible but no AC defines what happens when clicked.',risk:'Suspend will be built differently by different developers.',fix:'Add ACs: Suspend \u2192 confirmation \u2192 consent transitions to Suspended \u2192 LFI notified.'},
      {id:'GAP-13',sev:'high',title:'Payment History pagination not specified',what:'A consent could have hundreds of payments. No pagination defined.',risk:'Screen could crash loading thousands of records.',fix:'Add AC: payment history paginated at 10 per page, sorted by execution date desc.'},
      {id:'GAP-14',sev:'medium',title:'Combined consent RAR display with only 1 RAR',what:'Max 2 RAR objects but behaviour with exactly 1 not defined.',risk:'1-RAR combined consent could break the tab layout.',fix:'Add AC: if only 1 RAR, show 1 section only.'},
      {id:'GAP-15',sev:'low',title:'Activity timeline actor labels not standardised',what:'Allowed actor values not defined.',risk:'Inconsistent labels make audit trail hard to read.',fix:'Define: Customer, TPP (ADCB), System, LFI.'},
    ],
    rst:[
      {id:'T-11',level:'integration',title:'Clicking a consent ID always opens the right consent detail',why:'Wrong detail = wrong revocation. Irreversible.',
        steps:[{do:'Click 3rd consent in list.',expect:'Detail opens.'},{do:'Compare ID, LFI, IBAN.',expect:'Matches 3rd row exactly.'},{do:'Press back, open different consent.',expect:'New detail shows correct consent.'}],
        impact:'Opening wrong consent leads to accidental revocation.'},
      {id:'T-12',level:'system',title:'Revoke confirmation dialog always shows the correct consent details',why:'Last safety check before irreversible action.',
        steps:[{do:'Open ENBD consent, click Revoke.',expect:'Dialog opens.'},{do:'Check dialog content.',expect:'Shows correct masked ID, "Emirates NBD", and "permanent".'},{do:'Close, open ADIB consent, click Revoke.',expect:'Dialog shows ADIB data.'}],
        impact:'Wrong data in dialog means operators cannot verify what they are revoking.'},
      {id:'T-13',level:'system',title:'Read-only state genuinely prevents all actions',why:'Hidden buttons are not the same as blocked API.',
        steps:[{do:'Open Revoked consent.',expect:'No action buttons.'},{do:'Try DELETE via Postman.',expect:'API returns 400.'},{do:'Check database state.',expect:'State unchanged.'}],
        impact:'If API does not block, UI hiding is easily bypassed.'},
      {id:'T-14',level:'uat',title:'An operator can find out everything about a consent within 2 minutes',why:'During incidents operators need info fast.',
        steps:[{do:'Open Combined Consent. Ask: find data permissions, creditor IBAN, auth date.',expect:'Found within 2 minutes.'},{do:'Ask: "Is this active? Can you revoke it?"',expect:'Correctly identifies status and finds button.'}],
        impact:'Confusing detail screens cause mistakes during incidents.'},
    ]
  },

  cmi05:{
    id:'CMI-05', name:'GET /consents', type:'be',
    story:{as:'backend API',want:'to return the paginated list of consents for the current TPP',so:'CMI-01 screen can display live consent data'},
    what:[
      {icon:'\uD83D\uDCE1', text:'Endpoint: <strong>GET /api/v2.0/consents</strong>. Requires M2M + User token with read:consents scope.'},
      {icon:'\uD83D\uDCCA', text:'Returns <strong>10 per page</strong>, sorted by consent ID descending.'},
      {icon:'\uD83D\uDD0D', text:'Accepts filter parameters: <strong>status</strong>, <strong>lfiName</strong>, <strong>consentType</strong>, <strong>expiryBefore</strong>.'},
      {icon:'\uD83D\uDD12', text:'Consent ID in response is <strong>masked to last 4 digits</strong>.'},
      {icon:'\u23F1\uFE0F', text:'Must respond within <strong>500ms</strong> or logged as SLA violation.'},
    ],
    feACs:[],
    beACs:[
      {id:'AC-31',given:'a valid M2M + User token with read:consents scope',when:'GET /api/v2.0/consents is called',then:'a 200 response with paginated consent list (10 per page, sorted by consent ID desc)'},
      {id:'AC-32',note:'Default filter should include Authorized state.',given:'status=Authorized is passed',when:'the API returns',then:'only Authorized consents are included'},
      {id:'AC-33',note:'Search field is lfiName and accountIBAN.',given:'search=ENBD is passed',when:'the API returns',then:'only consents where lfiName contains ENBD are included'},
      {id:'AC-34',given:'the API Hub is unreachable',when:'the backend attempts to call it',then:'a 503 response with Retry-After header'},
      {id:'AC-35',given:'the response time exceeds 500ms',when:'the API call completes',then:'the call is logged as an SLA violation'},
      {id:'AC-36',given:'any consent is in the response',when:'the response is returned',then:'the consentId field is always masked (****XXXX)'},
    ],
    gaps:[
      {id:'GAP-16',sev:'high',title:'Response schema does not specify IBAN and account number fields',what:'Both IBAN and account number must be returned but format is not specified.',risk:'Backend may return only one or neither.',fix:'Add to AC-31: response includes accountNumber and iban fields. IBAN masked.'},
      {id:'GAP-17',sev:'medium',title:'lastPaymentDate and totalPaidToDate not in response',what:'Screen requires these columns but they are not in any backend AC.',risk:'Columns will be empty on screen.',fix:'Add: lastPaymentDate (DD/MM/YYYY), totalPaidToDate (decimal with currency).'},
    ],
    rst:[
      {id:'T-15',level:'integration',title:'API returns exactly the fields the screen needs',why:'Screen can only show what API returns.',
        steps:[{do:'Call GET /consents. Inspect JSON.',expect:'All fields present: consentId, lfiName, lfiLogoUrl, accountNumber, iban, etc.'},{do:'Check IBAN format.',expect:'Masked: AE** **** **** **** 3456.'},{do:'Check date format.',expect:'DD/MM/YYYY.'}],
        impact:'Missing fields mean blank UI columns.'},
      {id:'T-16',level:'integration',title:'503 response includes Retry-After and hides internals',why:'Frontend needs Retry-After. Exposed errors are a security risk.',
        steps:[{do:'Block API Hub. Call GET /consents.',expect:'Status 503.'},{do:'Check headers.',expect:'Retry-After present.'},{do:'Check body.',expect:'Generic error. No stack traces.'}],
        impact:'Missing Retry-After causes retry storms. Exposed internals are a vulnerability.'},
    ]
  },

  cmi06:{
    id:'CMI-06', name:'GET /consents/{id}', type:'be',
    story:{as:'backend API',want:'to return the complete detail record for a single consent',so:'CMI-04 detail screen can display all information'},
    what:[
      {icon:'\uD83D\uDCE1', text:'Endpoint: <strong>GET /api/v2.0/consents/{consentId}</strong>. Returns the full consent object.'},
      {icon:'\uD83D\uDCCA', text:'Returns <strong>nested objects</strong>: permissions, paymentDetails, activityLog.'},
      {icon:'\uD83D\uDCDC', text:'Activity log sorted <strong>chronologically oldest first</strong>.'},
      {icon:'\u274C', text:'If consent ID does not exist, returns <strong>404</strong>.'},
    ],
    feACs:[],
    beACs:[
      {id:'AC-37',given:'a valid consentId is provided',when:'GET /consents/{consentId} is called',then:'the full consent object is returned with all nested objects'},
      {id:'AC-38',given:'the consent is a payment type',when:'the response is returned',then:'paymentDetails includes creditor IBAN (masked), amount, CoP result, and Risk Information Block'},
      {id:'AC-39',given:'the consent is a Combined Consent',when:'the response is returned',then:'rarObjects array contains the RAR objects (max 2) with respective permissions and payment details'},
      {id:'AC-40',given:'the consent has an activity log',when:'the response is returned',then:'activityLog is sorted chronologically oldest first with event type, actor, and timestamp'},
      {id:'AC-41',given:'an invalid or non-existent consentId',when:'the API is called',then:'a 404 response with a clear error message'},
    ],
    gaps:[
      {id:'GAP-18',sev:'high',title:'Customer account IBAN not confirmed in response',what:'Response shows creditor IBAN but customer\'s own account IBAN may not be returned.',risk:'CMI-04 Account/IBAN field would be blank.',fix:'Add to AC-37: response includes consenting account IBAN and account number.'},
      {id:'GAP-19',sev:'medium',title:'No AC for malformed consent ID',what:'AC-41 covers non-existent ID but not malformed format.',risk:'Malformed ID could cause unhandled exception.',fix:'Add AC: invalid format returns 400 with "Invalid consent ID format".'},
    ],
    rst:[
      {id:'T-17',level:'integration',title:'Full consent object has everything the detail screen needs',why:'Detail screen should need only one API call.',
        steps:[{do:'Call GET /consents/{id} for a Multi-Payment. Inspect response.',expect:'One call returns all: permissions, paymentDetails, activityLog.'},{do:'Check activityLog.',expect:'At minimum: Consent Created event.'},{do:'Check chronological order.',expect:'Oldest first.'}],
        impact:'Multiple API calls = slower, more error-prone.'},
      {id:'T-18',level:'integration',title:'Requesting another TPP\'s consent returns 403',why:'Cross-TPP data access is a breach.',
        steps:[{do:'Using TPP-A credentials, request TPP-B\'s consent.',expect:'Two TPP accounts needed.'},{do:'Check response.',expect:'403 Forbidden. No TPP-B data exposed.'},{do:'Check error message.',expect:'"Consent not found or access denied".'}],
        impact:'Critical security and privacy breach.'},
    ]
  },

  cmi07:{
    id:'CMI-07', name:'DELETE /consents/{id}', type:'be',
    story:{as:'backend API',want:'to permanently revoke a consent when instructed by the TPP operator',so:'the customer\'s data access or payment permissions are immediately terminated'},
    what:[
      {icon:'\uD83D\uDEAB', text:'Endpoint: <strong>DELETE /api/v2.0/consents/{consentId}</strong>. Revokes permanently.'},
      {icon:'\u26A1', text:'State must transition to <strong>Revoked within 500ms</strong>.'},
      {icon:'\uD83D\uDCDD', text:'Every revocation creates an <strong>audit log entry</strong>.'},
      {icon:'\u274C', text:'Returns <strong>400</strong> if consent is already in a terminal state.'},
    ],
    feACs:[],
    beACs:[
      {id:'AC-42',given:'a consent in Authorized state',when:'DELETE /consents/{consentId} is called',then:'204 response and consent transitions to Revoked within 500ms'},
      {id:'AC-43',given:'a consent in Suspended state',when:'DELETE /consents/{consentId} is called',then:'204 response and consent transitions to Revoked'},
      {id:'AC-44',given:'a consent in Expired or Consumed state',when:'DELETE /consents/{consentId} is called',then:'400 response with "Consent not in a revocable state"'},
      {id:'AC-45',given:'the API Hub is unreachable',when:'DELETE is called',then:'503 response and consent state remains unchanged'},
      {id:'AC-46',given:'a successful revocation completes',when:'the event is logged',then:'audit trail records: consentId, actor (ADCB-TPP), timestamp, previousState, newState (Revoked)'},
    ],
    gaps:[
      {id:'GAP-20',sev:'high',title:'No AC for double-revocation',what:'What if DELETE is called twice quickly?',risk:'Second call might succeed silently or create duplicate audit log.',fix:'Confirm AC-44 covers already-Revoked state. Test explicitly.'},
      {id:'GAP-21',sev:'medium',title:'Audit log format not fully specified',what:'Actor, timestamp format, and append-only requirement not defined.',risk:'Inconsistent logs make audit queries unreliable.',fix:'Specify: actor = Customer|TPP|System|LFI. Timestamp = ISO 8601 UTC. Append-only.'},
    ],
    rst:[
      {id:'T-19',level:'integration',title:'Revoking a Suspended consent works',why:'Often forgotten. Operators may need to revoke during investigation.',
        steps:[{do:'Find Suspended consent. Call DELETE.',expect:'204 No Content.'},{do:'GET /consents/{id}.',expect:'State = Revoked. Previous = Suspended.'},{do:'Check audit log.',expect:'previousState=Suspended, newState=Revoked.'}],
        impact:'Operators discover in production they cannot revoke a suspended consent.'},
      {id:'T-20',level:'integration',title:'API Hub down does NOT change consent state',why:'If 503 returned but state changed anyway, operator thinks it failed but consent is revoked.',
        steps:[{do:'Block API Hub. DELETE Authorized consent.',expect:'503 with Retry-After.'},{do:'Restore Hub. GET consent.',expect:'State still Authorized.'},{do:'Check audit log.',expect:'No revocation entry.'}],
        impact:'Silent state change during outage causes liability.'},
    ]
  },

  cmi08:{
    id:'CMI-08', name:'GET /payments', type:'be',
    story:{as:'backend API',want:'to return the payment execution history for a specific consent',so:'CMI-04 can show what payments have been made'},
    what:[
      {icon:'\uD83D\uDCE1', text:'Endpoint: <strong>GET /api/v2.0/consents/{id}/payments</strong>.'},
      {icon:'\uD83D\uDCCA', text:'Paginated at <strong>10 per page</strong>, sorted by execution date desc.'},
      {icon:'\uD83D\uDD0D', text:'Accepts <strong>status filter</strong>: Completed, Failed, Refunded.'},
      {icon:'\u274C', text:'Returns <strong>empty array</strong> for Data Sharing consents.'},
    ],
    feACs:[],
    beACs:[
      {id:'AC-47',given:'a VRP consent with multiple payments',when:'GET /consents/{id}/payments is called with pageSize=10',then:'first page returns 10 payments sorted by execution date desc'},
      {id:'AC-48',given:'status=Failed is passed',when:'the API returns',then:'only failed payments are included'},
      {id:'AC-49',given:'a payment has been refunded',when:'the response is returned',then:'status shows Refunded with refund timestamp in statusTimeline'},
      {id:'AC-50',given:'the consent is Data Sharing with no payments',when:'the API is called',then:'empty payments array is returned (not a 404)'},
    ],
    gaps:[
      {id:'GAP-22',sev:'medium',title:'No maximum total payments per consent defined',what:'VRP consent could have 52+ payments/year. Pagination type not specified.',risk:'Large histories could cause slow responses.',fix:'Add: cursor-based pagination. Response includes nextCursor. Total is estimate for large datasets.'},
      {id:'GAP-23',sev:'low',title:'Payment creditor IBAN masking not specified',what:'Masking confirmed for CMI-04 screen but not for this endpoint.',risk:'IBANs may appear unmasked in payment history.',fix:'Add to AC-47: creditor IBAN masked to last 4 digits.'},
    ],
    rst:[
      {id:'T-21',level:'integration',title:'Empty payments array for Data Sharing \u2014 not a 404',why:'Developers often return 404 for no data. Frontend treats this as an error.',
        steps:[{do:'Find Data Sharing consent. Call GET payments.',expect:'200 OK.'},{do:'Check response body.',expect:'{"payments": [], "total": 0}.'},{do:'Check CMI-04 detail screen.',expect:'"No payment history" \u2014 not an error.'}],
        impact:'404 for no payments shows error instead of empty state.'},
      {id:'T-22',level:'system',title:'Failed payment filter returns only failed payments',why:'Operators use this to investigate failures.',
        steps:[{do:'Consent with mixed statuses. GET ?status=Failed.',expect:'Response received.'},{do:'Check all records.',expect:'All have status=Failed. Zero Completed or Refunded.'},{do:'GET ?status=Refunded.',expect:'All Refunded. Zero others.'}],
        impact:'Incorrect filtering means operators cannot isolate failures.'},
    ]
  }
};

/* Phone preview data */
var CMI_CONSENT_DATA = [
  {i:0,id:'CNS-****-001',lfi:'Emirates NBD',av:'ENBD',ac:'#C8102E',type:'Data Sharing',tb:'cmi-bdata',st:'Authorized',sb:'cmi-bauth',exp:'01 Mar 2027',warn:false,pt:'data'},
  {i:1,id:'CNS-****-042',lfi:'First Abu Dhabi Bank',av:'FAB',ac:'#1D6FA4',type:'Multi-Payment (VRP)',tb:'cmi-bmulti',st:'Authorized',sb:'cmi-bauth',exp:'15 Feb 2027',warn:false,pt:'vrp'},
  {i:2,id:'CNS-****-018',lfi:'Mashreq Bank',av:'MBK',ac:'#7C3AED',type:'Multi-Payment',tb:'cmi-bmulti',st:'Suspended',sb:'cmi-bsusp',exp:'10 Apr 2026',warn:true,pt:'vrp'},
  {i:3,id:'CNS-****-099',lfi:'ADIB',av:'ADIB',ac:'#065F46',type:'Combined',tb:'cmi-bcomb',st:'Authorized',sb:'cmi-bauth',exp:'20 Mar 2027',warn:false,pt:'comb'},
  {i:4,id:'CNS-****-077',lfi:'RAK Bank',av:'RAKB',ac:'#92400E',type:'International',tb:'cmi-bintl',st:'Authorized',sb:'cmi-bauth',exp:'Single-use',warn:false,pt:'intl'},
  {i:5,id:'CNS-****-011',lfi:'Dubai Islamic Bank',av:'DIB',ac:'#1C2B4A',type:'Single Payment',tb:'cmi-bpay',st:'Authorized',sb:'cmi-bauth',exp:'N/A',warn:false,pt:'single'},
];

var CMI_HISTORY_DATA = [
  {id:'CNS-****-005',lfi:'Emirates NBD',av:'ENBD',ac:'#C8102E',type:'Data Sharing',tb:'cmi-bdata',st:'Revoked',sb:'cmi-brev',reason:'Revoked by customer',tDate:'15 Jan 2026',tl:[{c:'#6366F1',ev:'Consent Created',t:'01 Aug 2025 09:00'},{c:'#16A34A',ev:'Authorized via EFR biometric',t:'01 Aug 2025 09:02'},{c:'#C8102E',ev:'Revoked by customer via LFI',t:'15 Jan 2026 14:30'}]},
  {id:'CNS-****-033',lfi:'First Abu Dhabi Bank',av:'FAB',ac:'#1D6FA4',type:'Payment',tb:'cmi-bpay',st:'Consumed',sb:'cmi-bcons',reason:'Single-use payment executed',tDate:'01 Dec 2025',tl:[{c:'#6366F1',ev:'Consent Created',t:'01 Dec 2025 10:00'},{c:'#16A34A',ev:'Authorized via AlTareq',t:'01 Dec 2025 10:05'},{c:'#C8102E',ev:'Consent consumed (single-use)',t:'01 Dec 2025 10:07'}]},
  {id:'CNS-****-021',lfi:'Mashreq Bank',av:'MBK',ac:'#7C3AED',type:'Multi-Payment',tb:'cmi-bmulti',st:'Expired',sb:'cmi-bexp2',reason:'Expired on 15 Mar 2026',tDate:'15 Mar 2026',tl:[{c:'#6366F1',ev:'Consent Created',t:'15 Oct 2025'},{c:'#16A34A',ev:'Authorized',t:'15 Oct 2025'},{c:'#9CA3AF',ev:'Consent expired naturally',t:'15 Mar 2026'}]},
  {id:'CNS-****-055',lfi:'ADIB',av:'ADIB',ac:'#065F46',type:'Data Sharing',tb:'cmi-bdata',st:'Rejected',sb:'cmi-brev',reason:'Rejected during CAAP',tDate:'01 Jan 2026',tl:[{c:'#6366F1',ev:'Consent Created',t:'01 Jan 2026 11:00'},{c:'#F59E0B',ev:'CAAP SCA Initiated',t:'01 Jan 2026 11:02'},{c:'#C8102E',ev:'Rejected by customer',t:'01 Jan 2026 11:05'}]},
];

var CMI_SCENARIOS = {
  cmi01:[
    {id:'default',label:'AC-01 Default list', desc:'<strong>Current Consents list.</strong> Shows all active consents with status badges, TPP names, permission scopes, and expiry dates. This is the landing view when the SME opens the dashboard.'},
    {id:'ac02',label:'AC-02 New consent', desc:'<strong>New consent just arrived.</strong> A "New" badge appears on consents created within the last 24 hours. The list auto-refreshes when the dashboard is opened.'},
    {id:'ac03',label:'AC-03 Expiry warning', desc:'<strong>Consent nearing expiry.</strong> An amber warning badge appears when a consent has less than 7 days remaining. Helps the SME decide whether to renew or let it lapse.'},
    {id:'ac04',label:'AC-04 Combined badge', desc:'<strong>Combined consent type.</strong> A single consent that grants both data sharing and payment permissions. Shown with a combined badge so the SME knows the full scope at a glance.'},
    {id:'ac06',label:'AC-06 Stat tile filter', desc:'<strong>Filter by status tile.</strong> Tapping a status tile (Active, Expired, Revoked) filters the list to show only consents in that state. Tap again to clear the filter.'},
    {id:'ac07',label:'AC-07 Stale data', desc:'<strong>Stale or failed data fetch.</strong> When the scheduler last ran and failed to retrieve data (e.g. bank API timeout), a warning icon appears on the affected consent card.'},
    {id:'ac08',label:'AC-08 Empty state', desc:'<strong>No consents exist.</strong> The SME has never granted consent to any TPP. The screen shows a friendly empty state with guidance on how consents are created (via TPP apps, not directly).'},
  ],
  cmi02:[
    {id:'history',label:'AC-09/10/11 History list', desc:'<strong>Consent History tab.</strong> Shows all past consents including revoked, expired, and consumed entries. Each row shows the final status, TPP name, and when it ended.'},
    {id:'ac12',label:'AC-12 Timeline expand', desc:'<strong>Timeline view for a consent.</strong> Expanding a history entry reveals the full lifecycle: Created \u2192 Authorized \u2192 Data fetched \u2192 Expired/Revoked, with timestamps at each stage.'},
    {id:'ac13',label:'AC-13 Export CSV', desc:'<strong>Export consent history.</strong> The SME can download a CSV of their consent history for auditing or compliance purposes. Includes all fields visible in the history table.'},
  ],
  cmi03:[
    {id:'filter',label:'AC-15/17/19/20 Filters', desc:'<strong>Advanced filters.</strong> Filter consents by TPP name, permission type (data/payment/combined), status (active/expired/revoked), and date range. Multiple filters can be combined.'},
    {id:'ac16',label:'AC-16 Search', desc:'<strong>Search consents.</strong> Type a TPP name, consent ID, or keyword to find matching consents. Search works across both current and history tabs.'},
    {id:'ac18',label:'AC-18 Sort', desc:'<strong>Sort consent list.</strong> Sort by newest first, oldest first, expiry date, or TPP name alphabetically. Default is newest first.'},
  ],
  cmi04:[
    {id:'default',label:'AC-21 Data Sharing', desc:'<strong>Data Sharing consent detail.</strong> Shows the full consent object \u2014 which data clusters are shared (accounts, balances, transactions), the TPP name, expiry date, and usage count. <strong>Next:</strong> SME can revoke from this screen.'},
    {id:'single',label:'AC-22 Single Payment', desc:'<strong>Single Instant Payment consent.</strong> Shows the payment amount, creditor account, payment reference, and consent status. This consent is single-use \u2014 consumed after the payment executes.'},
    {id:'vrp',label:'AC-23/24 Multi-Payment', desc:'<strong>Variable Recurring Payment consent.</strong> Shows the max amount per period, frequency, start/end dates. The TPP can charge up to the agreed limit without re-authorisation each time.'},
    {id:'combined',label:'AC-25 Combined RAR', desc:'<strong>Combined consent \u2014 data + payment.</strong> A single consent that grants both data sharing access and payment initiation. Shows both the data clusters and the payment parameters in one view.'},
    {id:'intl',label:'AC-26 International', desc:'<strong>International payment consent.</strong> Shows the currency, destination country, and intermediary bank details. Additional compliance fields (purpose code, charge bearer) are visible.'},
    {id:'ac28',label:'AC-28 Actions visible', desc:'<strong>Action buttons visible.</strong> When the consent is active and the SME has authority, action buttons appear: Revoke, Extend (if supported), and View History.'},
    {id:'readonly',label:'AC-29 Read-only', desc:'<strong>Read-only view.</strong> The consent has already been consumed, expired, or revoked. No action buttons are shown \u2014 the SME can only view the historical record.'},
    {id:'ac30',label:'AC-30 Revoke confirm', desc:'<strong>Revoke confirmation.</strong> When the SME taps "Revoke", a confirmation dialog appears. Revoking is immediate and irreversible \u2014 the TPP loses access instantly. The consent moves to history.'},
  ],
};

var CMI_AC_PREVIEW_MAP = {
  'AC-01':'cmi01|default','AC-02':'cmi01|ac02','AC-03':'cmi01|ac03','AC-04':'cmi01|ac04',
  'AC-05':'cmi01|default','AC-06':'cmi01|ac06','AC-07':'cmi01|ac07','AC-08':'cmi01|ac08',
  'AC-09':'cmi02|history','AC-10':'cmi02|history','AC-11':'cmi02|history',
  'AC-12':'cmi02|ac12','AC-13':'cmi02|ac13','AC-14':'cmi02|ac13',
  'AC-15':'cmi03|filter','AC-16':'cmi03|ac16','AC-17':'cmi03|filter',
  'AC-18':'cmi03|ac18','AC-19':'cmi03|filter','AC-20':'cmi03|filter',
  'AC-21':'cmi04|default','AC-22':'cmi04|single','AC-23':'cmi04|vrp',
  'AC-24':'cmi04|vrp','AC-25':'cmi04|combined','AC-26':'cmi04|intl',
  'AC-27':'cmi04|vrp','AC-28':'cmi04|ac28','AC-29':'cmi04|readonly','AC-30':'cmi04|ac30',
  'T-01':'cmi01|default','T-02':'cmi01|ac03','T-03':'cmi01|ac07','T-04':'cmi01|default',
  'T-05':'cmi02|history','T-06':'cmi02|ac12','T-07':'cmi02|ac13',
  'T-08':'cmi03|filter','T-09':'cmi03|filter','T-10':'cmi03|ac16',
  'T-11':'cmi04|default','T-12':'cmi04|ac30','T-13':'cmi04|readonly','T-14':'cmi04|ac28',
  'T-15':'cmi01|default','T-16':'cmi01|ac07',
  'T-17':'cmi04|vrp','T-18':'cmi04|default',
  'T-19':'cmi04|ac28','T-20':'cmi01|ac07',
  'T-21':'cmi04|vrp','T-22':'cmi04|vrp'
};

/* ============================================================
   CMI Scenario API Panel Data
   Maps each phone preview scenario key to its API call details.
   Rendered as a dark-themed developer panel alongside the phone.
   ============================================================ */

var CMI_SCENARIO_APIS = {

  /* ── CMI-01 Current Consents ─────────────────────────────── */

  'cmi01|default':{
    title:'CMI-01 — CURRENT CONSENTS (DEFAULT)',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — Fetch paginated authorized consents</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents?status=Authorized&amp;page=1&amp;pageSize=10</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\n{\n  "total": 3,\n  "page": 1,\n  "pageSize": 10,\n  "consents": [\n    {\n      "consentId": "****-001",\n      "lfiName": "Emirates NBD",\n      "lfiLogoUrl": "https://hub.adcb.com/logos/enbd.png",\n      "accountIban": "AE** **** **** 3456",\n      "consentType": "DataSharing",\n      "status": "Authorized",\n      "permissionExpires": "2027-03-01T00:00:00Z",\n      "createdAt": "2025-08-01T09:00:00Z"\n    },\n    {\n      "consentId": "****-042",\n      "lfiName": "First Abu Dhabi Bank",\n      "lfiLogoUrl": "https://hub.adcb.com/logos/fab.png",\n      "accountIban": "AE** **** **** 7890",\n      "consentType": "VRP",\n      "status": "Authorized",\n      "permissionExpires": "2027-02-15T00:00:00Z",\n      "createdAt": "2025-09-10T11:30:00Z"\n    },\n    {\n      "consentId": "****-099",\n      "lfiName": "ADIB",\n      "lfiLogoUrl": "https://hub.adcb.com/logos/adib.png",\n      "accountIban": "AE** **** **** 2211",\n      "consentType": "Combined",\n      "status": "Authorized",\n      "permissionExpires": "2027-03-20T00:00:00Z",\n      "createdAt": "2025-10-05T08:15:00Z"\n    }\n  ]\n}</pre></div>'
  },

  'cmi01|ac02':{
    title:'CMI-01 — AC-02 NEW CONSENT APPEARS',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — Poll for updated consent list (refresh mechanism)</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents?status=Authorized&amp;page=1&amp;pageSize=10</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\n{\n  "total": 4,\n  "page": 1,\n  "pageSize": 10,\n  "consents": [\n    {\n      "consentId": "****-112",\n      "lfiName": "Mashreq Bank",\n      "lfiLogoUrl": "https://hub.adcb.com/logos/mbk.png",\n      "accountIban": "AE** **** **** 5544",\n      "consentType": "DataSharing",\n      "status": "Authorized",\n      "permissionExpires": "2027-04-10T00:00:00Z",\n      "createdAt": "2026-04-16T10:42:00Z"\n    },\n    { "consentId": "****-001", "lfiName": "Emirates NBD" },\n    { "consentId": "****-042", "lfiName": "First Abu Dhabi Bank" },\n    { "consentId": "****-099", "lfiName": "ADIB" }\n  ]\n}</pre></div><div style="background:#1C2333;border-radius:6px;padding:10px;font-size:11px;color:#8B949E;line-height:1.6"><span style="color:#F0883E;font-weight:700">NOTE (GAP-02):</span> Refresh mechanism is an open gap. Frontend polls this endpoint every 15 s. New consent CNS-****-112 (just authorized via CAAP) appears within the 30-second SLA. The <code style="color:#7EE787">createdAt</code> timestamp identifies the new record.</div>'
  },

  'cmi01|ac03':{
    title:'CMI-01 — AC-03 EXPIRY WARNING',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — Fetch consents; frontend evaluates permissionExpires</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents?status=Authorized&amp;page=1&amp;pageSize=10</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\n{\n  "total": 3,\n  "consents": [\n    {\n      "consentId": "****-018",\n      "lfiName": "Mashreq Bank",\n      "accountIban": "AE** **** **** 6677",\n      "consentType": "VRP",\n      "status": "Authorized",\n      "permissionExpires": "2026-05-10T00:00:00Z"\n    },\n    {\n      "consentId": "****-001",\n      "lfiName": "Emirates NBD",\n      "permissionExpires": "2027-03-01T00:00:00Z"\n    },\n    {\n      "consentId": "****-042",\n      "lfiName": "First Abu Dhabi Bank",\n      "permissionExpires": "2027-02-15T00:00:00Z"\n    }\n  ]\n}</pre></div><div style="background:#1C2333;border-radius:6px;padding:10px;font-size:11px;color:#8B949E;line-height:1.6"><span style="color:#F0883E;font-weight:700">FRONTEND LOGIC:</span> today = 2026-04-16. Warning threshold = today + 30 days = 2026-05-16. CNS-****-018 expires 2026-05-10 — within threshold — cell rendered in orange with warning icon. Other two records: no highlight.</div>'
  },

  'cmi01|ac04':{
    title:'CMI-01 — AC-04 COMBINED CONSENT BADGE',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — Fetch consents; Combined type includes rarObjects</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents?status=Authorized&amp;page=1&amp;pageSize=10</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\n{\n  "total": 1,\n  "consents": [\n    {\n      "consentId": "****-099",\n      "lfiName": "ADIB",\n      "accountIban": "AE** **** **** 2211",\n      "consentType": "Combined",\n      "status": "Authorized",\n      "permissionExpires": "2027-03-20T00:00:00Z",\n      "rarObjects": [\n        {\n          "type": "DataSharing",\n          "permissions": ["ReadAccountsBasic","ReadBalances"]\n        },\n        {\n          "type": "Payment",\n          "paymentType": "VRP",\n          "maxAmountPerPayment": 5000\n        }\n      ]\n    }\n  ]\n}</pre></div><div style="background:#1C2333;border-radius:6px;padding:10px;font-size:11px;color:#8B949E;line-height:1.6"><span style="color:#56D364;font-weight:700">RENDER RULE:</span> When <code style="color:#7EE787">consentType === "Combined"</code> and <code style="color:#7EE787">rarObjects.length === 2</code>, the Type column renders a Combined badge showing both sub-types: <em>Data Sharing + Payment</em>.</div>'
  },

  'cmi01|ac06':{
    title:'CMI-01 — AC-06 EXPIRING SOON FILTER',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — Filtered request via Expiring Soon stat tile click</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents?status=Authorized&amp;expiringWithin=30d&amp;page=1&amp;pageSize=10</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\n{\n  "total": 2,\n  "page": 1,\n  "pageSize": 10,\n  "consents": [\n    {\n      "consentId": "****-018",\n      "lfiName": "Mashreq Bank",\n      "accountIban": "AE** **** **** 6677",\n      "consentType": "VRP",\n      "status": "Authorized",\n      "permissionExpires": "2026-05-10T00:00:00Z"\n    },\n    {\n      "consentId": "****-077",\n      "lfiName": "RAK Bank",\n      "accountIban": "AE** **** **** 9988",\n      "consentType": "International",\n      "status": "Authorized",\n      "permissionExpires": "2026-04-30T00:00:00Z"\n    }\n  ]\n}</pre></div><div style="background:#1C2333;border-radius:6px;padding:10px;font-size:11px;color:#8B949E;line-height:1.6"><span style="color:#56D364;font-weight:700">TRIGGER:</span> User clicks the <em>Expiring Within 30 Days</em> stat tile. Frontend appends <code style="color:#7EE787">expiringWithin=30d</code> param and re-requests. Results count updates to 2.</div>'
  },

  'cmi01|ac07':{
    title:'CMI-01 — AC-07 API UNAVAILABLE / STALE DATA',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — API Hub unreachable; backend returns 503</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents?status=Authorized</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 503 Service Unavailable\nRetry-After: 30\nContent-Type: application/json\n\n{\n  "error": "upstream_unavailable",\n  "message": "API Hub is temporarily unreachable. Please retry after 30 seconds.",\n  "retryAfter": 30\n}</pre></div><div style="background:#1C2333;border-radius:6px;padding:10px;font-size:11px;color:#8B949E;line-height:1.6"><span style="color:#F0883E;font-weight:700">FRONTEND BEHAVIOUR:</span> On 503, frontend reads <code style="color:#7EE787">Retry-After: 30</code> header and schedules one automatic retry after 30 s. Cached consent list from last successful response is rendered. A yellow <em>Stale Data</em> banner appears at the top of the screen. Screen does not crash or show blank.</div>'
  },

  'cmi01|ac08':{
    title:'CMI-01 — AC-08 EMPTY STATE',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — Authorized consents; zero results</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents?status=Authorized&amp;page=1&amp;pageSize=10</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\n{\n  "total": 0,\n  "page": 1,\n  "pageSize": 10,\n  "consents": []\n}</pre></div><div style="background:#1C2333;border-radius:6px;padding:10px;font-size:11px;color:#8B949E;line-height:1.6"><span style="color:#56D364;font-weight:700">NOTE:</span> API returns 200 with an empty array — not a 404. Frontend renders the empty state message: <em>"No active consents found"</em>. Stat strip shows all zeroes. Pagination controls are hidden.</div>'
  },

  /* ── CMI-02 Consent History ───────────────────────────────── */

  'cmi02|history':{
    title:'CMI-02 — CONSENT HISTORY LIST',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — Fetch terminal-state consents</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents?status=Expired,Revoked,Rejected,Consumed&amp;page=1&amp;pageSize=10</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\n{\n  "total": 4,\n  "page": 1,\n  "pageSize": 10,\n  "consents": [\n    {\n      "consentId": "****-005",\n      "lfiName": "Emirates NBD",\n      "accountIban": "AE** **** **** 3456",\n      "consentType": "DataSharing",\n      "status": "Revoked",\n      "stateReason": "Revoked by customer",\n      "revokedBy": "Customer",\n      "terminatedDate": "2026-01-15T14:30:00Z"\n    },\n    {\n      "consentId": "****-033",\n      "lfiName": "First Abu Dhabi Bank",\n      "accountIban": "AE** **** **** 7890",\n      "consentType": "Payment",\n      "status": "Consumed",\n      "stateReason": "Single-use payment executed",\n      "terminatedDate": "2025-12-01T10:07:00Z"\n    },\n    {\n      "consentId": "****-021",\n      "lfiName": "Mashreq Bank",\n      "accountIban": "AE** **** **** 6677",\n      "consentType": "VRP",\n      "status": "Expired",\n      "stateReason": "Expired on 15 Mar 2026",\n      "terminatedDate": "2026-03-15T00:00:00Z"\n    },\n    {\n      "consentId": "****-055",\n      "lfiName": "ADIB",\n      "accountIban": "AE** **** **** 2211",\n      "consentType": "DataSharing",\n      "status": "Rejected",\n      "stateReason": "Rejected during CAAP",\n      "terminatedDate": "2026-01-01T11:05:00Z"\n    }\n  ]\n}</pre></div>'
  },

  'cmi02|ac12':{
    title:'CMI-02 — AC-12 ACTIVITY TIMELINE',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — Full consent detail with activityLog</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents/****-005</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\n{\n  "consentId": "****-005",\n  "lfiName": "Emirates NBD",\n  "accountIban": "AE** **** **** 3456",\n  "consentType": "DataSharing",\n  "status": "Revoked",\n  "activityLog": [\n    {\n      "event": "ConsentCreated",\n      "actor": "TPP",\n      "actorLabel": "ADCB Open Finance",\n      "timestamp": "2025-08-01T09:00:00Z"\n    },\n    {\n      "event": "Authorized",\n      "actor": "Customer",\n      "actorLabel": "Customer via EFR biometric",\n      "timestamp": "2025-08-01T09:02:00Z"\n    },\n    {\n      "event": "Revoked",\n      "actor": "Customer",\n      "actorLabel": "Customer via LFI app",\n      "timestamp": "2026-01-15T14:30:00Z"\n    }\n  ]\n}</pre></div><div style="background:#1C2333;border-radius:6px;padding:10px;font-size:11px;color:#8B949E;line-height:1.6"><span style="color:#56D364;font-weight:700">NOTE:</span> <code style="color:#7EE787">activityLog</code> sorted chronologically oldest-first. Allowed actor values: <em>Customer, TPP, System, LFI</em> (GAP-15 / GAP-21).</div>'
  },

  'cmi02|ac13':{
    title:'CMI-02 — AC-13 CSV EXPORT',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — Export consent history as CSV download</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents/export?status=Expired,Revoked,Rejected,Consumed&amp;format=csv</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\nContent-Type: text/csv\nContent-Disposition: attachment; filename="consent-history-2026-04-16.csv"\n\nconsentId,lfiName,accountIban,consentType,finalState,stateReason,revokedBy,terminatedDate\n"****-005","Emirates NBD","AE** **** **** 3456","DataSharing","Revoked","Revoked by customer","Customer","2026-01-15"\n"****-033","First Abu Dhabi Bank","AE** **** **** 7890","Payment","Consumed","Single-use payment executed","System","2025-12-01"\n"****-021","Mashreq Bank","AE** **** **** 6677","VRP","Expired","Expired on 15 Mar 2026","","2026-03-15"\n"****-055","ADIB","AE** **** **** 2211","DataSharing","Rejected","Rejected during CAAP","","2026-01-01"</pre></div><div style="background:#1C2333;border-radius:6px;padding:10px;font-size:11px;color:#8B949E;line-height:1.6"><span style="color:#56D364;font-weight:700">COLUMNS (GAP-07 resolution):</span> consentId (masked), lfiName, accountIban (masked), consentType, finalState, stateReason, revokedBy, terminatedDate. File opens correctly in Excel with labelled columns.</div>'
  },

  /* ── CMI-03 Filter & Search ───────────────────────────────── */

  'cmi03|filter':{
    title:'CMI-03 — FILTER & SEARCH',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — Combined filter: type + LFI + status</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents?type=DataSharing&amp;lfi=ENBD&amp;status=Authorized&amp;page=1&amp;pageSize=10</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\n{\n  "total": 2,\n  "page": 1,\n  "pageSize": 10,\n  "appliedFilters": {\n    "type": "DataSharing",\n    "lfi": "ENBD",\n    "status": "Authorized"\n  },\n  "consents": [\n    {\n      "consentId": "****-001",\n      "lfiName": "Emirates NBD",\n      "accountIban": "AE** **** **** 3456",\n      "consentType": "DataSharing",\n      "status": "Authorized",\n      "permissionExpires": "2027-03-01T00:00:00Z"\n    },\n    {\n      "consentId": "****-088",\n      "lfiName": "Emirates NBD",\n      "accountIban": "AE** **** **** 1122",\n      "consentType": "DataSharing",\n      "status": "Authorized",\n      "permissionExpires": "2027-01-20T00:00:00Z"\n    }\n  ]\n}</pre></div><div style="background:#1C2333;border-radius:6px;padding:10px;font-size:11px;color:#8B949E;line-height:1.6"><span style="color:#56D364;font-weight:700">NOTE:</span> Results count updates to 2. Stat strip recalculates for filtered dataset only. Pagination resets to page 1 on filter change (GAP-10).</div>'
  },

  'cmi03|ac16':{
    title:'CMI-03 — AC-16 SEARCH',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — Search by LFI name (debounced)</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents?search=Emirates&amp;pageSize=10</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\n{\n  "total": 3,\n  "query": "Emirates",\n  "searchedFields": ["lfiName","accountIban"],\n  "consents": [\n    {\n      "consentId": "****-001",\n      "lfiName": "Emirates NBD",\n      "accountIban": "AE** **** **** 3456",\n      "consentType": "DataSharing",\n      "status": "Authorized"\n    },\n    {\n      "consentId": "****-088",\n      "lfiName": "Emirates NBD",\n      "accountIban": "AE** **** **** 1122",\n      "consentType": "DataSharing",\n      "status": "Authorized"\n    },\n    {\n      "consentId": "****-005",\n      "lfiName": "Emirates NBD",\n      "accountIban": "AE** **** **** 3456",\n      "consentType": "DataSharing",\n      "status": "Revoked"\n    }\n  ]\n}</pre></div><div style="background:#1C2333;border-radius:6px;padding:10px;font-size:11px;color:#8B949E;line-height:1.6"><span style="color:#F0883E;font-weight:700">DEBOUNCE (GAP-09 resolution):</span> 300 ms debounce on keypress + max 200 ms API execution = 500 ms total SLA. Request fires only after user types 3+ characters and pauses. <code style="color:#7EE787">searchedFields</code> confirms lfiName and accountIban are the only search targets.</div>'
  },

  'cmi03|ac18':{
    title:'CMI-03 — AC-18 SORT BY EXPIRY DATE',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — Sort ascending by expiry date</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents?status=Authorized&amp;sort=expiryDate&amp;order=asc&amp;page=1&amp;pageSize=10</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\n{\n  "total": 3,\n  "sort": "expiryDate",\n  "order": "asc",\n  "consents": [\n    {\n      "consentId": "****-018",\n      "lfiName": "Mashreq Bank",\n      "permissionExpires": "2026-05-10T00:00:00Z"\n    },\n    {\n      "consentId": "****-042",\n      "lfiName": "First Abu Dhabi Bank",\n      "permissionExpires": "2027-02-15T00:00:00Z"\n    },\n    {\n      "consentId": "****-001",\n      "lfiName": "Emirates NBD",\n      "permissionExpires": "2027-03-01T00:00:00Z"\n    }\n  ]\n}</pre></div><div style="background:#1C2333;border-radius:6px;padding:10px;font-size:11px;color:#8B949E;line-height:1.6"><span style="color:#56D364;font-weight:700">TOGGLE BEHAVIOUR:</span> First click on Expiry Date column header sends <code style="color:#7EE787">order=asc</code> (soonest first). Second click sends <code style="color:#7EE787">order=desc</code>. Column header shows sort chevron indicator.</div>'
  },

  /* ── CMI-04 Consent Detail ────────────────────────────────── */

  'cmi04|default':{
    title:'CMI-04 — DATA SHARING CONSENT DETAIL',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — Full Data Sharing consent detail</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents/****-001</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\n{\n  "consentId": "****-001",\n  "lfiName": "Emirates NBD",\n  "lfiLogoUrl": "https://hub.adcb.com/logos/enbd.png",\n  "accountIban": "AE** **** **** 3456",\n  "accountNumber": "****-7890",\n  "consentType": "DataSharing",\n  "status": "Authorized",\n  "createdAt": "2025-08-01T09:00:00Z",\n  "permissionExpires": "2027-03-01T00:00:00Z",\n  "permissions": [\n    "ReadAccountsBasic",\n    "ReadBalances",\n    "ReadTransactions"\n  ],\n  "activityLog": [\n    {\n      "event": "ConsentCreated",\n      "actor": "TPP",\n      "timestamp": "2025-08-01T09:00:00Z"\n    },\n    {\n      "event": "Authorized",\n      "actor": "Customer",\n      "timestamp": "2025-08-01T09:02:00Z"\n    }\n  ]\n}</pre></div>'
  },

  'cmi04|single':{
    title:'CMI-04 — SINGLE PAYMENT CONSENT DETAIL',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — Single Immediate Payment consent</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents/****-011</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\n{\n  "consentId": "****-011",\n  "lfiName": "Dubai Islamic Bank",\n  "accountIban": "AE** **** **** 5566",\n  "consentType": "Payment",\n  "paymentSubType": "SingleImmediate",\n  "status": "Authorized",\n  "permissionExpires": null,\n  "paymentDetails": {\n    "creditorIban": "AE** **** **** 3456",\n    "creditorName": "Acme Trading LLC",\n    "amount": 2500.00,\n    "currency": "AED",\n    "reference": "INV-2026-0041",\n    "copResult": "Match",\n    "riskInformation": {\n      "paymentRiskScore": "Low",\n      "fraudIndicator": false\n    }\n  },\n  "activityLog": [\n    {\n      "event": "ConsentCreated",\n      "actor": "TPP",\n      "timestamp": "2026-04-10T08:00:00Z"\n    },\n    {\n      "event": "Authorized",\n      "actor": "Customer",\n      "timestamp": "2026-04-10T08:03:00Z"\n    }\n  ]\n}</pre></div><div style="background:#1C2333;border-radius:6px;padding:10px;font-size:11px;color:#8B949E;line-height:1.6"><span style="color:#56D364;font-weight:700">NOTE:</span> <code style="color:#7EE787">creditorIban</code> masked to last 4 digits (confirmed AC-22). <code style="color:#7EE787">copResult</code> displayed as "Match" / "No Match" / "Partial Match". <code style="color:#7EE787">permissionExpires: null</code> = single-use, no expiry date.</div>'
  },

  'cmi04|vrp':{
    title:'CMI-04 — MULTI-PAYMENT (VRP) CONSENT DETAIL',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — VRP consent full detail</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents/****-042</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\n{\n  "consentId": "****-042",\n  "lfiName": "First Abu Dhabi Bank",\n  "accountIban": "AE** **** **** 7890",\n  "consentType": "VRP",\n  "status": "Authorized",\n  "permissionExpires": "2027-02-15T00:00:00Z",\n  "vrpDetails": {\n    "scheduleType": "Recurring",\n    "frequency": "Monthly",\n    "maxAmountPerPayment": 5000.00,\n    "currency": "AED",\n    "creditors": [\n      {\n        "creditorIban": "AE** **** **** 1234",\n        "creditorName": "Gulf Properties LLC"\n      },\n      {\n        "creditorIban": "AE** **** **** 5678",\n        "creditorName": "Abu Dhabi Utilities"\n      }\n    ]\n  }\n}</pre></div><div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — Payment execution history (paginated)</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents/****-042/payments?pageSize=10</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\n{\n  "total": 3,\n  "pageSize": 10,\n  "payments": [\n    {\n      "paymentId": "PAY-****-091",\n      "creditorIban": "AE** **** **** 1234",\n      "amount": 5000.00,\n      "currency": "AED",\n      "status": "Completed",\n      "executedAt": "2026-03-15T09:00:00Z"\n    },\n    {\n      "paymentId": "PAY-****-074",\n      "creditorIban": "AE** **** **** 5678",\n      "amount": 350.00,\n      "currency": "AED",\n      "status": "Completed",\n      "executedAt": "2026-02-15T09:00:00Z"\n    },\n    {\n      "paymentId": "PAY-****-061",\n      "creditorIban": "AE** **** **** 1234",\n      "amount": 5000.00,\n      "currency": "AED",\n      "status": "Failed",\n      "executedAt": "2026-01-15T09:00:00Z"\n    }\n  ]\n}</pre></div>'
  },

  'cmi04|combined':{
    title:'CMI-04 — COMBINED CONSENT DETAIL',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — Combined consent with 2 RAR objects</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents/****-099</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\n{\n  "consentId": "****-099",\n  "lfiName": "ADIB",\n  "accountIban": "AE** **** **** 2211",\n  "consentType": "Combined",\n  "status": "Authorized",\n  "permissionExpires": "2027-03-20T00:00:00Z",\n  "rarObjects": [\n    {\n      "rarIndex": 1,\n      "type": "DataSharing",\n      "permissions": [\n        "ReadAccountsBasic",\n        "ReadBalances",\n        "ReadTransactions",\n        "ReadStandingOrders"\n      ]\n    },\n    {\n      "rarIndex": 2,\n      "type": "Payment",\n      "paymentSubType": "VRP",\n      "paymentDetails": {\n        "creditorIban": "AE** **** **** 4321",\n        "creditorName": "ADIB Home Finance",\n        "maxAmountPerPayment": 8000.00,\n        "currency": "AED",\n        "frequency": "Monthly"\n      }\n    }\n  ],\n  "activityLog": [\n    {\n      "event": "ConsentCreated",\n      "actor": "TPP",\n      "timestamp": "2025-10-05T08:15:00Z"\n    },\n    {\n      "event": "Authorized",\n      "actor": "Customer",\n      "timestamp": "2025-10-05T08:18:00Z"\n    }\n  ]\n}</pre></div><div style="background:#1C2333;border-radius:6px;padding:10px;font-size:11px;color:#8B949E;line-height:1.6"><span style="color:#56D364;font-weight:700">RENDER RULE (AC-25):</span> Each RAR object renders in a separate section or tab. RAR 1 shows Data Sharing permissions list. RAR 2 shows Payment details. Max 2 RAR objects per Combined consent.</div>'
  },

  'cmi04|intl':{
    title:'CMI-04 — INTERNATIONAL PAYMENT DETAIL',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — International payment with FX details</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents/****-077</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\n{\n  "consentId": "****-077",\n  "lfiName": "RAK Bank",\n  "accountIban": "AE** **** **** 9988",\n  "consentType": "International",\n  "status": "Authorized",\n  "permissionExpires": null,\n  "paymentDetails": {\n    "creditorIban": "GB** **** **** 5566",\n    "creditorName": "London Vendor Ltd",\n    "amount": 1000.00,\n    "debitCurrency": "AED",\n    "creditCurrency": "GBP",\n    "copResult": "Match"\n  },\n  "fxDetails": {\n    "exchangeRate": 4.6821,\n    "currencyPair": "AED/GBP",\n    "rateTimestamp": "2026-04-16T07:00:00Z",\n    "rateExpiresAt": "2026-04-16T07:30:00Z"\n  },\n  "firstTimeLimitIndicator": {\n    "aedLimit": 15000,\n    "currency": "AED",\n    "limitApplied": true,\n    "description": "CBUAE first-time international payment limit"\n  }\n}</pre></div><div style="background:#1C2333;border-radius:6px;padding:10px;font-size:11px;color:#8B949E;line-height:1.6"><span style="color:#56D364;font-weight:700">NOTE (AC-26):</span> <code style="color:#7EE787">fxDetails</code> shows rate, pair, and rate expiry. <code style="color:#7EE787">firstTimeLimitIndicator.aedLimit: 15000</code> triggers the AED 15K first-time limit notice displayed on screen. <code style="color:#7EE787">permissionExpires: null</code> = single-use.</div>'
  },

  'cmi04|ac28':{
    title:'CMI-04 — AC-28 ACTION BUTTONS VISIBLE',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — Authorized consent; actions rendered</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents/****-001</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\n{\n  "consentId": "****-001",\n  "lfiName": "Emirates NBD",\n  "accountIban": "AE** **** **** 3456",\n  "consentType": "DataSharing",\n  "status": "Authorized",\n  "permissionExpires": "2027-03-01T00:00:00Z",\n  "allowedActions": ["Revoke", "Suspend"]\n}</pre></div><div style="background:#1C2333;border-radius:6px;padding:10px;font-size:11px;color:#8B949E;line-height:1.6"><span style="color:#56D364;font-weight:700">RENDER RULE (AC-28):</span> Frontend reads <code style="color:#7EE787">allowedActions</code> array to determine which buttons to render. <code style="color:#7EE787">"Revoke"</code> → red button. <code style="color:#7EE787">"Suspend"</code> → amber button. Both visible and enabled when <code style="color:#7EE787">status === "Authorized"</code>. Button set changes if status is Suspended (only Revoke shown).</div>'
  },

  'cmi04|readonly':{
    title:'CMI-04 — AC-29 READ-ONLY (REVOKED STATE)',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">GET — Revoked consent; no actions returned</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#0D4A1F;color:#56D364">GET</span><code style="font-family:monospace;font-size:11px;color:#7EE787">/api/v2.0/consents/****-005</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">HTTP 200 OK\n{\n  "consentId": "****-005",\n  "lfiName": "Emirates NBD",\n  "accountIban": "AE** **** **** 3456",\n  "consentType": "DataSharing",\n  "status": "Revoked",\n  "stateReason": "Revoked by customer",\n  "terminatedDate": "2026-01-15T14:30:00Z",\n  "allowedActions": []\n}</pre></div><div style="background:#1C2333;border-radius:6px;padding:10px;font-size:11px;color:#8B949E;line-height:1.6"><span style="color:#56D364;font-weight:700">RENDER RULE (AC-29):</span> <code style="color:#7EE787">allowedActions: []</code> → no action buttons rendered. Detail is read-only. Applies to Revoked, Consumed, and Rejected states. API-level enforcement also blocks DELETE on terminal states (returns 400).</div>'
  },

  'cmi04|ac30':{
    title:'CMI-04 — AC-30 REVOKE CONFIRMATION',
    html:'<div style="margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">DELETE — Revoke consent (after confirmation dialog)</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;background:#5C1A1A;color:#F85149">DELETE</span><code style="font-family:monospace;font-size:11px;color:#F85149">/api/v2.0/consents/****-001</code></div><pre style="background:#161B22;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;color:#C9D1D9;line-height:1.6;overflow-x:auto;white-space:pre-wrap">Request Headers:\nAuthorization: Bearer &lt;m2m+user-token&gt;\nX-Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000\n\nHTTP 204 No Content\n\n--- Audit log created automatically ---\n{\n  "auditId": "AUD-****-338",\n  "consentId": "****-001",\n  "actor": "TPP",\n  "actorLabel": "ADCB Open Finance Portal",\n  "event": "Revoked",\n  "previousState": "Authorized",\n  "newState": "Revoked",\n  "timestamp": "2026-04-16T11:05:00Z"\n}</pre></div><div style="background:#1C2333;border-radius:6px;padding:10px;font-size:11px;color:#8B949E;line-height:1.6"><span style="color:#F85149;font-weight:700">CONFIRMATION DIALOG FIELDS (AC-30):</span> Before DELETE fires, the dialog displays: masked Consent ID (****-001), LFI Name (Emirates NBD), Consent Type (Data Sharing), and the warning message: <em>"Revoking this consent is permanent and cannot be undone. The customer will lose access immediately."</em> User must click Confirm Revoke to proceed. Cancel returns to detail view without action.</div>'
  }

};
