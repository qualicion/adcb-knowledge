/* ============================================================
   ADCB Open Finance \u2014 SIP + CoP Flow Data
   Single Instant Payment + Confirmation of Payee section:
   flow steps, user stories, RST scenarios, and gaps.
   No ES modules \u2014 plain var declarations for vanilla JS inclusion.
   ============================================================ */

/* ============================================================
   1. SIP_FLOW_STEPS
   Ten steps describing the end-to-end SIP + CoP payment flow.
   Steps 3-4: copPhase:true
   Step 6:    securityPhase:true
   ============================================================ */

var SIP_FLOW_STEPS = [

  /* ----------------------------------------------------------
     Step 1 \u2014 User Opens Payment Checkout
  ---------------------------------------------------------- */
  {
    num: 1,
    color: '#1E40AF',
    title: 'User Opens Payment Checkout',
    desc: 'The user arrives at a merchant checkout or P2P transfer screen inside a TPP app. They see the payee name, payee IBAN, amount (AED), payment purpose, and a list of payment methods. They select \u201cPay by Bank\u201d to initiate the Open Finance payment rail.',
    tags: [
      { label: 'FRONTEND',    cssClass: 'tag-blue'   },
      { label: '/payments',   cssClass: 'tag-gray'   }
    ],
    detail: {
      title: 'Checkout Fields Presented to User',
      rows: [
        { th: 'Payee Name',      td: 'Displayed as provided by the merchant or P2P initiator' },
        { th: 'Payee IBAN',      td: 'Full IBAN shown; will be verified via CoP in Step 3' },
        { th: 'Amount',          td: 'AED only. Minimum 0.01 AED. Displayed with currency symbol' },
        { th: 'Purpose',         td: 'Free-text or coded purpose (e.g. GDDS, SALA) from merchant' },
        { th: 'Payment Method',  td: 'User selects \u201cPay by Bank\u201d to proceed via Open Finance rail' }
      ]
    }
  },

  /* ----------------------------------------------------------
     Step 2 \u2014 Select Account or Bank
  ---------------------------------------------------------- */
  {
    num: 2,
    color: '#1E40AF',
    title: 'Select Account or Bank',
    desc: 'The TPP presents the user with two modes: select a previously linked account (fast path, account number and masked IBAN shown) or choose a bank from the LFI directory (new bank, full OAuth redirect required). The LFI directory is fetched from the OF Hub registry.',
    tags: [
      { label: 'FRONTEND',          cssClass: 'tag-blue'   },
      { label: 'GET /user-accounts', cssClass: 'tag-gray'   }
    ],
    detail: {
      title: 'Account Selection Modes',
      rows: [
        { cells: ['Mode', 'How It Works', 'When Used'] },
        { cells: ['Account Mode',  'User picks from previously linked and consented accounts. IBAN pre-filled.', 'Returning users with existing consent' ] },
        { cells: ['LFI Mode',      'User selects a bank from the OF Hub LFI directory. Triggers full OAuth redirect.', 'First use or new bank' ] }
      ]
    }
  },

  /* ----------------------------------------------------------
     Step 3 \u2014 TPP Sends CoP Query (CoP phase)
  ---------------------------------------------------------- */
  {
    num: 3,
    color: '#E65100',
    title: 'TPP Sends CoP Query',
    desc: 'Before creating a payment consent the TPP MUST call the CoP endpoint. This is a mandatory fraud-prevention step required by CBUAE. The OF Hub routes the query to the payee\u2019s bank, which checks whether the supplied name matches the account holder registered against the IBAN.',
    copPhase: true,
    tags: [
      { label: 'CoP QUERY',        cssClass: 'tag-orange' },
      { label: 'POST /cop-query',  cssClass: 'tag-gray'   },
      { label: 'VIA OF HUB',       cssClass: 'tag-gray'   }
    ],
    detail: {
      title: 'CoP Query: Technical Parameters',
      rows: [
        { th: 'Endpoint',        td: 'POST /api/v2.0/customers/action/cop-query (via OF Hub)' },
        { th: 'Payee Name',      td: 'Name string as entered by the user or provided by the merchant. Must not be empty.' },
        { th: 'Payee IBAN',      td: 'Full IBAN of the intended recipient account.' },
        { th: 'Authentication',  td: 'mTLS (transport) + client credentials token (application-level). No user token required.' },
        { th: 'SLA',             td: '500 ms hub-to-LFI round trip. TPP must implement its own timeout (see G-03).' },
        { th: 'Cost',            td: '0.5 fils when bundled with a payment consent. 2.5 fils for a standalone CoP query.' }
      ]
    }
  },

  /* ----------------------------------------------------------
     Step 4 \u2014 CoP Result \u2014 Match Decision (CoP phase)
  ---------------------------------------------------------- */
  {
    num: 4,
    color: '#E65100',
    title: 'CoP Result \u2014 Match Decision',
    desc: 'The payee\u2019s bank returns a match verdict. The TPP UI must display the result and \u2014 for anything other than an exact match \u2014 obtain explicit user acknowledgement before allowing the payment to proceed. If the TPP skips CoP entirely it is liable for a 250 AED penalty per payment.',
    copPhase: true,
    tags: [
      { label: 'DECISION POINT',    cssClass: 'tag-orange' },
      { label: 'USER CONFIRMATION', cssClass: 'tag-gray'   }
    ],
    detail: {
      title: 'Match Verdicts and Required UI Response',
      rows: [
        { cells: ['Verdict',        'Colour Signal', 'Required TPP Action'] },
        { cells: ['Exact Match',    'Green badge',   'Show green badge. Payment may proceed automatically.' ] },
        { cells: ['Partial Match',  'Amber warning', 'Show amber warning with suggested name. User must tick a checkbox to confirm they wish to proceed.' ] },
        { cells: ['No Match',       'Red warning',   'Show prominent red warning. Require extra explicit confirmation step. Strongly recommend user cancels.' ] },
        { cells: ['Unavailable',    'Grey notice',   'CoP service unavailable. Inform user that name could not be verified. User may still proceed at own risk.' ] },
        { cells: ['Skipped (penalty)', 'N/A',        'TPP owes 250 AED per-payment liability to CBUAE if CoP was not attempted.' ] }
      ]
    }
  },

  /* ----------------------------------------------------------
     Step 5 \u2014 User Reviews Payment Details
  ---------------------------------------------------------- */
  {
    num: 5,
    color: '#1E40AF',
    title: 'User Reviews Payment Details',
    desc: 'A full-page payment summary screen is shown before consent is created. The CoP result badge appears alongside the payee details. The user must actively tap a confirm button to proceed \u2014 no auto-submit.',
    tags: [
      { label: 'REVIEW SCREEN',  cssClass: 'tag-blue' },
      { label: 'CoP STATUS SHOWN', cssClass: 'tag-orange' }
    ],
    detail: {
      title: 'Payment Summary Fields',
      rows: [
        { th: 'Amount',     td: 'AED value with two decimal places, formatted clearly' },
        { th: 'Payee',      td: 'Payee name + IBAN + CoP result badge (green / amber / red / grey)' },
        { th: 'Payer',      td: 'Selected account nickname or bank name + masked IBAN' },
        { th: 'Purpose',    td: 'Purpose code or free-text as entered at Step 1' },
        { th: 'Reference',  td: 'End-to-end reference generated or provided by merchant' },
        { th: 'Action',     td: 'Confirm button (active) and Cancel link' }
      ]
    }
  },

  /* ----------------------------------------------------------
     Step 6 \u2014 TPP Encrypts PII & Initiates PAR (security phase)
  ---------------------------------------------------------- */
  {
    num: 6,
    color: '#C41E24',
    title: 'TPP Encrypts PII & Initiates PAR',
    desc: 'All personally identifiable information (PII) in the payment consent must be encrypted before leaving the TPP server. The TPP builds the consent payload, signs it as a JWS, wraps it in JWE encryption, generates a PKCE code challenge, signs the full request as a JAR, and posts to the Pushed Authorisation Request (PAR) endpoint.',
    securityPhase: true,
    tags: [
      { label: 'PII ENCRYPTION',                  cssClass: 'tag-red'  },
      { label: 'POST /payment-consents/initiate',  cssClass: 'tag-gray' },
      { label: 'PAR REQUEST',                      cssClass: 'tag-gray' }
    ],
    detail: {
      title: 'PAR Initiation Sub-Steps',
      rows: [
        { th: '1. Build PII Payload',   td: 'Assemble consent body: amount, creditor IBAN, creditor name, debtor account, CoP result, Risk Info Block.' },
        { th: '2. Sign as JWS',         td: 'Sign the payload using the TPP\u2019s private key (RS256 or PS256). Produces a compact JWS.' },
        { th: '3. Encrypt as JWE',      td: 'Encrypt the JWS using the OF Hub\u2019s public key (RSA-OAEP + A256GCM). PII is now opaque in transit.' },
        { th: '4. Generate PKCE',       td: 'Create a cryptographically random code_verifier (43\u2013128 chars). Hash it with SHA-256 to get code_challenge.' },
        { th: '5. Sign JAR',            td: 'Wrap the JWE, PKCE challenge, state, and nonce into a JWT and sign as a JAR (JWT-Secured Auth Request).' },
        { th: '6. POST to PAR',         td: 'POST the signed JAR to /par endpoint with client_assertion (private_key_jwt). Receive request_uri in response.' },
        { th: '7. Get request_uri',     td: 'Store the request_uri (valid ~60 s). Redirect the user to the bank\u2019s authorisation endpoint with this URI.' }
      ]
    }
  },

  /* ----------------------------------------------------------
     Step 7 \u2014 User Authorizes at Bank
  ---------------------------------------------------------- */
  {
    num: 7,
    color: '#5B21B6',
    title: 'User Authorizes at Bank',
    desc: 'The user is redirected to their bank\u2019s (LFI\u2019s) hosted authorization page. The bank shows the full payment details: amount, payee name and IBAN, reference, and purpose. The user logs in with their bank credentials and confirms with SCA (biometric or OTP). The bank records the authorised payment consent.',
    tags: [
      { label: 'BANK-HOSTED',    cssClass: 'tag-purple' },
      { label: 'SCA (2-FACTOR)', cssClass: 'tag-gray'   }
    ]
  },

  /* ----------------------------------------------------------
     Step 8 \u2014 TPP Exchanges Code for Tokens
  ---------------------------------------------------------- */
  {
    num: 8,
    color: '#15803D',
    title: 'TPP Exchanges Code for Tokens',
    desc: 'After the user authorises at the bank, the bank redirects back to the TPP callback URI with an authorisation code and state parameter. The TPP validates the state, exchanges the code for an access token using PKCE and private_key_jwt authentication, stores the token securely, and verifies the nonce to prevent replay attacks.',
    tags: [
      { label: 'POST /payment-consents/callback', cssClass: 'tag-green' },
      { label: 'PKCE + PRIVATE_KEY_JWT',          cssClass: 'tag-gray'  }
    ],
    detail: {
      title: 'Callback Processing Steps',
      rows: [
        { th: 'Validate State',    td: 'Compare state parameter in callback against the value stored before PAR. Reject if mismatch (CSRF protection).' },
        { th: 'Exchange Code',     td: 'POST to token endpoint with code, code_verifier (PKCE), and client_assertion (private_key_jwt). Receive access token.' },
        { th: 'Store Tokens',      td: 'Securely store access token (and refresh token if issued) associated with the payment consent ID.' },
        { th: 'Verify Nonce',      td: 'Check the nonce in the id_token matches the nonce sent in PAR. Reject if mismatch (replay protection).' },
        { th: 'Update Status',     td: 'Mark the payment consent record as Authorized in the TPP\u2019s own database. Ready for payment submission.' }
      ]
    }
  },

  /* ----------------------------------------------------------
     Step 9 \u2014 Background: Execute Payment PI-6
  ---------------------------------------------------------- */
  {
    num: 9,
    color: '#15803D',
    title: 'Background: Execute Payment PI-6',
    desc: 'Once the token exchange completes the TPP immediately submits the payment in the background without any further user interaction. The payment request body is signed as a JWT (detached JWS), includes an idempotency key to prevent duplicate submissions, and is sent to the payment execution endpoint. The OF Hub routes it to the payee\u2019s LFI via the IPP rail.',
    tags: [
      { label: 'POST /payments (PI-6)', cssClass: 'tag-green' },
      { label: 'JWT-SIGNED',            cssClass: 'tag-gray'  },
      { label: 'IDEMPOTENCY KEY',       cssClass: 'tag-gray'  }
    ],
    detail: {
      title: 'Payment Execution: Technical Detail',
      rows: [
        { th: 'Endpoint',        td: 'POST /api/v2.0/payments (PI-6 payment initiation endpoint via OF Hub)' },
        { th: 'Content-Type',    td: 'application/jose (detached JWS body signature required)' },
        { th: 'Auth',            td: 'Bearer {access_token} obtained in Step 8 + mTLS client certificate' },
        { th: 'Idempotency',     td: 'x-idempotency-key header (UUID v4). Hub rejects duplicate submissions with same key within 24 h.' },
        { th: 'Execution SLA',   td: '3 seconds to terminal status for domestic IPP payments under normal conditions.' },
        { th: 'After Success',   td: 'Store DomesticPaymentId returned by Hub. Begin polling GET /payments/{id} (PI-8) for status updates.' }
      ]
    }
  },

  /* ----------------------------------------------------------
     Step 10 \u2014 User Sees Payment Receipt
  ---------------------------------------------------------- */
  {
    num: 10,
    color: '#00695C',
    title: 'User Sees Payment Receipt',
    desc: 'The TPP polls the payment status endpoint (PI-8) until a terminal status is reached. The receipt screen displays the final status, transaction reference, amount, timestamp, and payee details. For non-terminal statuses the TPP shows a loading indicator and continues polling at an appropriate interval.',
    tags: [
      { label: 'STATUS SCREEN',          cssClass: 'tag-teal' },
      { label: 'GET /status (PI-8 POLLING)', cssClass: 'tag-gray' }
    ],
    detail: {
      title: 'Payment Status Values (PI-8)',
      rows: [
        { cells: ['Status Code',                      'Meaning',                                                       'Terminal?'] },
        { cells: ['Pending',                           'Payment received by Hub, submitted to IPP. Money not yet moved.', 'No'  ] },
        { cells: ['AcceptedSettlementInProcess',       'Debtor account debited. Credit leg in progress.',                 'No'  ] },
        { cells: ['Accepted',                          'Both legs settled. Payment fully complete. Recipient credited.',  'Yes' ] },
        { cells: ['Rejected',                          'Payment refused. Reason code provided. No funds moved.',          'Yes' ] },
        { cells: ['Cancelled',                         'Payment cancelled before execution. Consent was withdrawn.',      'Yes' ] }
      ]
    }
  }

];


/* ============================================================
   2. SIP_COP_STORIES
   Eight user stories covering UI, API, and performance aspects
   of the CoP integration within the SIP flow.
   ============================================================ */

var SIP_COP_STORIES = [

  /* --- UI-01 ------------------------------------------------ */
  {
    id: 'UI-01',
    title: 'Show CoP check result before payment',
    type: 'ui',
    priority: 'high',
    storyText: '<strong>As a</strong> user initiating a payment via a TPP app,<br><strong>I want</strong> to see whether the recipient\u2019s name matches their bank account before I confirm,<br><strong>So that</strong> I can avoid sending money to the wrong or fraudulent account.',
    acs: [
      'Given the CoP query returns Exact Match, when the review screen renders, then a green badge labelled \u201cName Verified\u201d appears next to the payee name.',
      'Given the CoP query returns Partial Match, when the review screen renders, then an amber warning shows the bank\u2019s suggested name alongside the entered name, and the confirm button is disabled until the user ticks a checkbox.',
      'Given the CoP query returns No Match, when the review screen renders, then a prominent red warning is displayed, the confirm button label changes to \u201cProceed Anyway\u201d, and a second confirmation dialog is required.',
      'Given the CoP query returns Unavailable (service down or timeout), when the review screen renders, then a grey notice informs the user that name verification is currently unavailable and they proceed at their own risk.',
      'Given any CoP result other than Exact Match, when the user proceeds to payment, then the exact CoP result code is included in the payment consent payload sent to the backend.',
      'Given the CoP result badge is displayed, when the page is rendered in any supported browser, then the badge colour is not the sole indicator \u2014 an icon and text label are also present (accessibility).'
    ]
  },

  /* --- UI-02 ------------------------------------------------ */
  {
    id: 'UI-02',
    title: 'Show loading state during CoP check',
    type: 'ui',
    priority: 'high',
    storyText: '<strong>As a</strong> user who has selected a payee and bank,<br><strong>I want</strong> to see a clear loading indicator while the CoP check is running,<br><strong>So that</strong> I understand the app is working and do not submit the payment twice.',
    acs: [
      'Given the user has selected a bank and the CoP query has been sent, when the result has not yet been received, then a spinner or skeleton loader is visible in the payee verification area.',
      'Given the loading state is active, when the user attempts to tap the confirm/continue button, then the button is disabled and non-interactive.',
      'Given the CoP query has not resolved after 5 seconds, when the loading state is still active, then a message appears: \u201cThis is taking longer than usual \u2014 please wait.\u201d',
      'Given the CoP query has not resolved after 10 seconds, when the timeout fires, then the loading state ends, the result is treated as Unavailable, and the user sees the grey unavailable notice from UI-01.'
    ]
  },

  /* --- API-01 ----------------------------------------------- */
  {
    id: 'API-01',
    title: 'Create CoP query endpoint',
    type: 'api',
    priority: 'high',
    storyText: '<strong>As a</strong> TPP backend developer,<br><strong>I want</strong> a backend endpoint that accepts a payee name and IBAN and returns the CoP result from the OF Hub,<br><strong>So that</strong> the TPP frontend does not need to hold OF Hub credentials or handle mTLS directly.',
    acs: [
      'Given a valid request body, when POST /api/v2.0/cop/query is called, then the backend authenticates to the OF Hub using mTLS and a client credentials token and proxies the query.',
      'Given the request body, when the endpoint processes it, then it requires at minimum: payeeIBAN (string, required) and payeeName (string, required).',
      'Given the OF Hub returns a response, when the backend processes it, then the endpoint returns: matchResult (one of MATCH, PARTIAL_MATCH, NO_MATCH, UNAVAILABLE), suggestedName (string or null), and confidence (number 0\u20131 or null).',
      'Given the OF Hub returns a 4xx error, when the backend receives it, then the endpoint returns HTTP 422 with an error code and human-readable message. Payment flow must not proceed.',
      'Given the OF Hub returns a 5xx error or times out, when the backend receives it, then the endpoint returns HTTP 503 with matchResult: UNAVAILABLE so the frontend can show the grey notice.',
      'Given the request arrives, when the backend calls the OF Hub, then the x-fapi-interaction-id header is forwarded and the same value is echoed in the response.',
      'Given the payee is a business, when the name comparison is performed, then both trading name and registered legal name are checked against the IBAN holder.'
    ]
  },

  /* --- API-02 ----------------------------------------------- */
  {
    id: 'API-02',
    title: 'Store CoP result with payment consent',
    type: 'api',
    priority: 'high',
    storyText: '<strong>As a</strong> TPP backend developer,<br><strong>I want</strong> the CoP result to be recorded alongside the payment consent,<br><strong>So that</strong> we have an audit trail and can include the Risk Info Block required by CBUAE.',
    acs: [
      'Given a payment consent initiation request, when the request body is received by POST /payment-consents/initiate, then it must include a cop_result object with fields: matchResult, queryTimestamp, and queryId.',
      'Given a consent is created, when it is persisted to DynamoDB, then the cop_result object is stored as an attribute on the consent record.',
      'Given a payment consent initiation request arrives without a cop_result field, when the backend validates the request, then it returns HTTP 400 with error code MISSING_COP_RESULT and logs a warning.',
      'Given a consent record that includes a cop_result, when a compliance audit query is made, then the cop_result is returned in the consent detail response alongside all other consent fields.',
      'Given the cop_result contains matchResult of PARTIAL_MATCH or NO_MATCH, when the Risk Info Block is assembled for the OF Hub, then the RiskInformationBlock.PaymentContextCode is set to flag elevated risk.'
    ]
  },

  /* --- API-03 ----------------------------------------------- */
  {
    id: 'API-03',
    title: 'Handle CoP query failures gracefully',
    type: 'api',
    priority: 'medium',
    storyText: '<strong>As a</strong> TPP backend developer,<br><strong>I want</strong> the CoP endpoint to handle all failure modes without crashing,<br><strong>So that</strong> transient network errors do not block legitimate payments unnecessarily.',
    acs: [
      'Given the OF Hub returns HTTP 4xx for a CoP query, when the backend processes the response, then it does not retry and immediately returns the 4xx error details to the frontend.',
      'Given the OF Hub returns HTTP 5xx for a CoP query, when the backend receives it, then it retries once after 500 ms and returns UNAVAILABLE if the retry also fails.',
      'Given the connection to the OF Hub drops mid-request (TCP reset or DNS failure), when the error is caught, then the backend retries once and returns UNAVAILABLE if the retry also fails.',
      'Given the OF Hub does not respond within 8 seconds (backend timeout), when the timeout fires, then the backend does not retry and immediately returns UNAVAILABLE.',
      'Given any CoP query failure or UNAVAILABLE result, when the backend handles it, then the failure reason, timestamp, and x-fapi-interaction-id are written to the structured application log at WARN level.'
    ]
  },

  /* --- PERF-01 ---------------------------------------------- */
  {
    id: 'PERF-01',
    title: 'CoP query within SLA',
    type: 'perf',
    priority: 'high',
    storyText: '<strong>As a</strong> product owner,<br><strong>I want</strong> the CoP check to complete within acceptable time bounds,<br><strong>So that</strong> users do not experience a frustrating delay at the point of payment.',
    acs: [
      'Given 100 concurrent CoP queries under load test, when results are collected, then the average end-to-end response time (TPP frontend to backend to OF Hub and back) is under 2 seconds.',
      'Given 100 concurrent CoP queries under load test, when results are collected, then the 95th percentile (p95) response time is under 4 seconds.',
      'Given the OF Hub responds within its 500 ms SLA, when the TPP backend processes the response, then the additional processing time added by the TPP (parsing, enrichment, logging) is under 100 ms.',
      'Given the TPP backend calls the OF Hub with a client credentials token, when the token is still valid (not expired), then the backend uses the cached token and does not make an additional token request per CoP query.',
      'Given a CoP query exceeds the p95 SLA threshold in production, when the monitoring system detects it, then an alert is fired to the on-call channel within 5 minutes.'
    ]
  },

  /* --- PERF-02 ---------------------------------------------- */
  {
    id: 'PERF-02',
    title: 'CoP must not slow payment flow',
    type: 'perf',
    priority: 'medium',
    storyText: '<strong>As a</strong> user initiating a payment,<br><strong>I want</strong> the CoP check to happen in the background while I am reading my payment summary,<br><strong>So that</strong> name verification does not feel like an additional waiting step.',
    acs: [
      'Given the user selects their bank in Step 2, when the bank selection is confirmed, then the TPP frontend fires the CoP query immediately without waiting for the user to navigate to the review screen.',
      'Given the CoP query is in-flight when the user reaches the review screen, when the result arrives, then the badge updates inline without a full-page refresh or navigation.',
      'Given the CoP query has not yet resolved when the review screen loads, when the screen renders, then an inline spinner appears only in the payee verification badge area, not as a full-screen overlay.',
      'Given the CoP query is measured in isolation and a baseline payment flow time without CoP is established, when CoP is added to the flow, then the total user-perceived flow time increases by no more than 3 seconds in the p95 case.'
    ]
  },

  /* --- UI-03 ------------------------------------------------ */
  {
    id: 'UI-03',
    title: 'CoP warnings must be accessible',
    type: 'ui',
    priority: 'medium',
    storyText: '<strong>As a</strong> user with accessibility needs,<br><strong>I want</strong> CoP warnings to be perceivable without relying solely on colour,<br><strong>So that</strong> I am not excluded from fraud protection because of a visual impairment.',
    acs: [
      'Given a CoP warning is displayed (partial match, no match, or unavailable), when the DOM is inspected, then the warning container has role="alert" so screen readers announce it automatically.',
      'Given a CoP badge uses colour (green, amber, red, grey), when the badge renders, then an icon (e.g. tick, warning triangle, cross, question mark) and visible text label are also present so the status is not conveyed by colour alone.',
      'Given a CoP badge is rendered on the review screen, when a screen reader user navigates to it, then the aria-label attribute describes both the verdict and the consequence (e.g. \u201cWarning: name partially matches. Confirm you want to proceed.\u201d).',
      'Given any CoP UI element, when checked against WCAG 2.1 AA contrast requirements, then all text and icon colours meet the minimum 4.5:1 contrast ratio against their background.'
    ]
  }

];


/* ============================================================
   3. SIP_RST_SECTIONS
   Seven RST (Requirements, Scenarios, Tests) sections using the
   SFDPOT heuristic mnemonic. Each section contains scenarios
   with id, title, trigger, expected, impact, risk, and oracles.
   ============================================================ */

var SIP_RST_SECTIONS = [

  /* ----------------------------------------------------------
     D \u2014 Data
  ---------------------------------------------------------- */
  {
    id: 'data',
    sfdpot: 'D',
    title: 'Data',
    desc: 'How does the system behave when the name and IBAN data fed into CoP is unusual, malformed, or at the edges of what real users enter?',
    scenarios: [
      {
        id: 'D-01',
        title: 'Arabic script payee name',
        trigger: 'User enters the payee name in Arabic script (e.g. \u0645\u062D\u0645\u062F \u0639\u0628\u062F\u0627\u0644\u0644\u0647).',
        expected: 'CoP query is sent with the Arabic string. The OF Hub routes it to the payee\u2019s LFI. Match result returned and displayed correctly.',
        impact: 'Arabic names are common in the UAE. Failure to handle them excludes a large portion of users.',
        risk: 'high',
        oracles: ['UI-01', 'API-01', 'G-02']
      },
      {
        id: 'D-02',
        title: 'Arabic name with diacritics (tashkeel)',
        trigger: 'Payee name includes diacritic marks (\u0645\u064F\u062D\u064E\u0645\u064E\u0651\u062F).',
        expected: 'System either strips diacritics before sending (normalised) or forwards as-is. Behaviour is documented. No crash or encoding error.',
        impact: 'Inconsistent handling causes false No Match verdicts for valid payees.',
        risk: 'medium',
        oracles: ['API-01', 'G-02']
      },
      {
        id: 'D-03',
        title: 'Empty payee name',
        trigger: 'The merchant or TPP sends a CoP query with an empty or whitespace-only payeeName field.',
        expected: 'Backend returns HTTP 400 with a validation error. CoP query is not forwarded to the OF Hub.',
        impact: 'Sending empty names to the OF Hub wastes billing calls and may cause unexpected LFI behaviour.',
        risk: 'medium',
        oracles: ['API-01']
      },
      {
        id: 'D-04',
        title: 'Extremely long payee name',
        trigger: 'Payee name is 500 characters long (e.g. a company name repeated).',
        expected: 'System either truncates to a documented max length or returns a 400 validation error. No crash, no silent truncation without logging.',
        impact: 'Without a defined maximum, the OF Hub may reject the request with an undocumented error.',
        risk: 'low',
        oracles: ['API-01', 'G-05']
      },
      {
        id: 'D-05',
        title: 'Special characters in payee name',
        trigger: 'Payee name contains characters such as &, <, >, \u201c, \u2019, or % (e.g. \u201cR&B Trading LLC\u201d).',
        expected: 'Characters are properly encoded in the JSON body. No XSS vector introduced. Match result returned normally.',
        impact: 'Unencoded special characters can corrupt the request or introduce injection risks.',
        risk: 'medium',
        oracles: ['API-01', 'S-04']
      },
      {
        id: 'D-06',
        title: 'Name with honorific title',
        trigger: 'Payee name includes a title such as \u201cDr.\u201d, \u201cSheikh\u201d, or \u201cH.H.\u201d',
        expected: 'CoP query is sent with the title included. If the LFI has the account registered without the title, a Partial Match may result. The UI shows the suggested name.',
        impact: 'Frequent Partial Match for common name formats erodes user trust in CoP.',
        risk: 'low',
        oracles: ['UI-01', 'G-01']
      },
      {
        id: 'D-07',
        title: 'Name in different order (first/last swapped)',
        trigger: 'User enters \u201cAhmed Mohammed\u201d but the bank has the account registered as \u201cMohammed Ahmed\u201d.',
        expected: 'CoP returns either Partial Match (if name-order-tolerant) or No Match. Not an Exact Match. UI reflects the result correctly.',
        impact: 'If the algorithm returns Exact Match for reversed names, the fraud protection value is compromised.',
        risk: 'medium',
        oracles: ['UI-01', 'G-01']
      },
      {
        id: 'D-08',
        title: 'Joint account holder name',
        trigger: 'The IBAN belongs to a joint account. The user enters one holder\u2019s name.',
        expected: 'Documented behaviour: either the primary holder\u2019s name is used for matching (and secondary names are ignored), or any holder\u2019s name triggers a match. Behaviour is consistent.',
        impact: 'Undefined joint-account behaviour causes unpredictable results for legitimate joint payees.',
        risk: 'medium',
        oracles: ['API-01', 'G-09']
      },
      {
        id: 'D-09',
        title: 'Mistyped IBAN with valid format',
        trigger: 'User enters an IBAN that passes local format validation (correct country code and length) but does not correspond to any real account.',
        expected: 'CoP returns No Match (account not found). UI shows red warning. Payment is not blocked but user is warned.',
        impact: 'If a mistyped IBAN passes silently as Unavailable, the user gets no fraud protection signal.',
        risk: 'high',
        oracles: ['UI-01', 'API-01']
      },
      {
        id: 'D-10',
        title: 'International (non-UAE) IBAN',
        trigger: 'User enters an IBAN from a non-UAE bank (e.g. GB or SA prefix).',
        expected: 'System either: (a) returns UNAVAILABLE because CoP only covers UAE LFIs, or (b) returns a clear error that CoP is not supported for this IBAN. Not silently treated as No Match.',
        impact: 'Returning No Match for an international IBAN incorrectly warns the user about a valid foreign payee.',
        risk: 'medium',
        oracles: ['API-01', 'G-08']
      },
      {
        id: 'D-11',
        title: 'SQL / script injection in name field',
        trigger: 'The payeeName field contains a payload such as: \'; DROP TABLE payments; --',
        expected: 'The value is treated as a plain string, parameterised before any DB operation, and forwarded safely. No SQL execution. No 500 error.',
        impact: 'Injection via the CoP name field is a direct security risk if inputs are not sanitised.',
        risk: 'critical',
        oracles: ['API-01', 'S-04']
      },
      {
        id: 'D-12',
        title: 'Business trading name vs registered legal name',
        trigger: 'User enters a well-known trading name (e.g. \u201cCarrefour\u201d) but the bank account is registered to the legal entity (\u201cMajid Al Futtaim Hypermarkets LLC\u201d).',
        expected: 'CoP returns Partial Match or No Match. The suggested name shown to the user is the registered legal name. User can make an informed decision.',
        impact: 'If trading names always produce No Match for legitimate businesses, users lose trust in CoP and proceed through all warnings habitually.',
        risk: 'medium',
        oracles: ['API-01', 'G-01']
      }
    ]
  },

  /* ----------------------------------------------------------
     F \u2014 Function
  ---------------------------------------------------------- */
  {
    id: 'function',
    sfdpot: 'F',
    title: 'Function',
    desc: 'Does the system do the right thing in unusual but valid functional scenarios, edge cases in the flow, and interactions between features?',
    scenarios: [
      {
        id: 'F-01',
        title: 'CoP on a closed or frozen account IBAN',
        trigger: 'The payee IBAN belongs to an account that is closed or frozen at the LFI.',
        expected: 'CoP may return No Match (account not active) or UNAVAILABLE depending on LFI implementation. UI warns the user. Payment does not proceed silently.',
        impact: 'Sending funds to a closed account may result in failed settlement and a difficult reversal process.',
        risk: 'high',
        oracles: ['UI-01', 'G-10']
      },
      {
        id: 'F-02',
        title: 'User edits payee name after seeing CoP result',
        trigger: 'CoP returns Partial Match. The user edits the payee name field to match the suggested name, then tries to proceed.',
        expected: 'Editing the payee name after CoP has run either: (a) triggers a new CoP query automatically, or (b) is not possible (field is locked after CoP). Behaviour is documented.',
        impact: 'Allowing name edits post-CoP without re-querying undermines the fraud prevention purpose.',
        risk: 'high',
        oracles: ['UI-01', 'G-22']
      },
      {
        id: 'F-03',
        title: 'User corrects IBAN after No Match and retries',
        trigger: 'CoP returns No Match. The user realises they mistyped the IBAN, corrects it, and triggers a new CoP query.',
        expected: 'The UI provides a mechanism to update the IBAN and re-run CoP. The new query result replaces the old one on the review screen.',
        impact: 'Without a retry path, the user is forced to abandon the entire payment and start again.',
        risk: 'medium',
        oracles: ['UI-01', 'G-16']
      },
      {
        id: 'F-04',
        title: 'TPP calls payment API without CoP result in payload',
        trigger: 'A developer omits the cop_result field when calling POST /payment-consents/initiate.',
        expected: 'Backend returns HTTP 400 MISSING_COP_RESULT. The payment consent is not created. The 250 AED liability event is logged.',
        impact: 'Without enforcement, TPPs can skip CoP and still process payments, removing all fraud protection.',
        risk: 'critical',
        oracles: ['API-02', 'G-21']
      },
      {
        id: 'F-05',
        title: 'CoP result is stale (>2 hours old) when payment is submitted',
        trigger: 'User runs CoP at 10:00, leaves the app idle, and submits the payment at 12:30.',
        expected: 'The backend detects the cop_result.queryTimestamp is older than the allowed window (e.g. 2 hours). It either rejects the consent with STALE_COP_RESULT or re-validates. Behaviour is documented.',
        impact: 'A name change at the LFI between CoP and payment submission makes the CoP result misleading.',
        risk: 'high',
        oracles: ['API-02', 'G-11']
      },
      {
        id: 'F-06',
        title: 'Duplicate payment submission with same idempotency key',
        trigger: 'The TPP sends POST /payments twice with the same x-idempotency-key within 24 hours (e.g. due to a network retry).',
        expected: 'The second request returns HTTP 200 with the original payment response. No second payment is executed. The idempotency key is consumed.',
        impact: 'Without idempotency enforcement, network retries cause double charges.',
        risk: 'critical',
        oracles: ['API-02']
      },
      {
        id: 'F-07',
        title: 'CoP risk flag not used in Risk Info Block',
        trigger: 'CoP returns No Match. The TPP developer forgets to set the elevated risk flag in the Risk Info Block.',
        expected: 'The backend validates the Risk Info Block against the cop_result. If the risk flag is absent for a No Match result, it returns HTTP 400 RISK_FLAG_REQUIRED.',
        impact: 'Missing risk flags mean CBUAE compliance reporting is inaccurate.',
        risk: 'medium',
        oracles: ['API-02']
      },
      {
        id: 'F-08',
        title: 'Recurring / VRP payment \u2014 CoP on first payment only',
        trigger: 'A Variable Recurring Payment (VRP) is set up. CoP is run on the first payment. Subsequent payments are executed automatically.',
        expected: 'Documented policy: CoP is required on consent creation only, or on every execution. If only on creation, the policy is clearly stated in the TPP developer docs.',
        impact: 'If the payee\u2019s name changes between recurring payments, the original CoP result is misleading.',
        risk: 'medium',
        oracles: ['API-02', 'G-18']
      },
      {
        id: 'F-09',
        title: 'Race condition: two CoP queries for the same IBAN simultaneously',
        trigger: 'Two browser tabs initiate CoP queries for the same payee IBAN at the same moment (e.g. user double-taps).',
        expected: 'Both queries are processed independently. No data is mixed between the two requests. Each response is matched to its originating request via x-fapi-interaction-id.',
        impact: 'Mixed responses could show the wrong CoP result for a given payment context.',
        risk: 'medium',
        oracles: ['API-01', 'P-05']
      }
    ]
  },

  /* ----------------------------------------------------------
     T \u2014 Time
  ---------------------------------------------------------- */
  {
    id: 'time',
    sfdpot: 'T',
    title: 'Time',
    desc: 'How do timeouts, windows, and time-sensitive state interact across the CoP and payment flow?',
    scenarios: [
      {
        id: 'T-01',
        title: 'Three conflicting timeout values',
        trigger: 'UI-02 sets a 10-second frontend timeout. API-03 sets an 8-second backend timeout. The OF Hub SLA is 500 ms. These are tested simultaneously under slow network conditions.',
        expected: 'A defined timeout hierarchy exists: OF Hub (500 ms) < backend (8 s) < frontend (10 s). Each layer fires independently. The frontend does not rely on the backend timeout to cancel its spinner.',
        impact: 'If timeouts are uncoordinated, the user may see a spinner for 10 seconds while the backend has already returned UNAVAILABLE.',
        risk: 'high',
        oracles: ['UI-02', 'API-03', 'PERF-01', 'G-03']
      },
      {
        id: 'T-02',
        title: 'CoP result is 2 hours old when user submits payment',
        trigger: 'User completes CoP at 09:00 but does not confirm payment until 11:05 (over 2 hours later).',
        expected: 'The backend detects the stale CoP result and either: (a) rejects the consent with a clear error prompting re-verification, or (b) silently accepts it with the staleness noted in the audit log. Policy is documented.',
        impact: 'Stale CoP results undermine fraud protection if account ownership changes are not detected.',
        risk: 'high',
        oracles: ['API-02', 'G-11']
      },
      {
        id: 'T-03',
        title: 'Auth window conflict: PAR URI expires before user completes bank login',
        trigger: 'The PAR request_uri is valid for 60 seconds. The user takes 90 seconds at the bank login screen (e.g. forgot password flow).',
        expected: 'The bank returns an error indicating the request_uri has expired. The TPP catches this in the callback and shows the user a clear message with a \u201cTry again\u201d option. No partial consent is created.',
        impact: 'An expired PAR URI causing a silent failure leaves the user confused with no clear recovery path.',
        risk: 'medium',
        oracles: ['API-01']
      },
      {
        id: 'T-04',
        title: 'CoP burst: 50 queries in 1 second from one TPP',
        trigger: 'A TPP sends 50 CoP queries within 1 second (e.g. from a merchant integration with high traffic).',
        expected: 'The OF Hub or TPP backend applies rate limiting. Requests beyond the limit receive HTTP 429 Too Many Requests with a Retry-After header. No silent data corruption.',
        impact: 'Unbounded burst queries can cause CoP billing cost spikes and OF Hub instability.',
        risk: 'high',
        oracles: ['API-01', 'G-07']
      },
      {
        id: 'T-05',
        title: 'Payee changes their name at the bank between CoP and payment',
        trigger: 'CoP returns Exact Match at 10:00. The payee updates their registered name at the LFI at 10:05. The payment is submitted at 10:10.',
        expected: 'The system cannot detect the change (this is a known limitation). The CoP result remains MATCH in the payment record. The audit log reflects the CoP query timestamp.',
        impact: 'This is an accepted limitation of CoP but must be documented so that operations teams understand the audit trail.',
        risk: 'low',
        oracles: ['API-02', 'G-22']
      },
      {
        id: 'T-06',
        title: 'App backgrounded during bank authorisation redirect',
        trigger: 'The user is redirected to the bank app or browser for SCA. They switch to another app for 10 minutes, then return.',
        expected: 'The TPP detects the return via deep link or browser redirect. If the bank session is still valid, the callback is processed. If the bank session expired, the TPP shows a clear error and a \u201cStart again\u201d option.',
        impact: 'Silent failures in the callback after backgrounding leave payments in an unknown state.',
        risk: 'medium',
        oracles: ['API-01']
      },
      {
        id: 'T-07',
        title: 'Connection drops between CoP response and review screen navigation',
        trigger: 'The CoP response is received by the backend but the network drops before the response reaches the frontend. The user\u2019s browser shows a network error.',
        expected: 'The frontend detects the failed request and retries once. If the retry also fails, the CoP result is treated as UNAVAILABLE and the user sees the grey notice.',
        impact: 'A dropped connection at this point leaving the user on a blank screen with no recovery is a critical UX failure.',
        risk: 'medium',
        oracles: ['UI-02', 'API-03']
      }
    ]
  },

  /* ----------------------------------------------------------
     O \u2014 Operations
  ---------------------------------------------------------- */
  {
    id: 'operations',
    sfdpot: 'O',
    title: 'Operations',
    desc: 'How does the system support operations teams, fraud investigation, regulatory reporting, and LFI outage management?',
    scenarios: [
      {
        id: 'O-01',
        title: 'Fraud investigation: retrieve CoP result for a disputed payment',
        trigger: 'A customer disputes a payment, claiming they were shown incorrect CoP information. An ops team member queries the payment record.',
        expected: 'The payment consent record includes: cop_result.matchResult, cop_result.queryId, cop_result.queryTimestamp, and the name that was entered by the user at query time. All fields are retrievable via the internal admin API.',
        impact: 'Without a complete audit trail, fraud disputes cannot be resolved and CBUAE investigations cannot be supported.',
        risk: 'critical',
        oracles: ['API-02']
      },
      {
        id: 'O-02',
        title: 'LFI CoP service is down for 30 minutes',
        trigger: 'A participating LFI\u2019s CoP service becomes unavailable for 30 minutes during business hours.',
        expected: 'All CoP queries to that LFI return UNAVAILABLE within the timeout period. The TPP frontend shows grey notices. Payments can still proceed. An alert is fired to the ops channel. A circuit breaker opens after repeated failures.',
        impact: 'Without a circuit breaker, the system continues sending CoP queries to a down LFI, exhausting timeouts and degrading performance for all users.',
        risk: 'high',
        oracles: ['API-03', 'G-21']
      },
      {
        id: 'O-03',
        title: 'Ops team needs to look up all payments where CoP was skipped',
        trigger: 'The compliance team wants a report of all payments in the past 30 days where CoP was not attempted (missing cop_result).',
        expected: 'The DynamoDB query or admin API supports filtering by the presence/absence of cop_result. Results are exportable. Each record shows the 250 AED liability flag.',
        impact: 'Without this query capability, CBUAE reporting on CoP compliance coverage is impossible.',
        risk: 'high',
        oracles: ['API-02']
      },
      {
        id: 'O-04',
        title: 'CBUAE requests all CoP Partial Match payments for a 7-day window',
        trigger: 'CBUAE issues a regulatory information request for all payments where CoP returned PARTIAL_MATCH in a specific 7-day window.',
        expected: 'The system can filter payment consent records by cop_result.matchResult and date range within the 7-year retention window. Export is available in a machine-readable format.',
        impact: 'Inability to respond to a CBUAE information request is a regulatory compliance failure.',
        risk: 'critical',
        oracles: ['API-02']
      },
      {
        id: 'O-05',
        title: 'False negative: DEWA payment returns No Match',
        trigger: 'A user pays DEWA (Dubai Electricity and Water Authority) by entering \u201cDEWA\u201d as the payee name. The LFI has the account registered as \u201cDubai Electricity and Water Authority\u201d. CoP returns No Match.',
        expected: 'The user sees a red No Match warning for a legitimate payee. The suggested name \u201cDubai Electricity and Water Authority\u201d is shown. The user can proceed after extra confirmation.',
        impact: 'Frequent false negatives for well-known billers erode user trust in CoP warnings, causing users to ignore them habitually.',
        risk: 'medium',
        oracles: ['UI-01', 'G-01']
      },
      {
        id: 'O-06',
        title: 'CoP Partial Match used as AML suspicion indicator',
        trigger: 'An operations analyst assumes that a PARTIAL_MATCH CoP result indicates the payer intended to deceive, and flags the payment for AML review.',
        expected: 'Documentation and training materials clearly state that PARTIAL_MATCH reflects a name discrepancy (typo, title, format) and is NOT an AML signal. AML rules must not use cop_result alone as a trigger.',
        impact: 'Misuse of CoP data as an AML indicator causes incorrect account freezes and regulatory issues.',
        risk: 'medium',
        oracles: ['API-02']
      },
      {
        id: 'O-07',
        title: 'CoP service degrades gradually (increasing latency)',
        trigger: 'The OF Hub CoP response time increases gradually from 500 ms to 4 s over 20 minutes due to a downstream issue, without returning any error codes.',
        expected: 'The monitoring system detects the p95 latency breach (>4 s per PERF-01) and fires an alert within 5 minutes. The circuit breaker opens when the failure threshold is met. Dashboards show real-time CoP latency percentiles.',
        impact: 'Gradual degradation that is not detected causes widespread slow payment flows without any visible error signal.',
        risk: 'high',
        oracles: ['PERF-01', 'G-21']
      }
    ]
  },

  /* ----------------------------------------------------------
     S \u2014 Security
  ---------------------------------------------------------- */
  {
    id: 'security',
    sfdpot: 'S',
    title: 'Security',
    desc: 'How does the CoP integration hold up against adversarial inputs, information leakage, and misuse of the name-verification surface?',
    scenarios: [
      {
        id: 'S-01',
        title: 'Account holder name enumeration attack',
        trigger: 'An attacker sends repeated CoP queries with different names against the same IBAN to determine the account holder\u2019s name by observing MATCH / NO_MATCH responses.',
        expected: 'Rate limiting is applied per TPP and per IBAN. After N failed queries (e.g. 5 in 60 s) against the same IBAN, the endpoint returns HTTP 429. The OF Hub is alerted. The attacker cannot enumerate names faster than the rate limit allows.',
        impact: 'Without rate limiting, CoP is a free name-lookup oracle for any IBAN, enabling targeted social engineering and fraud.',
        risk: 'critical',
        oracles: ['API-01', 'G-19', 'G-07']
      },
      {
        id: 'S-02',
        title: 'Compromised TPP client secret used to query CoP',
        trigger: 'An attacker obtains a valid TPP client secret and uses it to make unauthenticated CoP queries outside the context of a real payment.',
        expected: 'CoP queries require mTLS in addition to the client credentials token. A client secret alone is not sufficient without the matching private key and certificate. Queries without a valid mTLS certificate are rejected at the transport layer.',
        impact: 'Client secret compromise combined with a CoP enumeration attack is a high-severity fraud enabler.',
        risk: 'critical',
        oracles: ['API-01', 'G-19']
      },
      {
        id: 'S-03',
        title: 'Error message leaks internal system information',
        trigger: 'The OF Hub returns an internal error (e.g. database timeout). The TPP backend propagates the raw error message to the frontend response.',
        expected: 'The TPP backend catches all upstream errors and returns a sanitised message (e.g. \u201cVerification temporarily unavailable\u201d). Stack traces, internal hostnames, and database errors are never exposed to the client.',
        impact: 'Leaked internal errors reveal system architecture and can be used to craft targeted attacks.',
        risk: 'high',
        oracles: ['API-03']
      },
      {
        id: 'S-04',
        title: 'Partial Match response leaks payee PII to the wrong user',
        trigger: 'A Partial Match response includes the registered name of the account holder. This name is displayed to the initiating user.',
        expected: 'The suggested name shown in a Partial Match is a legitimate part of the CoP specification and is intentionally disclosed to assist the payer. However, the full account holder name must not be revealed for a No Match \u2014 only the fact that no match was found.',
        impact: 'Disclosing the account holder\u2019s name for a No Match result reveals PII to an unauthenticated third party.',
        risk: 'high',
        oracles: ['UI-01', 'API-01']
      },
      {
        id: 'S-05',
        title: 'Payee name logged in plaintext in application logs',
        trigger: 'The TPP backend logs the full CoP request payload including payeeName and payeeIBAN at DEBUG level.',
        expected: 'PII fields (payeeName, payeeIBAN, and any account details) are masked or excluded from application logs. DEBUG-level logging is disabled in production environments. Log access is role-restricted.',
        impact: 'Plaintext PII in logs violates CBUAE data protection requirements and creates a large attack surface for log exfiltration.',
        risk: 'critical',
        oracles: ['API-01', 'API-03', 'G-20']
      }
    ]
  },

  /* ----------------------------------------------------------
     P \u2014 Platform
  ---------------------------------------------------------- */
  {
    id: 'platform',
    sfdpot: 'P',
    title: 'Platform',
    desc: 'How does the CoP flow behave across different devices, network conditions, API versions, and usage contexts?',
    scenarios: [
      {
        id: 'P-01',
        title: 'CoP on a low-end mobile device with slow 3G',
        trigger: 'A user on a low-end Android device with a 3G connection (RTT ~300 ms) initiates a payment.',
        expected: 'The CoP query completes within the UI-02 10-second timeout. The loading spinner is visible and functional. The app does not crash or freeze. The CoP result is displayed correctly.',
        impact: 'UAE Open Finance must be accessible on a wide range of devices. Premium-device-only experiences exclude a significant user segment.',
        risk: 'medium',
        oracles: ['UI-02', 'PERF-01']
      },
      {
        id: 'P-02',
        title: 'Screen reader user navigates CoP warning',
        trigger: 'A visually impaired user navigates the payment review screen using a screen reader (VoiceOver on iOS or TalkBack on Android).',
        expected: 'The CoP result badge is announced immediately when the screen loads (role=alert). The full status is read: e.g. \u201cWarning: payee name partially matches. Suggested name: Mohammed Ahmad. Confirm you wish to proceed.\u201d All interactive elements are reachable by keyboard/swipe.',
        impact: 'Inaccessible CoP warnings exclude visually impaired users from fraud protection.',
        risk: 'high',
        oracles: ['UI-03']
      },
      {
        id: 'P-03',
        title: 'API-direct integration (no TPP frontend)',
        trigger: 'A merchant integrates the CoP API directly from their backend (server-to-server), with no user-facing UI.',
        expected: 'The API endpoint functions identically without a browser context. mTLS and client credentials are sufficient. The merchant\u2019s backend must still store and forward the cop_result in the payment consent initiation call.',
        impact: 'Server-side integrations that bypass CoP or ignore the result create unmonitored fraud risk.',
        risk: 'medium',
        oracles: ['API-01', 'API-02']
      },
      {
        id: 'P-04',
        title: 'New OF Hub API version released (breaking change)',
        trigger: 'The OF Hub releases a new API version (e.g. v3.0) that changes the CoP response format. The TPP still calls v2.0.',
        expected: 'The OF Hub continues to support v2.0 for a documented deprecation period (e.g. 6 months). The TPP receives advance notice. No silent breaking change occurs.',
        impact: 'Unversioned or unannounced API changes that break the CoP integration remove all fraud protection without any alert.',
        risk: 'high',
        oracles: ['API-01']
      },
      {
        id: 'P-05',
        title: 'Two browser tabs initiate payments simultaneously',
        trigger: 'A user opens the TPP web app in two browser tabs and starts a payment in each simultaneously.',
        expected: 'Each tab maintains its own independent session state. CoP queries and payment consents are not shared between tabs. Completing one payment does not interfere with the other.',
        impact: 'Shared session state between tabs can cause CoP results from one payment to be applied to a different payment context.',
        risk: 'medium',
        oracles: ['API-01', 'F-09']
      }
    ]
  },

  /* ----------------------------------------------------------
     H \u2014 Oracles (Heuristics)
  ---------------------------------------------------------- */
  {
    id: 'oracles',
    sfdpot: 'H',
    title: 'Oracles (Heuristics)',
    desc: 'What conflicting requirements, missing specifications, and subjective quality problems exist that standard pass/fail tests cannot detect?',
    scenarios: [
      {
        id: 'H-01',
        title: 'UI-02 (10s timeout) vs PERF-02 (fire on bank select) creates impossible scenario',
        trigger: 'UI-02 says the frontend should time out CoP at 10 seconds. PERF-02 says CoP should fire when the user selects their bank (before the review screen). If CoP fires early and takes 9.9 s, the review screen shows an expired result.',
        expected: 'A coherent timeout strategy that reconciles UI-02 and PERF-02: e.g. CoP fires on bank select, and the 10-second timer starts from bank select, not from when the review screen loads.',
        impact: 'Without resolving this conflict, one AC will always fail in the scenario where CoP is slow.',
        risk: 'high',
        oracles: ['UI-02', 'PERF-02', 'G-04']
      },
      {
        id: 'H-02',
        title: 'No visual diff shown for Partial Match',
        trigger: 'CoP returns Partial Match. The suggested name is \u201cMohammed Al Rashidi\u201d. The entered name was \u201cMohammed Rashidi\u201d. The UI shows both strings but no visual diff (e.g. character-level highlight).',
        expected: 'Without a character-level diff, users cannot easily spot the difference, especially for long or similar-looking Arabic names. A visual diff (e.g. strikethrough + green for changes) would significantly improve decision quality.',
        impact: 'Users accepting Partial Match without understanding the difference is a fraud protection gap.',
        risk: 'medium',
        oracles: ['UI-01', 'G-17']
      },
      {
        id: 'H-03',
        title: 'No retry button for CoP UNAVAILABLE',
        trigger: 'CoP returns UNAVAILABLE due to a transient network error. The user wants to try again before proceeding.',
        expected: 'The UI should provide a \u201cTry again\u201d button that re-triggers the CoP query. Without it, the only options are \u201cProceed at own risk\u201d or \u201cCancel\u201d.',
        impact: 'Forcing users to either proceed unverified or cancel entirely harms conversion and user trust.',
        risk: 'medium',
        oracles: ['UI-01', 'UI-02', 'G-16']
      },
      {
        id: 'H-04',
        title: 'No hard block on No Match \u2014 is this the right policy?',
        trigger: 'CoP returns No Match. Current design shows a strong warning but allows the user to proceed after extra confirmation.',
        expected: 'This is a deliberate policy choice (to avoid blocking legitimate payments where CoP data is wrong). However, it must be reviewed against CBUAE guidance. If CBUAE requires a hard block for No Match, the current design is non-compliant.',
        impact: 'If CBUAE issues guidance requiring hard blocks, the current design requires a significant rework.',
        risk: 'high',
        oracles: ['UI-01', 'G-14']
      },
      {
        id: 'H-05',
        title: 'Matching algorithm is opaque \u2014 no way to test edge cases',
        trigger: 'The CoP matching algorithm is implemented inside each LFI\u2019s system. The OF Hub specification does not define whether matching is case-sensitive, diacritic-sensitive, or order-sensitive.',
        expected: 'Without a published matching specification, QA cannot write deterministic test cases for edge-case names. Observed behaviour may differ between LFIs, making CoP results inconsistent across banks.',
        impact: 'Inconsistent CoP results across LFIs create an unpredictable user experience and make regression testing impossible.',
        risk: 'critical',
        oracles: ['API-01', 'G-01', 'G-02']
      },
      {
        id: 'H-06',
        title: 'Technical error messages shown to users',
        trigger: 'The backend returns an error such as \u201cconnection timeout to cop.ofhub.ae\u201d in the API response. The frontend displays this raw message.',
        expected: 'All error messages displayed to users must be in plain English (and Arabic), free of technical jargon, internal URLs, or system identifiers. A user-facing error mapping layer must exist between backend errors and frontend display strings.',
        impact: 'Technical error messages confuse users, expose system internals, and create a poor user experience.',
        risk: 'medium',
        oracles: ['API-03', 'S-03']
      }
    ]
  }

];


/* ============================================================
   4. SIP_GAPS
   22 identified gaps, conflicts, and undefined areas in the
   SIP + CoP flow specification.
   ============================================================ */

var SIP_GAPS = [

  {
    id: 'G-01',
    type: 'design',
    title: 'Name matching algorithm is opaque',
    why: 'The OF Hub specification does not define how name matching works: case sensitivity, diacritic handling, word-order tolerance, abbreviation expansion, or fuzzy-match threshold. Each LFI may implement differently.',
    source: 'H-05, D-06, D-07, D-12',
    action: 'Request the published CoP matching specification from CBUAE / OF Hub. Document the algorithm or confirm that LFI variation is accepted and make it visible in the TPP developer docs.'
  },

  {
    id: 'G-02',
    type: 'design',
    title: 'Arabic name transliteration policy undefined',
    why: 'An Arabic name can be transliterated to English in multiple ways (e.g. \u0645\u062D\u0645\u062F = Mohammed / Muhammad / Muhammed). It is not defined whether CoP compares Arabic-to-Arabic, transliteration-to-English, or both.',
    source: 'D-01, D-02, H-05',
    action: 'Define the name comparison policy for Arabic names. Test with at least 10 common Arabic name transliteration variants. Document the expected CoP result for each.'
  },

  {
    id: 'G-03',
    type: 'conflict',
    title: 'Three conflicting timeout values',
    why: 'UI-02 defines a 10-second frontend timeout. API-03 defines an 8-second backend timeout. The OF Hub SLA is 500 ms. There is no documented hierarchy or coordination between these three values.',
    source: 'T-01, UI-02, API-03, PERF-01',
    action: 'Define a timeout hierarchy: OF Hub SLA (500 ms) < backend timeout (8 s) < frontend spinner timeout (10 s). Ensure each layer handles its own timeout independently. Add a sequence diagram.'
  },

  {
    id: 'G-04',
    type: 'conflict',
    title: 'UI-02 vs PERF-02 contradiction on timeout start point',
    why: 'UI-02 implies the 10-second timeout starts when the CoP query is sent from the review screen. PERF-02 says CoP fires when the bank is selected (before the review screen). These create an impossible scenario if CoP is slow.',
    source: 'H-01, UI-02, PERF-02',
    action: 'Resolve by anchoring the 10-second user-facing timeout to bank selection (not review screen load). Update UI-02 to clarify the timer start point. Add a flow diagram showing when CoP fires and when the timer starts.'
  },

  {
    id: 'G-05',
    type: 'undefined',
    title: 'Payee name maximum length not defined',
    why: 'No story or API spec defines the maximum character length accepted for payeeName. The OF Hub may have its own limit. Without a defined max, truncation or rejection behaviour is unpredictable.',
    source: 'D-04, API-01',
    action: 'Confirm the OF Hub payeeName maximum length. Add a validation rule to the backend endpoint. Return HTTP 400 for names exceeding the limit. Document in the TPP developer guide.'
  },

  {
    id: 'G-06',
    type: 'undefined',
    title: 'Client credentials token caching policy for CoP not defined',
    why: 'PERF-01 says the backend should cache the client credentials token to avoid a token request per CoP query. But the token expiry, cache invalidation policy, and behaviour on token rejection are not specified.',
    source: 'PERF-01, API-01',
    action: 'Define: token TTL, cache key, early-refresh threshold (e.g. refresh if <60 s to expiry), and behaviour if the cached token is rejected (force refresh once, then fail).'
  },

  {
    id: 'G-07',
    type: 'undefined',
    title: 'Rate limit for CoP queries not defined',
    why: 'No rate limit is specified for POST /cop-query either per TPP or per IBAN. Without a limit the endpoint is open to name enumeration attacks and billing abuse.',
    source: 'S-01, T-04, API-01',
    action: 'Define: per-TPP rate limit (e.g. 100/min), per-IBAN limit (e.g. 5/min), and the HTTP 429 response format including Retry-After. Implement at the OF Hub or TPP backend API gateway level.'
  },

  {
    id: 'G-08',
    type: 'undefined',
    title: 'International IBAN CoP behaviour unclear',
    why: 'CoP is a UAE-specific service. It is not defined what happens when a non-UAE IBAN (e.g. GB, SA prefix) is passed to the CoP endpoint \u2014 whether it returns UNAVAILABLE, an error, or routes internationally.',
    source: 'D-10, API-01',
    action: 'Confirm with OF Hub: what is returned for a non-UAE IBAN? Document the expected response code (recommend UNAVAILABLE with a clear reason). Add a validation rule to reject non-UAE IBANs early if international routing is not supported.'
  },

  {
    id: 'G-09',
    type: 'undefined',
    title: 'Joint account CoP matching behaviour undefined',
    why: 'For a joint account with two registered holders, it is not specified whether CoP matches against the primary holder only, any holder, or requires both names.',
    source: 'D-08, API-01',
    action: 'Obtain the OF Hub / CBUAE policy on joint accounts. Document the expected CoP result when the user enters each holder\u2019s name. Add a test case for each scenario.'
  },

  {
    id: 'G-10',
    type: 'undefined',
    title: 'Account status values returned by CoP not fully defined',
    why: 'F-01 raises the question of what CoP returns for a closed or frozen account. The current spec does not enumerate all possible account states and their corresponding CoP response codes.',
    source: 'F-01, API-01',
    action: 'Request the full list of account statuses from the OF Hub spec. Map each status to the expected CoP response. Confirm whether CLOSED returns NO_MATCH or a distinct error code.'
  },

  {
    id: 'G-11',
    type: 'billing',
    title: '2-hour CoP result window \u2014 billing measurement not specified',
    why: 'F-05 and T-02 reference a 2-hour validity window for CoP results, but this window is not defined in any story. It is also unclear whether a stale CoP result that is rejected triggers a re-query (and thus a second billing event).',
    source: 'F-05, T-02, API-02',
    action: 'Confirm the CoP result validity window with CBUAE. Define whether a stale-result rejection triggers a mandatory re-query. Clarify billing implications of re-queries.'
  },

  {
    id: 'G-12',
    type: 'billing',
    title: 'Retry billing: does a retried CoP query cost double?',
    why: 'API-03 says the backend retries once on connection error. It is not clear whether a retried query that reaches the OF Hub is billed as a second query (doubling the cost) or whether the OF Hub deduplicates retries.',
    source: 'API-03, PERF-01',
    action: 'Confirm with Nebras / OF Hub: is retry billing per attempt or per unique x-fapi-interaction-id? Document the answer. Consider using the same interaction ID for retries to enable deduplication.'
  },

  {
    id: 'G-13',
    type: 'billing',
    title: 'Multi-creditor payment CoP billing not defined',
    why: 'A future multi-creditor or bulk payment may involve multiple payee IBANs in a single consent. It is not defined whether CoP must be run for each payee and how billing applies.',
    source: 'F-08, API-02',
    action: 'Confirm with OF Hub: for a bulk payment with N payees, is CoP required N times? How is billing calculated? Document in the TPP developer guide before bulk payment features are built.'
  },

  {
    id: 'G-14',
    type: 'liability',
    title: 'Liability matrix incomplete \u2014 no hard block for No Match defined',
    why: 'H-04 identifies that the current design allows payments to proceed after a No Match with extra confirmation. The liability if fraud occurs post-No Match (payer confirmed vs TPP skipped) is not in any story.',
    source: 'H-04, UI-01, API-02',
    action: 'Define the liability matrix: who bears the loss if a user confirms a No Match payment and is defrauded? TPP, LFI, or user? Confirm with CBUAE whether a hard block is required for No Match.'
  },

  {
    id: 'G-15',
    type: 'liability',
    title: 'LFI liability for returning incorrect CoP response',
    why: 'If an LFI returns MATCH for an incorrect name (false positive) and a fraud payment is made, the liability split between the LFI, OF Hub, and TPP is not defined.',
    source: 'H-05, O-05, API-01',
    action: 'Request the liability framework from CBUAE. Ensure the audit log captures the raw LFI response verbatim so that incorrect LFI responses can be evidenced in disputes.'
  },

  {
    id: 'G-16',
    type: 'design',
    title: 'No retry button for CoP UNAVAILABLE in UI',
    why: 'When CoP returns UNAVAILABLE, the user has no \u201cTry again\u201d option. They must either proceed unverified or cancel the entire payment. This is a significant UX and trust gap.',
    source: 'H-03, F-03, UI-01',
    action: 'Add a \u201cVerify again\u201d button to the UNAVAILABLE state. Define the maximum number of retries (recommend 2). Ensure each retry generates a new x-fapi-interaction-id and is billed as a separate query.'
  },

  {
    id: 'G-17',
    type: 'design',
    title: 'No visual diff highlighting on Partial Match',
    why: 'When CoP returns Partial Match, the entered name and suggested name are displayed as two plain text strings. No character-level diff is shown, making it hard to spot small differences (especially in Arabic).',
    source: 'H-02, UI-01',
    action: 'Implement character-level diff highlighting between the entered name and the suggested name. Use strikethrough for removed characters and a highlight colour for additions. Ensure the diff is accessible (not colour-only).'
  },

  {
    id: 'G-18',
    type: 'undefined',
    title: 'Recurring / VRP payment CoP policy not defined',
    why: 'F-08 identifies that for Variable Recurring Payments (VRP) it is not defined whether CoP must be run on every execution or only on consent creation. CBUAE guidance is silent on this.',
    source: 'F-08, API-02',
    action: 'Confirm VRP CoP policy with CBUAE. If CoP is required on each execution, update the VRP payment execution flow to include a CoP query before each payment. Document in the TPP developer guide.'
  },

  {
    id: 'G-19',
    type: 'security',
    title: 'CoP endpoint is an enumeration attack surface',
    why: 'The CoP API allows any authenticated TPP to query whether a name matches an IBAN. With sufficient queries, an attacker can determine any account holder\u2019s name. There is no rate limit or enumeration detection defined.',
    source: 'S-01, S-02, T-04',
    action: 'Implement per-IBAN and per-TPP rate limiting. Add anomaly detection for repeated queries against the same IBAN from the same TPP. Alert on >5 failed name checks against the same IBAN in 60 seconds.'
  },

  {
    id: 'G-20',
    type: 'security',
    title: 'Audit log PII handling policy not defined',
    why: 'O-01 requires a full audit log including the name entered by the user. S-05 requires PII not be logged in plaintext. These are in direct conflict \u2014 the audit log needs the name for dispute resolution, but logging it creates a PII exposure risk.',
    source: 'S-05, O-01, API-01, API-03',
    action: 'Define a PII logging policy: audit logs (for dispute resolution) store full PII in an encrypted, role-restricted store. Application/debug logs mask PII. Implement log separation at the infrastructure level.'
  },

  {
    id: 'G-21',
    type: 'design',
    title: 'No circuit breaker defined for LFI CoP outage',
    why: 'O-02 and O-07 identify that when a specific LFI\u2019s CoP service degrades, the system continues sending queries that all time out. No circuit breaker pattern is defined to fail fast after repeated timeouts.',
    source: 'O-02, O-07, API-03',
    action: 'Implement a circuit breaker per LFI: after 5 consecutive timeouts open the circuit for 60 seconds, returning UNAVAILABLE immediately. Log circuit state changes. Alert on circuit open events. Add a circuit state dashboard.'
  },

  {
    id: 'G-22',
    type: 'design',
    title: 'Name change after CoP passes \u2014 no revalidation',
    why: 'F-02 and T-05 identify that if the payee\u2019s name at the LFI changes after CoP returns MATCH, the payment proceeds with a now-invalid verification. There is no mechanism to detect or re-validate this within the 2-hour window.',
    source: 'F-02, T-05, API-02',
    action: 'Accept this as a known limitation of CoP (real-time name change detection is not feasible). Document it explicitly in the TPP developer guide and in the user-facing CoP result disclosure. Ensure the audit log captures the CoP query timestamp so the window is evidenceable.'
  }

];
