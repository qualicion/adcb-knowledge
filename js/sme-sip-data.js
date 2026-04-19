/* ============================================================
   ADCB Open Finance — SME SIP Solution Portal (LFI Side)
   Data file: overview, flow, scenarios, acceptance criteria,
   architecture, APIs, and gaps.
   No ES modules — plain var declarations for vanilla JS.
   ============================================================ */

/* ============================================================
   1. SME_SIP_OVERVIEW
   ============================================================ */

var SME_SIP_OVERVIEW = {

  metrics: [
    { num: '1',   label: 'Payment Type Single Instant', color: '#1C2B4A' },
    { num: 'SME', label: 'Super User / Sole Owner',     color: '#0F766E' },
    { num: 'AED', label: 'Domestic CASA',               color: '#1E40AF' },
    { num: '49%', label: 'SME Coverage',                color: '#D97706' },
    { num: '9',   label: 'Journey Steps',               color: '#E31E24' }
  ],

  scope: {
    inScope: [
      'Single Instant Payment (SIP)',
      'ProCash Mobile app',
      'Super User / Sole Owner persona',
      'English language only',
      'Domestic AED payments',
      'Eligible CASA accounts',
      'SME customers with <100m AED annual turnover'
    ],
    outScope: [
      'Multi-user SME (Maker/Checker workflows)',
      'Corporate customers with >=100m AED turnover',
      'Arabic language UI',
      'ProCash Web portal',
      'Maker/Checker approval workflow',
      'Recurring / Standing Order payments',
      'International payments (cross-border)',
      'Non-AED currency payments'
    ]
  },

  journey: [
    { num: 1, step: 'TPP Initiates Redirect',         who: 'TPP',  desc: 'TPP sends customer to ADCB via deep link with payment details embedded in the redirect URI.' },
    { num: 2, step: 'App Installed Check',             who: 'TPP',  desc: 'Device checks if ProCash is installed. If not, redirects to App Store / Play Store.' },
    { num: 3, step: 'ProCash Login / Authentication',  who: 'ADCB', desc: 'Customer authenticates via Mobile Token, Hard Token, SMS OTP, or Face ID.' },
    { num: 4, step: 'Eligibility Check',               who: 'ADCB', desc: 'ADCB checks: Super User role, has eligible CASA accounts, within auth window.' },
    { num: 5, step: 'Confirm Payment Details',          who: 'ADCB', desc: 'AlTareq consent screen shows payee, amount, date, reference, account number, and Payment Purpose (v2.1). TPP name and permission text displayed.' },
    { num: 6, step: 'Account Selection',               who: 'ADCB', desc: 'Customer selects debit account. If only one eligible account, pre-selected. TPP may pre-select.' },
    { num: 7, step: 'EFR / PIN Entry',                 who: 'ADCB', desc: 'Customer enters 6-digit PIN to authorise. Three failed attempts lock the session.' },
    { num: 8, step: 'LFI to TPP Redirect',             who: 'ADCB', desc: 'ADCB redirects customer back to TPP app with payment consent status.' },
    { num: 9, step: 'Payment Processed',               who: 'TPP',  desc: 'TPP receives authorisation, calls POST /domestic-payments. Payment executes via IPS/UAEFTS.' }
  ],

  assumptions: [
    'Payment Frequency is NOT shown on the consent screen for SIP — it is a one-off payment by definition.',
    'Date of transaction defaults to today (T+0); no future-dated SIP in this scope.',
    '<strong>Payment Purpose</strong> <span style="background:#E8F5F0;color:#1A6B4A;padding:2px 6px;border-radius:3px;font-size:11px;font-weight:700;">v2.1 CHANGE</span> is now shown in the consent UI per Standards v2.1-final (DOF-2828). Previously captured in Nebras backend only. Shown alongside amount, payee, date, account number, and payment reference.',
    'All monetary values are displayed in Dirhams (AED) with the currency label "Dirhams".'
  ],

  v21Changes: [
    'Payment Purpose now shown in consent UI (was Nebras-only in v2.0)',
    'Screen title changed from "Authorize Consent" to "Confirm Payment Details"',
    'TPP name + permission text added below AlTareq logo on consent screen',
    'Redirect screen shows TPP app logo + name ("redirected back to [TPP]")',
    'Account section variant labels updated per v2.1 wireframes',
    'ConsentSchedule mandatory constraint removed across all flows',
    'Creditor field: Domestic = IBAN only (ConfirmationOfPayeeResponse no longer required)',
    'ReadParty API expanded for SME and Corporate entities'
  ]
};

/* ============================================================
   2. SME_SIP_FLOW
   ============================================================ */

var SME_SIP_FLOW = {

  happyPath: [
    { icon: '↗',  label: 'TPP Handoff',           sublabel: 'Deep link redirect',         color: '#15803D' },
    { icon: '📱', label: 'Check App',              sublabel: 'ProCash installed?',          color: '#1C2B4A' },
    { icon: '🔐', label: 'Login / Auth',           sublabel: 'ProCash authentication',      color: '#1C2B4A' },
    { icon: '✅', label: 'Eligibility',            sublabel: 'Super User + CASA check',     color: '#1E40AF' },
    { icon: '📋', label: 'Payment Details',        sublabel: 'Consent screen review',       color: '#0F766E' },
    { icon: '🏦', label: 'Select Account',         sublabel: 'Choose debit account',        color: '#D97706' },
    { icon: '🔑', label: 'EFR / PIN',              sublabel: '6-digit authorisation',       color: '#E31E24' },
    { icon: '↩',  label: 'LFI to TPP Redirect',   sublabel: 'Return with consent token',   color: '#15803D' },
    { icon: '✔',  label: 'Payment Processed',      sublabel: 'IPS/UAEFTS execution',        color: '#15803D' }
  ],

  errorPaths: [
    { scenario: 'ProCash app not installed',              screen: 'tpp-redirect-to-app' },
    { scenario: 'Login fails (wrong credentials)',        screen: 'unsuccessful' },
    { scenario: 'Customer not eligible (not Super User)', screen: 'access-restricted' },
    { scenario: 'No eligible CASA accounts found',        screen: 'no-accounts' },
    { scenario: 'Authorisation window expired (10 min)',  screen: 'auth-expired' },
    { scenario: '3 failed PIN attempts',                  screen: 'unsuccessful' },
    { scenario: 'System / technical error',               screen: 'unsuccessful' },
    { scenario: 'Broken / malformed deep link',           screen: 'unsuccessful' }
  ],

  eligibility: [
    {
      check:     'Super User / Sole Owner',
      noResult:  'access-restricted — "Only Super Admin users have access"',
      yesResult: 'Proceed to account check'
    },
    {
      check:     'Eligible CASA accounts exist',
      noResult:  'no-accounts — "No Accounts Available for Payment"',
      yesResult: 'Proceed to auth window check'
    },
    {
      check:     'Within 10-minute authorisation window',
      noResult:  'auth-expired — "Authorisation Expired"',
      yesResult: 'Proceed to consent screen'
    }
  ]
};

/* ============================================================
   3. SME_SIP_SCENARIOS
   Phone screen HTML + dev panel API HTML for each prototype step
   ============================================================ */

var SME_SIP_SCENARIOS = {

  /* ── TPP CHECKOUT (pre-redirect) ───────────────────────── */
  'tpp-checkout': {
    title: 'API CALLS \u2014 TPP CHECKOUT (pre-redirect)',
    desc: '<strong>What\'s happening:</strong> The customer is on the Noon merchant checkout. They pick \u201CPay by Bank using AlTareq\u201D and tap Continue. Nothing has hit ADCB yet \u2014 all interaction is inside the TPP. <strong>Next:</strong> The TPP backend pushes a Payment Authorisation Request (PAR) to Nebras, receives a request_uri, and the device is handed over to ADCB.',
    screenHtml:
      '<div style="background:linear-gradient(135deg,#232F3E,#131921);color:#fff;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<div style="width:28px;height:28px;background:#FF9900;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#131921;font-size:12px;">N</div>' +
          '<div style="font-size:13px;font-weight:800;letter-spacing:.3px;">Noon</div>' +
        '</div>' +
        '<div style="font-size:10px;opacity:.7;">Secure checkout</div>' +
      '</div>' +
      '<div style="padding:14px;">' +
        '<div style="font-size:13px;font-weight:700;color:#0F172A;margin-bottom:8px;">Order Summary</div>' +
        '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:10px 12px;margin-bottom:12px;">' +
          '<div style="display:flex;justify-content:space-between;font-size:11px;color:#475569;padding:3px 0;"><span>Subtotal</span><span style="color:#0F172A;font-weight:600;">AED 95.00</span></div>' +
          '<div style="display:flex;justify-content:space-between;font-size:11px;color:#475569;padding:3px 0;"><span>Delivery</span><span style="color:#0F172A;font-weight:600;">AED 5.00</span></div>' +
          '<div style="display:flex;justify-content:space-between;font-size:12px;color:#0F172A;font-weight:800;padding:6px 0 0;border-top:1px dashed #E2E8F0;margin-top:6px;"><span>Total</span><span>AED 100.00</span></div>' +
        '</div>' +
        '<div style="font-size:13px;font-weight:700;color:#0F172A;margin-bottom:8px;">Choose payment method</div>' +
        '<div style="display:flex;align-items:center;gap:8px;padding:9px 10px;border:1px solid #E2E8F0;border-radius:8px;margin-bottom:6px;">' +
          '<span style="width:22px;height:14px;background:linear-gradient(90deg,#1A237E,#FFD700);border-radius:2px;"></span>' +
          '<span style="font-size:11px;color:#0F172A;">Credit / Debit Card</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;padding:10px;border-radius:10px;background:linear-gradient(90deg,#1C2B4A,#0D9488);color:#fff;margin-bottom:12px;">' +
          '<span style="width:18px;height:18px;background:rgba(255,255,255,.2);border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:10px;">\u2713</span>' +
          '<span style="flex:1;font-size:11px;font-weight:700;">Pay by Bank using AlTareq</span>' +
          '<span style="width:14px;height:14px;border-radius:7px;border:2px solid #fff;display:inline-flex;align-items:center;justify-content:center;"><span style="width:6px;height:6px;border-radius:3px;background:#fff;"></span></span>' +
        '</div>' +
        '<button style="background:#131921;color:#fff;border:none;border-radius:24px;padding:12px;width:100%;font-size:13px;font-weight:700;cursor:pointer;">Continue</button>' +
        '<div style="text-align:center;font-size:9px;color:#94A3B8;margin-top:10px;">You will be redirected to your bank to authorise the payment</div>' +
      '</div>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div style="font-size:11px;color:#8B949E;margin-bottom:10px;line-height:1.6;">No API calls to ADCB yet \u2014 this screen is entirely inside the Noon app. The moment the customer taps <b style="color:#E6EDF3;">Continue</b>, the TPP backend fires the first Open Finance call:</div>' +
        '<div class="sme-dev-label">POST \u2014 Push Authorisation Request (PAR)</div>' +
        '<div class="sme-api-badge sme-badge-post">POST</div>' +
        '<code class="sme-dev-path">/as/par  (to Nebras)</code>' +
        '<pre class="sme-code-block"><span class="sme-ck">// Signed JAR carries the payment intent\n</span><span class="sme-cv">{\n  </span><span class="sme-cs">"response_type"</span><span class="sme-cv">: </span><span class="sme-cs">"code"</span><span class="sme-cv">,\n  </span><span class="sme-cs">"client_id"</span><span class="sme-cv">: </span><span class="sme-cs">"tpp-noon-001"</span><span class="sme-cv">,\n  </span><span class="sme-cs">"scope"</span><span class="sme-cv">: </span><span class="sme-cs">"payments openid"</span><span class="sme-cv">,\n  </span><span class="sme-cs">"request"</span><span class="sme-cv">: </span><span class="sme-cs">"&lt;signed-JAR-JWT&gt;"</span>\n<span class="sme-cv">}</span>\n\n<span class="sme-ck">// Response</span>\n<span class="sme-cv">{\n  </span><span class="sme-cs">"request_uri"</span><span class="sme-cv">: </span><span class="sme-cs">"urn:adcb:bwc:1234abcd"</span><span class="sme-cv">,\n  </span><span class="sme-cs">"expires_in"</span><span class="sme-cv">: </span><span class="sme-cn">60</span>\n<span class="sme-cv">}</span></pre>' +
      '</div>'
  },

  /* ── TPP REDIRECT (handover to ADCB) ───────────────────── */
  'tpp-redirect': {
    title: 'API CALLS \u2014 REDIRECT TO ADCB',
    desc: '<strong>What\'s happening:</strong> Noon has the request_uri from PAR. The device opens AlTareq / ProCash via a universal link, passing the request_uri so ADCB can look up the pending consent. <strong>Next:</strong> ProCash launches (or the browser continues) \u2014 the customer lands on the ADCB login screen.',
    screenHtml:
      '<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#0D9488 0%,#1C2B4A 55%,#0B1220 100%);padding:60px 20px 30px;text-align:center;min-height:500px;">' +
        '<div style="font-size:12px;color:rgba(255,255,255,.85);margin-bottom:20px;">You\'ll be redirected to</div>' +
        '<div style="width:78px;height:78px;background:#fff;border-radius:18px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;box-shadow:0 12px 24px rgba(0,0,0,0.25);">' +
          '<svg width="40" height="40" viewBox="0 0 28 28">' +
            '<path d="M14 2L3 6v8c0 6 4.5 10.5 11 12 6.5-1.5 11-6 11-12V6L14 2z" fill="#E31E24"/>' +
            '<path d="M8 13l6-5 6 5-6 5-6-5z" fill="#fff"/>' +
          '</svg>' +
        '</div>' +
        '<div style="color:#fff;font-size:16px;font-weight:800;letter-spacing:0.5px;margin-bottom:4px;">ADCB</div>' +
        '<div style="color:rgba(255,255,255,.7);font-size:11px;">don\'t close this window</div>' +
        '<div style="width:40px;height:40px;border:3px solid rgba(255,255,255,.2);border-top-color:#0D9488;border-radius:50%;animation:sme-spin 0.9s linear infinite;margin:26px 0;"></div>' +
        '<div style="color:rgba(255,255,255,.55);font-size:9px;letter-spacing:1px;margin-bottom:6px;margin-top:12px;">POWERED BY</div>' +
        '<div style="color:#fff;font-weight:800;font-size:12px;">Al <span style="color:#0D9488;">Tareq</span></div>' +
      '</div>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div style="font-size:11px;color:#8B949E;margin-bottom:10px;line-height:1.6;">The handover uses a universal link so ProCash opens if installed, otherwise the browser opens the AlTareq hosted page. No ADCB backend call fires during this redirect \u2014 the request_uri is just handed over.</div>' +
        '<div class="sme-dev-label">Universal link handover</div>' +
        '<pre class="sme-code-block"><span class="sme-ck">// Universal link \u2192 opens ProCash if installed\n</span><span class="sme-cs">https://altareq.adcb.ae/open-finance/authorize<br>  ?request_uri=urn:adcb:bwc:1234abcd<br>  &amp;client_id=tpp-noon-001</span>\n\n<span class="sme-ck">// Fallback deep link\n</span><span class="sme-cs">procash://open-finance/authorize<br>  ?request_uri=urn:adcb:bwc:1234abcd</span></pre>' +
        '<div style="margin-top:12px;padding:8px 12px;background:#0B2948;border-left:3px solid #58A6FF;border-radius:4px;font-size:11px;color:#93C5FD;line-height:1.5;">Once the device lands on ProCash, ADCB resolves the consent with <b>GET /payment-consents/{ConsentId}</b> right after login \u2014 see the next step.</div>' +
      '</div>'
  },

  /* ── LOGIN ─────────────────────────────────────────────── */
  'login': {
    title: 'API CALLS — LOGIN / AUTHENTICATION',
    desc: '<strong>What\'s happening:</strong> The customer has been redirected from the TPP app to ProCash. They need to authenticate using their preferred method (Mobile Token, Hard Token, SMS, or Face ID). <strong>Next:</strong> On successful login, the system checks if they\'re a Super User — then loads the consent details screen.',
    screenHtml:
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #E2E8F0;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<div style="width:22px;height:22px;background:#E31E24;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">&#x25B6;</div>' +
          '<div style="font-size:13px;font-weight:700;">Confirm Payment Details</div>' +
        '</div>' +
        '<div style="width:22px;height:22px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#666;">&#x2715;</div>' +
      '</div>' +
      '<div style="font-size:12px;color:#475569;text-align:center;padding:12px 14px 8px;">Please select your authentication method</div>' +
      '<div style="display:flex;justify-content:center;gap:16px;padding:8px 14px;">' +
        '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;">' +
          '<div style="width:44px;height:44px;border-radius:50%;background:#1A6B4A;color:white;display:flex;align-items:center;justify-content:center;font-size:20px;">&#x1F4F1;</div>' +
          '<div style="font-size:10px;color:#475569;">Mobile Token</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;">' +
          '<div style="width:44px;height:44px;border-radius:50%;background:#f0f4f8;display:flex;align-items:center;justify-content:center;font-size:20px;">&#x1F511;</div>' +
          '<div style="font-size:10px;color:#475569;">Hard Token</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;">' +
          '<div style="width:44px;height:44px;border-radius:50%;background:#f0f4f8;display:flex;align-items:center;justify-content:center;font-size:20px;">&#x1F4AC;</div>' +
          '<div style="font-size:10px;color:#475569;">SMS Token</div>' +
        '</div>' +
      '</div>' +
      '<div style="background:#1C2B4A;color:white;text-align:center;padding:6px 14px;font-size:12px;font-weight:700;letter-spacing:1px;margin:8px 14px;border-radius:4px;">MERTTEST</div>' +
      '<div style="margin:6px 14px;border:1px solid #E2E8F0;border-radius:6px;padding:8px 10px;font-size:12px;color:#ccc;display:flex;align-items:center;justify-content:space-between;"><span>Enter Token</span><span style="color:#475569;font-size:11px;">&#x2139;</span></div>' +
      '<button style="background:#1C2B4A;color:white;border:none;border-radius:8px;padding:12px;width:calc(100% - 28px);margin:8px 14px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">' +
        '<div style="width:16px;height:16px;background:#E31E24;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;">&#x25B6;</div> Login</button>' +
      '<div style="display:flex;align-items:center;gap:8px;margin:8px 14px;font-size:11px;color:#475569;">' +
        '<div style="flex:1;height:1px;background:#E2E8F0;"></div>or<div style="flex:1;height:1px;background:#E2E8F0;"></div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:center;gap:6px;padding:8px;font-size:11px;color:#475569;cursor:pointer;">&#x1FA78; Login with Face ID</div>' +
      '<div style="text-align:center;font-size:11px;color:#475569;margin:4px 14px;border-top:1px solid #E2E8F0;padding-top:8px;">Generate Token</div>' +
      '<div style="margin:6px 14px;border:1px solid #E2E8F0;border-radius:6px;padding:8px 10px;font-size:12px;color:#ccc;display:flex;align-items:center;gap:6px;">&#x1F512; Token</div>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div class="sme-dev-label">POST — /auth/token</div>' +
        '<div class="sme-api-badge sme-badge-post">POST</div>' +
        '<code class="sme-dev-path">/auth/token</code>' +
        '<p style="font-size:11px;color:#8B949E;margin:8px 0;">Customer authenticates using mobile token, hard token or SMS OTP via the ProCash BAU authentication flow. This is standard ADCB authentication — not Open Finance specific.</p>' +
        '<pre class="sme-code-block"><span class="sme-ck">Request Body:\n</span><span class="sme-cv">{\n  </span><span class="sme-cs">"username"</span><span class="sme-cv">: </span><span class="sme-cs">"MERTTEST"</span><span class="sme-cv">,\n  </span><span class="sme-cs">"token"</span><span class="sme-cv">: </span><span class="sme-cs">"&lt;otp_value&gt;"</span><span class="sme-cv">,\n  </span><span class="sme-cs">"tokenType"</span><span class="sme-cv">: </span><span class="sme-cs">"MOBILE"</span><span class="sme-cv">,\n  </span><span class="sme-cs">"consentId"</span><span class="sme-cv">: </span><span class="sme-cs">"&lt;consent_id_from_nebras&gt;"</span>\n<span class="sme-cv">}</span></pre>' +
        '<div style="color:#56D364;font-size:10px;font-weight:600;margin:8px 0;">&#x2713; 200 SUCCESS</div>' +
        '<pre class="sme-code-block"><span class="sme-cv">{\n  </span><span class="sme-cs">"sessionToken"</span><span class="sme-cv">: </span><span class="sme-cs">"eyJhbGci..."</span><span class="sme-cv">,\n  </span><span class="sme-cs">"userType"</span><span class="sme-cv">: </span><span class="sme-cs">"SUPER_USER"</span><span class="sme-cv">,\n  </span><span class="sme-cs">"eligible"</span><span class="sme-cv">: </span><span class="sme-cn">true</span>\n<span class="sme-cv">}</span></pre>' +
        '<div style="color:#F85149;font-size:10px;font-weight:600;margin:8px 0;">&#x2717; 401 FAILED AUTH</div>' +
        '<pre class="sme-code-block"><span class="sme-cv">{\n  </span><span class="sme-cs">"error"</span><span class="sme-cv">: </span><span class="sme-cs">"AUTHENTICATION_FAILED"</span><span class="sme-cv">,\n  </span><span class="sme-cs">"message"</span><span class="sme-cv">: </span><span class="sme-cs">"Invalid credentials"</span>\n<span class="sme-cv">}</span></pre>' +
      '</div>' +
      '<div class="sme-dev-section" style="margin-top:14px;">' +
        '<div class="sme-dev-label">GET — /payment-consents/{ConsentId}</div>' +
        '<div class="sme-api-badge sme-badge-get">GET</div>' +
        '<code class="sme-dev-path">/payment-consents/{ConsentId}</code>' +
        '<p style="font-size:11px;color:#8B949E;margin:8px 0;">After login, fetch the consent details from ADCB using the ConsentId passed from Nebras during the redirect. This populates the payment details screen.</p>' +
        '<div style="color:#56D364;font-size:10px;font-weight:600;margin:8px 0;">&#x2713; 200 Consent Object</div>' +
        '<pre class="sme-code-block"><span class="sme-cv">{\n  </span><span class="sme-cs">"consentId"</span><span class="sme-cv">: </span><span class="sme-cs">"CNSNT-20250101-001"</span><span class="sme-cv">,\n  </span><span class="sme-cs">"amount"</span><span class="sme-cv">: </span><span class="sme-cs">"100.00"</span><span class="sme-cv">,\n  </span><span class="sme-cs">"currency"</span><span class="sme-cv">: </span><span class="sme-cs">"AED"</span><span class="sme-cv">,\n  </span><span class="sme-cs">"payeeName"</span><span class="sme-cv">: </span><span class="sme-cs">"Noon"</span><span class="sme-cv">,\n  </span><span class="sme-cs">"status"</span><span class="sme-cv">: </span><span class="sme-cs">"AwaitingAuthorisation"</span>\n<span class="sme-cv">}</span></pre>' +
      '</div>'
  },

  /* ── CONSENT DETAILS (single account) ──────────────────── */
  'consent-details': {
    title: 'Consent Details — 1 Account (v2.1)',
    desc: '<strong>What\'s happening:</strong> The customer has logged in and passed eligibility checks. They see the full payment details from the TPP — amount, payee, date, reference, and Payment Purpose (v2.1). They have only one eligible CASA account, so it\'s shown automatically. <strong>Next:</strong> Tapping "Pay using AlTareq" takes them to the PIN/EFR screen to authorise.',
    screenHtml:
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #E2E8F0;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<div style="width:22px;height:22px;background:#E31E24;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">&#x25B6;</div>' +
          '<div style="font-size:13px;font-weight:700;">Confirm Payment Details</div>' +
        '</div>' +
        '<div style="width:22px;height:22px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#666;">&#x2715;</div>' +
      '</div>' +
      '<div style="text-align:center;padding:12px;">' +
        '<div style="font-size:13px;color:#0D3349;">&#x0627;&#x0644;&#x0637;&#x0627;&#x0631;&#x0642;</div>' +
        '<div style="font-size:16px;font-weight:700;color:#0D3349;letter-spacing:2px;">ALTAREQ</div>' +
      '</div>' +
      '<div style="text-align:center;font-size:10px;color:#475569;padding:0 14px 6px;line-height:1.4;"><strong style="color:#0F172A;">Noon Ltd</strong> needs your permission to make the payment below.</div>' +
      '<div style="display:flex;align-items:center;justify-content:center;padding:8px 20px;gap:0;">' +
        '<div style="display:flex;flex-direction:column;align-items:center;flex:1;">' +
          '<div style="width:22px;height:22px;border-radius:50%;background:#00B4C8;color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">1</div>' +
          '<div style="font-size:9px;color:#00B4C8;margin-top:2px;font-weight:600;">Consent</div>' +
        '</div>' +
        '<div style="flex:1;height:2px;background:#00B4C8;margin-top:-12px;"></div>' +
        '<div style="display:flex;flex-direction:column;align-items:center;flex:1;">' +
          '<div style="width:22px;height:22px;border-radius:50%;background:#00B4C8;color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">2</div>' +
          '<div style="font-size:9px;color:#00B4C8;margin-top:2px;font-weight:600;">Authorize</div>' +
        '</div>' +
        '<div style="flex:1;height:2px;background:#e0e0e0;margin-top:-12px;"></div>' +
        '<div style="display:flex;flex-direction:column;align-items:center;flex:1;">' +
          '<div style="width:22px;height:22px;border-radius:50%;background:#e0e0e0;color:#999;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">3</div>' +
          '<div style="font-size:9px;color:#999;margin-top:2px;">Complete</div>' +
        '</div>' +
      '</div>' +
      '<div style="font-size:13px;font-weight:700;text-align:center;padding:8px 14px 4px;color:#0F172A;">Payment Details</div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Amount</span><span style="font-weight:600;color:#0F172A;">100.00 AED</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Payee Name</span><span style="font-weight:600;color:#0F172A;">(Noon)</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Account Number</span><span style="font-weight:600;color:#0F172A;">12232145623</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Date of Payment</span><span style="font-weight:600;color:#0F172A;">(01 January 2025)</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Payment Reference</span><span style="font-weight:600;color:#0F172A;">(Noon Ltd)</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Payment Purpose</span><span style="font-weight:600;color:#0F766E;">(Ride Payment) <span style="background:#E8F5F0;border-radius:2px;padding:1px 4px;font-size:9px;font-weight:700;color:#1A6B4A;">v2.1</span></span></div>' +
      '<div style="font-size:12px;font-weight:700;text-align:center;padding:8px 14px 4px;">Account to pay from</div>' +
      '<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid #f5f5f5;">' +
        '<div style="width:22px;height:22px;background:#E31E24;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">&#x25B6;</div>' +
        '<div style="flex:1;"><div style="font-size:11px;font-weight:600;">ACDESC_317816102001</div><div style="font-size:10px;color:#475569;">317816102001</div></div>' +
        '<div style="text-align:right;"><div style="font-size:11px;font-weight:600;">851,499,538.11</div><div style="font-size:10px;color:#475569;">AED</div></div>' +
      '</div>' +
      '<div style="height:12px;"></div>' +
      '<button style="background:linear-gradient(135deg,#00B4C8,#005f6b);color:white;border:none;border-radius:24px;padding:12px;width:calc(100% - 28px);margin:0 14px 8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">&#x1F512; Pay using AlTareq</button>' +
      '<button style="background:white;color:#0F172A;border:1px solid #E2E8F0;border-radius:24px;padding:11px;width:calc(100% - 28px);margin:0 14px 12px;font-size:13px;font-weight:600;cursor:pointer;">Cancel</button>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div class="sme-dev-label">GET — Payment Consent</div>' +
        '<div class="sme-api-badge sme-badge-get">GET</div>' +
        '<code class="sme-dev-path">/payment-consents/{ConsentId}</code>' +
        '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "ConsentId": </span><span class="sme-cs">"pcon-0001"</span><span class="sme-cv">,\n    "Status": </span><span class="sme-cs">"AwaitingAuthorisation"</span><span class="sme-cv">,\n    "Initiation": {\n      "InstructedAmount": {\n        "Amount": </span><span class="sme-cs">"100.00"</span><span class="sme-cv">,\n        "Currency": </span><span class="sme-cs">"AED"</span>\n<span class="sme-cv">      },\n      "CreditorAccount": {\n        "SchemeName": </span><span class="sme-cs">"IBAN"</span><span class="sme-cv">,\n        "Identification": </span><span class="sme-cs">"AE210610012345678901234"</span><span class="sme-cv">,\n        "Name": </span><span class="sme-cs">"Noon"</span>\n<span class="sme-cv">      },\n      "EndToEndIdentification": </span><span class="sme-cs">"ORD-20260416-001"</span>\n<span class="sme-cv">    }\n  }\n}</span></pre>' +
      '</div>'
  },

  /* ── ACCOUNT SELECT (5 accounts) ───────────────────────── */
  'account-select': {
    title: 'Account Selection — Multiple (v2.1)',
    desc: '<strong>What\'s happening:</strong> The customer has multiple eligible CASA accounts. No account is pre-selected — they must pick one. Payment details are shown above the account list. "View All" appears if there are more than 10. <strong>Next:</strong> After selecting an account, the system sends a PATCH (AccountSelected) and the "Pay using AlTareq" button becomes active.',
    screenHtml:
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #E2E8F0;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<div style="width:22px;height:22px;background:#E31E24;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">&#x25B6;</div>' +
          '<div style="font-size:13px;font-weight:700;">Confirm Payment Details</div>' +
        '</div>' +
        '<div style="width:22px;height:22px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#666;">&#x2715;</div>' +
      '</div>' +
      '<div style="text-align:center;padding:12px;">' +
        '<div style="font-size:13px;color:#0D3349;">&#x0627;&#x0644;&#x0637;&#x0627;&#x0631;&#x0642;</div>' +
        '<div style="font-size:16px;font-weight:700;color:#0D3349;letter-spacing:2px;">ALTAREQ</div>' +
      '</div>' +
      '<div style="text-align:center;font-size:10px;color:#475569;padding:0 14px 6px;line-height:1.4;"><strong style="color:#0F172A;">Noon Ltd</strong> needs your permission to make the payment below.</div>' +
      '<div style="display:flex;align-items:center;justify-content:center;padding:8px 20px;gap:0;">' +
        '<div style="display:flex;flex-direction:column;align-items:center;flex:1;"><div style="width:22px;height:22px;border-radius:50%;background:#00B4C8;color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">1</div><div style="font-size:9px;color:#00B4C8;margin-top:2px;font-weight:600;">Consent</div></div>' +
        '<div style="flex:1;height:2px;background:#00B4C8;margin-top:-12px;"></div>' +
        '<div style="display:flex;flex-direction:column;align-items:center;flex:1;"><div style="width:22px;height:22px;border-radius:50%;background:#00B4C8;color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">2</div><div style="font-size:9px;color:#00B4C8;margin-top:2px;font-weight:600;">Authorize</div></div>' +
        '<div style="flex:1;height:2px;background:#e0e0e0;margin-top:-12px;"></div>' +
        '<div style="display:flex;flex-direction:column;align-items:center;flex:1;"><div style="width:22px;height:22px;border-radius:50%;background:#e0e0e0;color:#999;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">3</div><div style="font-size:9px;color:#999;margin-top:2px;">Complete</div></div>' +
      '</div>' +
      '<div style="font-size:13px;font-weight:700;text-align:center;padding:8px 14px 4px;color:#0F172A;">Payment Details</div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Amount</span><span style="font-weight:600;">100.00 AED</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Payee Name</span><span style="font-weight:600;">(Noon)</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Account Number</span><span style="font-weight:600;">12232145623</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Date of Payment</span><span style="font-weight:600;">(01 Jan 2025)</span></div>' +
      '<div style="font-size:12px;font-weight:700;text-align:center;padding:8px 14px 4px;">Please select the account to pay from</div>' +
      '<div style="display:flex;gap:6px;padding:6px 14px;border-bottom:1px solid #f5f5f5;">' +
        '<div style="flex:1;border:1px solid #E2E8F0;border-radius:6px;padding:6px 8px;font-size:11px;color:#475569;">Search by Account Number</div>' +
        '<div style="padding:6px 8px;font-size:14px;color:#475569;">&#x1F50D;</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid #f5f5f5;"><div style="width:16px;height:16px;border-radius:50%;border:2px solid #ccc;"></div><div style="flex:1;"><div style="font-size:11px;font-weight:600;">ACDESC_317816102001</div><div style="font-size:10px;color:#475569;">317816102001</div></div><div style="text-align:right;"><div style="font-size:11px;font-weight:600;">851,499,538.11</div><div style="font-size:10px;color:#475569;">AED</div></div></div>' +
      '<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid #f5f5f5;"><div style="width:16px;height:16px;border-radius:50%;border:2px solid #ccc;"></div><div style="flex:1;"><div style="font-size:11px;font-weight:600;">ACDESC_317816102002</div><div style="font-size:10px;color:#475569;">317816102002</div></div><div style="text-align:right;"><div style="font-size:11px;font-weight:600;">851,499,538.11</div><div style="font-size:10px;color:#475569;">AED</div></div></div>' +
      '<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid #f5f5f5;"><div style="width:16px;height:16px;border-radius:50%;border:2px solid #ccc;"></div><div style="flex:1;"><div style="font-size:11px;font-weight:600;">ACDESC_317816102003</div><div style="font-size:10px;color:#475569;">317816102003</div></div><div style="text-align:right;"><div style="font-size:11px;font-weight:600;">851,499,538.11</div><div style="font-size:10px;color:#475569;">AED</div></div></div>' +
      '<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid #f5f5f5;"><div style="width:16px;height:16px;border-radius:50%;border:2px solid #ccc;"></div><div style="flex:1;"><div style="font-size:11px;font-weight:600;">ACDESC_317816102004</div><div style="font-size:10px;color:#475569;">317816102004</div></div><div style="text-align:right;"><div style="font-size:11px;font-weight:600;">851,499,538.11</div><div style="font-size:10px;color:#475569;">AED</div></div></div>' +
      '<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid #f5f5f5;"><div style="width:16px;height:16px;border-radius:50%;border:2px solid #ccc;"></div><div style="flex:1;"><div style="font-size:11px;font-weight:600;">ACDESC_317816102005</div><div style="font-size:10px;color:#475569;">317816102005</div></div><div style="text-align:right;"><div style="font-size:11px;font-weight:600;">851,499,538.11</div><div style="font-size:10px;color:#475569;">AED</div></div></div>' +
      '<div style="text-align:center;padding:6px;font-size:11px;color:#00B4C8;font-weight:600;cursor:pointer;">View All</div>' +
      '<button style="background:linear-gradient(135deg,#00B4C8,#005f6b);color:white;border:none;border-radius:24px;padding:12px;width:calc(100% - 28px);margin:0 14px 8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">&#x1F512; Pay using AlTareq</button>' +
      '<button style="background:white;color:#0F172A;border:1px solid #E2E8F0;border-radius:24px;padding:11px;width:calc(100% - 28px);margin:0 14px 12px;font-size:13px;font-weight:600;cursor:pointer;">Cancel</button>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div class="sme-dev-label">GET — Eligible Accounts</div>' +
        '<div class="sme-api-badge sme-badge-get">GET</div>' +
        '<code class="sme-dev-path">/accounts</code>' +
        '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "Account": [\n      {\n        "AccountId": </span><span class="sme-cs">"acc-4521"</span><span class="sme-cv">,\n        "AccountType": </span><span class="sme-cs">"Business"</span><span class="sme-cv">,\n        "AccountSubType": </span><span class="sme-cs">"CurrentAccount"</span><span class="sme-cv">,\n        "Currency": </span><span class="sme-cs">"AED"</span><span class="sme-cv">,\n        "Account": [{\n          "SchemeName": </span><span class="sme-cs">"IBAN"</span><span class="sme-cv">,\n          "Identification": </span><span class="sme-cs">"AE210610000000004521"</span>\n<span class="sme-cv">        }]\n      }\n    ]\n  }\n}</span></pre>' +
      '</div>'
  },

  /* ── ACCOUNT SELECTED ───────────────────────────────────── */
  'account-selected': {
    title: 'Account Selected (v2.1)',
    desc: '<strong>What\'s happening:</strong> The customer has tapped on an account — the radio button fills teal. The PATCH /payment-consents call fires with the selected DebtorAccount. <strong>Next:</strong> Tapping "Pay using AlTareq" proceeds to the PIN/EFR authorisation screen.',
    screenHtml:
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #E2E8F0;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<div style="width:22px;height:22px;background:#E31E24;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">&#x25B6;</div>' +
          '<div style="font-size:13px;font-weight:700;">Confirm Payment Details</div>' +
        '</div>' +
        '<div style="width:22px;height:22px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#666;">&#x2715;</div>' +
      '</div>' +
      '<div style="text-align:center;padding:12px;"><div style="font-size:13px;color:#0D3349;">&#x0627;&#x0644;&#x0637;&#x0627;&#x0631;&#x0642;</div><div style="font-size:16px;font-weight:700;color:#0D3349;letter-spacing:2px;">ALTAREQ</div></div>' +
      '<div style="display:flex;align-items:center;justify-content:center;padding:8px 20px;gap:0;">' +
        '<div style="display:flex;flex-direction:column;align-items:center;flex:1;"><div style="width:22px;height:22px;border-radius:50%;background:#00B4C8;color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">1</div><div style="font-size:9px;color:#00B4C8;margin-top:2px;font-weight:600;">Consent</div></div>' +
        '<div style="flex:1;height:2px;background:#00B4C8;margin-top:-12px;"></div>' +
        '<div style="display:flex;flex-direction:column;align-items:center;flex:1;"><div style="width:22px;height:22px;border-radius:50%;background:#00B4C8;color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">2</div><div style="font-size:9px;color:#00B4C8;margin-top:2px;font-weight:600;">Authorize</div></div>' +
        '<div style="flex:1;height:2px;background:#e0e0e0;margin-top:-12px;"></div>' +
        '<div style="display:flex;flex-direction:column;align-items:center;flex:1;"><div style="width:22px;height:22px;border-radius:50%;background:#e0e0e0;color:#999;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">3</div><div style="font-size:9px;color:#999;margin-top:2px;">Complete</div></div>' +
      '</div>' +
      '<div style="font-size:13px;font-weight:700;text-align:center;padding:8px 14px 4px;color:#0F172A;">Payment Details</div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Amount</span><span style="font-weight:600;">100.00 AED</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Payee Name</span><span style="font-weight:600;">(Noon)</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Date of Payment</span><span style="font-weight:600;">(01 Jan 2025)</span></div>' +
      '<div style="font-size:12px;font-weight:700;text-align:center;padding:8px 14px 4px;">Select Account</div>' +
      '<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid #f5f5f5;">' +
        '<div style="width:16px;height:16px;border-radius:50%;border:2px solid #00B4C8;background:#00B4C8;box-shadow:inset 0 0 0 3px white;"></div>' +
        '<div style="flex:1;"><div style="font-size:11px;font-weight:600;">ACDESC_317816102001</div><div style="font-size:10px;color:#475569;">317816102001</div></div>' +
        '<div style="text-align:right;"><div style="font-size:11px;font-weight:600;">851,499,538.11</div><div style="font-size:10px;color:#475569;">AED</div></div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid #f5f5f5;">' +
        '<div style="width:16px;height:16px;border-radius:50%;border:2px solid #ccc;"></div>' +
        '<div style="flex:1;"><div style="font-size:11px;font-weight:600;">ACDESC_317816102002</div><div style="font-size:10px;color:#475569;">317816102002</div></div>' +
        '<div style="text-align:right;"><div style="font-size:11px;font-weight:600;">851,499,538.11</div><div style="font-size:10px;color:#475569;">AED</div></div>' +
      '</div>' +
      '<div style="text-align:center;padding:6px;font-size:11px;color:#00B4C8;cursor:pointer;">View All</div>' +
      '<button style="background:linear-gradient(135deg,#00B4C8,#005f6b);color:white;border:none;border-radius:24px;padding:12px;width:calc(100% - 28px);margin:8px 14px 8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">&#x1F512; Pay using AlTareq</button>' +
      '<button style="background:white;color:#0F172A;border:1px solid #E2E8F0;border-radius:24px;padding:11px;width:calc(100% - 28px);margin:0 14px 12px;font-size:13px;font-weight:600;cursor:pointer;">Cancel</button>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div class="sme-dev-label">PATCH — Account Selected</div>' +
        '<div class="sme-api-badge sme-badge-patch">PATCH</div>' +
        '<code class="sme-dev-path">/payment-consents/{ConsentId}</code>' +
        '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "Status": </span><span class="sme-cs">"AccountSelected"</span><span class="sme-cv">,\n    "DebtorAccount": {\n      "SchemeName": </span><span class="sme-cs">"IBAN"</span><span class="sme-cv">,\n      "Identification": </span><span class="sme-cs">"AE210610000000004521"</span><span class="sme-cv">,\n      "Name": </span><span class="sme-cs">"MERTTEST LLC"</span>\n<span class="sme-cv">    }\n  }\n}</span></pre>' +
      '</div>'
  },

  /* ── PIN ENTRY ──────────────────────────────────────────── */
  'pin': {
    title: 'EFR / PIN Entry (v2.1)',
    desc: '<strong>What\'s happening:</strong> The customer confirmed the payment details and selected their account. Now they enter their 6-digit ProCash PIN to authorise. They have 3 attempts — after the 3rd failure the consent is rejected. Face ID / Touch ID is offered as an alternative. <strong>Next:</strong> On success, a PATCH sets the consent to "Authorised" and the customer is redirected back to the TPP.',
    screenHtml:
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #E2E8F0;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<div style="width:22px;height:22px;background:#E31E24;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">&#x25B6;</div>' +
          '<div style="font-size:13px;font-weight:700;">Confirm Payment Details</div>' +
        '</div>' +
        '<div style="width:22px;height:22px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#666;">&#x2715;</div>' +
      '</div>' +
      '<div style="padding:20px 16px;text-align:center;">' +
        '<div style="font-size:14px;font-weight:700;color:#0F172A;margin-bottom:4px;">Confirm with your PIN</div>' +
        '<div style="font-size:11px;color:#475569;margin-bottom:20px;">Please enter your ProCash PIN to authorise this payment</div>' +
        '<div style="display:flex;justify-content:center;gap:12px;margin-bottom:20px;">' +
          '<div style="width:14px;height:14px;border-radius:50%;background:#1C2B4A;border:2px solid #1C2B4A;"></div>' +
          '<div style="width:14px;height:14px;border-radius:50%;background:#1C2B4A;border:2px solid #1C2B4A;"></div>' +
          '<div style="width:14px;height:14px;border-radius:50%;background:#1C2B4A;border:2px solid #1C2B4A;"></div>' +
          '<div style="width:14px;height:14px;border-radius:50%;border:2px solid #E2E8F0;"></div>' +
          '<div style="width:14px;height:14px;border-radius:50%;border:2px solid #E2E8F0;"></div>' +
          '<div style="width:14px;height:14px;border-radius:50%;border:2px solid #E2E8F0;"></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:200px;margin:0 auto;">' +
          '<div style="background:#F7F8FA;border:1px solid #E2E8F0;border-radius:8px;padding:12px;font-size:16px;font-weight:700;cursor:pointer;">1</div>' +
          '<div style="background:#F7F8FA;border:1px solid #E2E8F0;border-radius:8px;padding:12px;font-size:16px;font-weight:700;cursor:pointer;">2</div>' +
          '<div style="background:#F7F8FA;border:1px solid #E2E8F0;border-radius:8px;padding:12px;font-size:16px;font-weight:700;cursor:pointer;">3</div>' +
          '<div style="background:#F7F8FA;border:1px solid #E2E8F0;border-radius:8px;padding:12px;font-size:16px;font-weight:700;cursor:pointer;">4</div>' +
          '<div style="background:#F7F8FA;border:1px solid #E2E8F0;border-radius:8px;padding:12px;font-size:16px;font-weight:700;cursor:pointer;">5</div>' +
          '<div style="background:#F7F8FA;border:1px solid #E2E8F0;border-radius:8px;padding:12px;font-size:16px;font-weight:700;cursor:pointer;">6</div>' +
          '<div style="background:#F7F8FA;border:1px solid #E2E8F0;border-radius:8px;padding:12px;font-size:16px;font-weight:700;cursor:pointer;">7</div>' +
          '<div style="background:#F7F8FA;border:1px solid #E2E8F0;border-radius:8px;padding:12px;font-size:16px;font-weight:700;cursor:pointer;">8</div>' +
          '<div style="background:#F7F8FA;border:1px solid #E2E8F0;border-radius:8px;padding:12px;font-size:16px;font-weight:700;cursor:pointer;">9</div>' +
          '<div style="background:#F7F8FA;border:1px solid #E2E8F0;border-radius:8px;padding:12px;font-size:16px;font-weight:700;cursor:pointer;">*</div>' +
          '<div style="background:#F7F8FA;border:1px solid #E2E8F0;border-radius:8px;padding:12px;font-size:16px;font-weight:700;cursor:pointer;">0</div>' +
          '<div style="background:#F7F8FA;border:1px solid #E2E8F0;border-radius:8px;padding:12px;font-size:16px;font-weight:700;cursor:pointer;">&#x232B;</div>' +
          '<div style="grid-column:1/-1;background:#1C2B4A;color:white;border-radius:8px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;">Confirm</div>' +
        '</div>' +
        '<div style="font-size:10px;color:#475569;margin-top:8px;">Or use Face ID / Touch ID</div>' +
      '</div>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div class="sme-dev-label">PATCH — Authorised</div>' +
        '<div class="sme-api-badge sme-badge-patch">PATCH</div>' +
        '<code class="sme-dev-path">/payment-consents/{ConsentId}</code>' +
        '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "Status": </span><span class="sme-cs">"Authorised"</span><span class="sme-cv">,\n    "AuthorisationCode": </span><span class="sme-cs">"eyJhbGci..."</span>\n<span class="sme-cv">  }\n}</span></pre>' +
        '<div class="sme-dev-label" style="margin-top:12px;">OAUTH2 — Token Exchange</div>' +
        '<div class="sme-api-badge sme-badge-post">POST</div>' +
        '<code class="sme-dev-path">/as/token</code>' +
        '<pre class="sme-code-block"><span class="sme-ck">// Exchange auth code for access token\n</span><span class="sme-cv">grant_type=authorization_code\n&amp;code=</span><span class="sme-cs">eyJhbGci...</span><span class="sme-cv">\n&amp;redirect_uri=</span><span class="sme-cs">https://tpp.example/callback</span></pre>' +
      '</div>'
  },

  /* ── REDIRECT TO TPP ────────────────────────────────────── */
  'redirect': {
    title: 'LFI to TPP Redirect',
    desc: '<strong>What\'s happening:</strong> PIN was correct — consent is now "Authorised". The customer sees the TPP app logo and name while the system prepares the OAuth2 redirect. The auth code is passed back to the TPP via the callback URL. <strong>Next:</strong> The TPP exchanges the auth code for an access token, then calls POST /domestic-payments to execute the payment.',
    screenHtml:
      '<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(160deg,#0F766E 0%,#1C2B4A 100%);padding:30px 20px;text-align:center;">' +
        '<div style="width:56px;height:56px;border:3px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:sme-spin 1s linear infinite;margin-bottom:20px;"></div>' +
        '<div style="background:rgba(255,255,255,.15);border-radius:12px;padding:12px 16px;text-align:center;margin-bottom:12px;">' +
          '<div style="font-size:24px;margin-bottom:6px;">&#x1F6D2;</div>' +
          '<div style="font-size:13px;font-weight:700;color:white;">Noon Ltd</div>' +
        '</div>' +
        '<div style="color:#fff;font-size:14px;font-weight:600;margin-bottom:6px;">You\'ll be redirected back to<br/><strong>Noon Ltd</strong></div>' +
        '<div style="color:rgba(255,255,255,.7);font-size:11px;">don\'t close the window.</div>' +
        '<div style="margin-top:40px;color:rgba(255,255,255,.5);font-size:10px;">Powered by</div>' +
        '<div style="color:#fff;font-size:14px;font-weight:700;letter-spacing:2px;margin-top:4px;">ALTAREQ</div>' +
      '</div>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div class="sme-dev-label">Redirect URI with Code</div>' +
        '<pre class="sme-code-block" style="word-break:break-all;"><span class="sme-cs">https://tpp.example/callback</span><span class="sme-cv">\n  ?code=</span><span class="sme-cs">eyJhbGciOiJSUzI1NiJ9...</span><span class="sme-cv">\n  &amp;state=</span><span class="sme-cs">abc123xyz</span><span class="sme-cv">\n  &amp;iss=</span><span class="sme-cs">https://nebras.adcb.ae</span></pre>' +
        '<div class="sme-dev-label" style="margin-top:12px;">POST — Domestic Payment</div>' +
        '<div class="sme-api-badge sme-badge-post">POST</div>' +
        '<code class="sme-dev-path">/domestic-payments</code>' +
        '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "ConsentId": </span><span class="sme-cs">"pcon-0001"</span><span class="sme-cv">,\n    "Initiation": {\n      "InstructedAmount": {\n        "Amount": </span><span class="sme-cs">"100.00"</span><span class="sme-cv">, "Currency": </span><span class="sme-cs">"AED"</span>\n<span class="sme-cv">      }\n    }\n  },\n  "Risk": {\n    "PaymentContextCode": </span><span class="sme-cs">"EcommerceGoods"</span>\n<span class="sme-cv">  }\n}</span></pre>' +
      '</div>'
  },

  /* ── ACCESS RESTRICTED ──────────────────────────────────── */
  'access-restricted': {
    title: 'Error — Access Restricted',
    desc: '<strong>What\'s happening:</strong> The customer logged in successfully but is NOT a Super User or Sole Owner (e.g. they are a Maker or Checker in the SME hierarchy). ADCB blocks the consent flow. <strong>Next:</strong> Consent is PATCH\'d to "Rejected" with reason "NotSuperUser". Customer is redirected back to the TPP, which receives the rejection.',
    screenHtml:
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #E2E8F0;"><div style="display:flex;align-items:center;gap:6px;"><div style="width:22px;height:22px;background:#E31E24;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">&#x25B6;</div><div style="font-size:13px;font-weight:700;">Confirm Payment Details</div></div><div style="width:22px;height:22px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#666;">&#x2715;</div></div>' +
      '<div style="text-align:center;padding:10px;"><div style="font-size:13px;color:#0D3349;">&#x0627;&#x0644;&#x0637;&#x0627;&#x0631;&#x0642;</div><div style="font-size:16px;font-weight:700;color:#0D3349;letter-spacing:2px;">ALTAREQ</div></div>' +
      '<div style="padding:30px 20px;text-align:center;">' +
        '<div style="width:56px;height:56px;border-radius:50%;background:#FEE2E2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;">&#x2716;</div>' +
        '<div style="font-size:16px;font-weight:700;color:#0F172A;margin-bottom:8px;">Access Restricted</div>' +
        '<div style="font-size:13px;color:#475569;line-height:1.6;margin-bottom:20px;">Only Super Admin users have access to authorise payments. Please contact your account administrator.</div>' +
        '<button style="background:white;color:#0F172A;border:1px solid #E2E8F0;border-radius:24px;padding:11px 24px;font-size:13px;font-weight:600;cursor:pointer;">Close</button>' +
      '</div>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div class="sme-dev-label">PATCH — Rejected (Not Superuser)</div>' +
        '<div class="sme-api-badge sme-badge-patch">PATCH</div>' +
        '<code class="sme-dev-path">/payment-consents/{ConsentId}</code>' +
        '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "Status": </span><span class="sme-cs">"Rejected"</span><span class="sme-cv">,\n    "StatusReason": </span><span class="sme-cs">"NotSuperUser"</span>\n<span class="sme-cv">  }\n}</span></pre>' +
        '<div style="margin-top:10px;padding:10px 12px;background:#1a1a2e;border-left:3px solid #EF4444;border-radius:4px;font-size:11px;color:#FCA5A5;">User role check: ADCB verifies SME is Super User / Sole Owner. Non-qualifying roles see this screen.</div>' +
      '</div>'
  },

  /* ── NO ACCOUNTS ────────────────────────────────────────── */
  'no-accounts': {
    title: 'Error — No Accounts Available',
    desc: '<strong>What\'s happening:</strong> The customer is a Super User but has zero eligible AED CASA accounts. Non-AED and non-CASA accounts are filtered out. <strong>Next:</strong> Consent is rejected, customer is redirected to the TPP. The TPP sees the rejection and can advise the customer to link an eligible account.',
    screenHtml:
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #E2E8F0;"><div style="display:flex;align-items:center;gap:6px;"><div style="width:22px;height:22px;background:#E31E24;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">&#x25B6;</div><div style="font-size:13px;font-weight:700;">Confirm Payment Details</div></div><div style="width:22px;height:22px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#666;">&#x2715;</div></div>' +
      '<div style="text-align:center;padding:10px;"><div style="font-size:13px;color:#0D3349;">&#x0627;&#x0644;&#x0637;&#x0627;&#x0631;&#x0642;</div><div style="font-size:16px;font-weight:700;color:#0D3349;letter-spacing:2px;">ALTAREQ</div></div>' +
      '<div style="padding:30px 20px;text-align:center;">' +
        '<div style="width:56px;height:56px;border-radius:50%;background:#FEE2E2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;">&#x2716;</div>' +
        '<div style="font-size:16px;font-weight:700;color:#0F172A;margin-bottom:8px;">No Accounts Available for Payment</div>' +
        '<div style="font-size:13px;color:#475569;line-height:1.6;margin-bottom:20px;">There are no eligible CASA accounts linked to your ProCash profile for this payment.</div>' +
        '<button style="background:white;color:#0F172A;border:1px solid #E2E8F0;border-radius:24px;padding:11px 24px;font-size:13px;font-weight:600;cursor:pointer;">Close</button>' +
      '</div>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div class="sme-dev-label">GET /accounts — Empty Result</div>' +
        '<div class="sme-api-badge sme-badge-get">GET</div>' +
        '<code class="sme-dev-path">/accounts</code>' +
        '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "Account": []\n  },\n  "Meta": {\n    "TotalPages": </span><span class="sme-cn">0\n  </span><span class="sme-cv">}\n}</span></pre>' +
        '<div style="margin-top:10px;padding:10px 12px;background:#1a1a2e;border-left:3px solid #F59E0B;border-radius:4px;font-size:11px;color:#FDE68A;">Empty account array triggers the "No Accounts" screen. ADCB checks eligibility criteria (CASA, AED, active status) before returning.</div>' +
      '</div>'
  },

  /* ── AUTH EXPIRED ───────────────────────────────────────── */
  'auth-expired': {
    title: 'Error — Authorisation Expired',
    desc: '<strong>What\'s happening:</strong> The 10-minute authorisation window has elapsed. The customer took too long to complete the consent journey (e.g. got distracted, left the app). <strong>Next:</strong> Consent is rejected with "AuthWindowExpired". Customer must go back to the TPP and start a new payment request from scratch.',
    screenHtml:
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #E2E8F0;"><div style="display:flex;align-items:center;gap:6px;"><div style="width:22px;height:22px;background:#E31E24;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">&#x25B6;</div><div style="font-size:13px;font-weight:700;">Confirm Payment Details</div></div><div style="width:22px;height:22px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#666;">&#x2715;</div></div>' +
      '<div style="text-align:center;padding:10px;"><div style="font-size:13px;color:#0D3349;">&#x0627;&#x0644;&#x0637;&#x0627;&#x0631;&#x0642;</div><div style="font-size:16px;font-weight:700;color:#0D3349;letter-spacing:2px;">ALTAREQ</div></div>' +
      '<div style="padding:30px 20px;text-align:center;">' +
        '<div style="width:56px;height:56px;border-radius:50%;background:#FEF3C7;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;">&#x23F0;</div>' +
        '<div style="font-size:16px;font-weight:700;color:#0F172A;margin-bottom:8px;">Authorisation Expired</div>' +
        '<div style="font-size:13px;color:#475569;line-height:1.6;margin-bottom:20px;">Your 10-minute authorisation window has expired. Please return to the TPP app and try again.</div>' +
        '<button style="background:white;color:#0F172A;border:1px solid #E2E8F0;border-radius:24px;padding:11px 24px;font-size:13px;font-weight:600;cursor:pointer;">Close</button>' +
      '</div>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div class="sme-dev-label">PATCH — Rejected (Expired)</div>' +
        '<div class="sme-api-badge sme-badge-patch">PATCH</div>' +
        '<code class="sme-dev-path">/payment-consents/{ConsentId}</code>' +
        '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "Status": </span><span class="sme-cs">"Rejected"</span><span class="sme-cv">,\n    "StatusReason": </span><span class="sme-cs">"AuthWindowExpired"</span><span class="sme-cv">,\n    "ExpirationDateTime": </span><span class="sme-cs">"2026-04-16T10:10:00Z"</span>\n<span class="sme-cv">  }\n}</span></pre>' +
      '</div>'
  },

  /* ── UNSUCCESSFUL ───────────────────────────────────────── */
  'unsuccessful': {
    title: 'Error — Unsuccessful',
    desc: '<strong>What\'s happening:</strong> Either the customer entered the wrong PIN 3 times (MAX_AUTH_ATTEMPTS_EXCEEDED) or a system error occurred during EFR/PIN. The consent is irrecoverably rejected. <strong>Next:</strong> Customer must close ProCash, return to the TPP, and initiate a brand new payment.',
    screenHtml:
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #E2E8F0;"><div style="display:flex;align-items:center;gap:6px;"><div style="width:22px;height:22px;background:#E31E24;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">&#x25B6;</div><div style="font-size:13px;font-weight:700;">Confirm Payment Details</div></div><div style="width:22px;height:22px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#666;">&#x2715;</div></div>' +
      '<div style="text-align:center;padding:10px;"><div style="font-size:13px;color:#0D3349;">&#x0627;&#x0644;&#x0637;&#x0627;&#x0631;&#x0642;</div><div style="font-size:16px;font-weight:700;color:#0D3349;letter-spacing:2px;">ALTAREQ</div></div>' +
      '<div style="padding:30px 20px;text-align:center;">' +
        '<div style="width:56px;height:56px;border-radius:50%;background:#FEE2E2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;">&#x2716;</div>' +
        '<div style="font-size:16px;font-weight:700;color:#0F172A;margin-bottom:4px;">Unsuccessful</div>' +
        '<div style="font-size:13px;color:#475569;margin-bottom:20px;">Something went wrong. Please try again.</div>' +
        '<button style="background:white;color:#0F172A;border:1px solid #E2E8F0;border-radius:24px;padding:11px 24px;font-size:13px;font-weight:600;cursor:pointer;">Close</button>' +
      '</div>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div class="sme-dev-label">PATCH — Rejected (System Error)</div>' +
        '<div class="sme-api-badge sme-badge-patch">PATCH</div>' +
        '<code class="sme-dev-path">/payment-consents/{ConsentId}</code>' +
        '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "Status": </span><span class="sme-cs">"Rejected"</span><span class="sme-cv">,\n    "StatusReason": </span><span class="sme-cs">"SystemError"</span>\n<span class="sme-cv">  }\n}</span></pre>' +
      '</div>'
  },

  /* ── TWO ACCOUNTS ───────────────────────────────────────── */
  'two-accounts': {
    title: 'Account Variant — 2 Accounts',
    desc: '<strong>What\'s happening:</strong> Customer has exactly 2 eligible CASA accounts. Both are shown directly — no search bar, no "View All". Neither is pre-selected. <strong>Next:</strong> Customer taps one to select it, then proceeds with "Pay using AlTareq" to the PIN screen.',
    screenHtml:
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #E2E8F0;"><div style="display:flex;align-items:center;gap:6px;"><div style="width:22px;height:22px;background:#E31E24;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">&#x25B6;</div><div style="font-size:13px;font-weight:700;">Confirm Payment Details</div></div><div style="width:22px;height:22px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#666;">&#x2715;</div></div>' +
      '<div style="text-align:center;padding:10px;"><div style="font-size:13px;color:#0D3349;">&#x0627;&#x0644;&#x0637;&#x0627;&#x0631;&#x0642;</div><div style="font-size:16px;font-weight:700;color:#0D3349;letter-spacing:2px;">ALTAREQ</div></div>' +
      '<div style="padding:12px 16px;">' +
        '<div style="font-size:12px;font-weight:700;color:#0F172A;margin-bottom:8px;">Select Account to Pay from</div>' +
        '<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid #f5f5f5;"><div style="width:16px;height:16px;border-radius:50%;border:2px solid #ccc;"></div><div style="flex:1;"><div style="font-size:11px;font-weight:600;">ADCB Current — **** 4521</div><div style="font-size:10px;color:#475569;">AED 24,500.00</div></div></div>' +
        '<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid #f5f5f5;"><div style="width:16px;height:16px;border-radius:50%;border:2px solid #ccc;"></div><div style="flex:1;"><div style="font-size:11px;font-weight:600;">ADCB Savings — **** 8834</div><div style="font-size:10px;color:#475569;">AED 12,300.50</div></div></div>' +
        '<button style="background:linear-gradient(135deg,#00B4C8,#005f6b);color:white;border:none;border-radius:24px;padding:12px;width:calc(100% - 28px);margin:12px 14px 8px;font-size:13px;font-weight:600;cursor:pointer;">&#x1F512; Pay using AlTareq</button>' +
        '<button style="background:white;color:#0F172A;border:1px solid #E2E8F0;border-radius:24px;padding:11px;width:calc(100% - 28px);margin:0 14px 12px;font-size:13px;font-weight:600;cursor:pointer;">Cancel</button>' +
      '</div>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div class="sme-dev-label">GET /accounts — 2 Accounts Returned</div>' +
        '<div class="sme-api-badge sme-badge-get">GET</div>' +
        '<code class="sme-dev-path">/accounts</code>' +
        '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "Account": [\n      { "AccountId": </span><span class="sme-cs">"acc-4521"</span><span class="sme-cv">, "AccountSubType": </span><span class="sme-cs">"CurrentAccount"</span><span class="sme-cv"> },\n      { "AccountId": </span><span class="sme-cs">"acc-8834"</span><span class="sme-cv">, "AccountSubType": </span><span class="sme-cs">"Savings"</span><span class="sme-cv"> }\n    ]\n  }\n}</span></pre>' +
      '</div>'
  },

  /* ── ONE ACCOUNT ────────────────────────────────────────── */
  'one-account': {
    title: 'Account Variant — 1 Account (Pre-selected)',
    desc: '<strong>What\'s happening:</strong> Customer has only 1 eligible CASA account. It\'s shown as "Account to Pay from" with a red play icon — no radio button, no selection needed. <strong>Next:</strong> Customer reviews the details and taps "Pay using AlTareq" to proceed directly to PIN.',
    screenHtml:
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #E2E8F0;"><div style="display:flex;align-items:center;gap:6px;"><div style="width:22px;height:22px;background:#E31E24;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">&#x25B6;</div><div style="font-size:13px;font-weight:700;">Confirm Payment Details</div></div><div style="width:22px;height:22px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#666;">&#x2715;</div></div>' +
      '<div style="text-align:center;padding:10px;"><div style="font-size:13px;color:#0D3349;">&#x0627;&#x0644;&#x0637;&#x0627;&#x0631;&#x0642;</div><div style="font-size:16px;font-weight:700;color:#0D3349;letter-spacing:2px;">ALTAREQ</div></div>' +
      '<div style="padding:12px 16px;">' +
        '<div style="font-size:13px;font-weight:700;color:#0F172A;margin-bottom:8px;">Confirm Payment Details</div>' +
        '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Amount</span><span style="font-weight:600;color:#0F172A;" style="color:#E31E24;font-weight:700;">100 Dirhams</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Payee</span><span style="font-weight:600;color:#0F172A;">Noon</span></div>' +
        '<div style="margin-top:12px;padding:10px 12px;background:#F0FDFA;border:1px solid #99F6E4;border-radius:8px;display:flex;align-items:center;gap:10px;">' +
          '<div style="width:28px;height:28px;border-radius:50%;background:#E31E24;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;flex-shrink:0;">&#x25BA;</div>' +
          '<div>' +
            '<div style="font-size:11px;color:#0F766E;font-weight:700;margin-bottom:2px;">Account to Pay from</div>' +
            '<div style="font-size:13px;font-weight:700;color:#0F172A;">ADCB Current — **** 4521</div>' +
          '</div>' +
        '</div>' +
        '<button style="background:linear-gradient(135deg,#00B4C8,#005f6b);color:white;border:none;border-radius:24px;padding:12px;width:calc(100% - 28px);margin:14px 14px 8px;font-size:13px;font-weight:600;cursor:pointer;">&#x1F512; Pay using AlTareq</button>' +
        '<button style="background:white;color:#0F172A;border:1px solid #E2E8F0;border-radius:24px;padding:11px;width:calc(100% - 28px);margin:0 14px 12px;font-size:13px;font-weight:600;cursor:pointer;">Cancel</button>' +
      '</div>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div class="sme-dev-label">GET /accounts — 1 Account (Auto-selected)</div>' +
        '<div class="sme-api-badge sme-badge-get">GET</div>' +
        '<code class="sme-dev-path">/accounts</code>' +
        '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "Account": [\n      { "AccountId": </span><span class="sme-cs">"acc-4521"</span><span class="sme-cv">, "AccountSubType": </span><span class="sme-cs">"CurrentAccount"</span><span class="sme-cv"> }\n    ]\n  }\n}\n</span><span class="sme-ck">// Single account = shown as "Account to Pay from"\n// No radio button selection needed</span></pre>' +
      '</div>'
  },

  /* ── TPP PRE-SELECTED ───────────────────────────────────── */
  'tpp-selected': {
    title: 'Account Variant — TPP Pre-selected',
    desc: '<strong>What\'s happening:</strong> The TPP pre-specified the DebtorAccount in the consent request. The account is shown as "Account selected for the payment at [TPP name]" with a red play icon — the customer cannot change it. <strong>Next:</strong> Customer reviews and taps "Pay using AlTareq" to proceed to PIN. No account selection step needed.',
    screenHtml:
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #E2E8F0;"><div style="display:flex;align-items:center;gap:6px;"><div style="width:22px;height:22px;background:#E31E24;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">&#x25B6;</div><div style="font-size:13px;font-weight:700;">Confirm Payment Details</div></div><div style="width:22px;height:22px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#666;">&#x2715;</div></div>' +
      '<div style="text-align:center;padding:10px;"><div style="font-size:13px;color:#0D3349;">&#x0627;&#x0644;&#x0637;&#x0627;&#x0631;&#x0642;</div><div style="font-size:16px;font-weight:700;color:#0D3349;letter-spacing:2px;">ALTAREQ</div></div>' +
      '<div style="padding:12px 16px;">' +
        '<div style="font-size:13px;font-weight:700;color:#0F172A;margin-bottom:8px;">Confirm Payment Details</div>' +
        '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Amount</span><span style="font-weight:600;color:#0F172A;" style="color:#E31E24;font-weight:700;">100 Dirhams</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Payee</span><span style="font-weight:600;color:#0F172A;">Noon</span></div>' +
        '<div style="margin-top:12px;padding:10px 12px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;">' +
          '<div style="font-size:11px;color:#1E40AF;font-weight:700;margin-bottom:2px;">Connected Account (selected by TPP)</div>' +
          '<div style="font-size:13px;font-weight:700;color:#0F172A;">ADCB Current — **** 4521</div>' +
          '<div style="font-size:10px;color:#475569;margin-top:2px;">AED 24,500.00</div>' +
        '</div>' +
        '<button style="background:linear-gradient(135deg,#00B4C8,#005f6b);color:white;border:none;border-radius:24px;padding:12px;width:calc(100% - 28px);margin:14px 14px 8px;font-size:13px;font-weight:600;cursor:pointer;">&#x1F512; Pay using AlTareq</button>' +
        '<button style="background:white;color:#0F172A;border:1px solid #E2E8F0;border-radius:24px;padding:11px;width:calc(100% - 28px);margin:0 14px 12px;font-size:13px;font-weight:600;cursor:pointer;">Cancel</button>' +
      '</div>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div class="sme-dev-label">GET Consent — DebtorAccount Set by TPP</div>' +
        '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "Initiation": {\n      "DebtorAccount": {\n        "SchemeName": </span><span class="sme-cs">"IBAN"</span><span class="sme-cv">,\n        "Identification": </span><span class="sme-cs">"AE210610000000004521"</span><span class="sme-cv">,\n        "Name": </span><span class="sme-cs">"MERTTEST LLC"</span>\n<span class="sme-cv">      }\n    }\n  }\n}</span></pre>' +
        '<div style="margin-top:8px;padding:8px 12px;background:#1a1a2e;border-left:3px solid #60A5FA;border-radius:4px;font-size:11px;color:#93C5FD;">When TPP provides DebtorAccount in consent initiation, ADCB shows it as "Connected Account" (locked — no account switcher).</div>' +
      '</div>'
  },

  /* ── CANCEL CONSENT ─────────────────────────────────────── */
  'cancel-consent': {
    title: 'Cancel — Consent Screen',
    desc: '<strong>What\'s happening:</strong> The customer is on the consent screen and decides to abandon the payment. They can tap either the "Cancel" button or the X in the top right corner — both have the same effect. <strong>Next:</strong> Consent is PATCH\'d to "Rejected" with reason "CustomerCancelled". Session ends. Customer is redirected back to the TPP with error=access_denied.',
    screenHtml:
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #E2E8F0;"><div style="display:flex;align-items:center;gap:6px;"><div style="width:22px;height:22px;background:#E31E24;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">&#x25B6;</div><div style="font-size:13px;font-weight:700;">Confirm Payment Details</div></div><div style="width:22px;height:22px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#666;">&#x2715;</div></div>' +
      '<div style="text-align:center;padding:10px;"><div style="font-size:13px;color:#0D3349;">&#x0627;&#x0644;&#x0637;&#x0627;&#x0631;&#x0642;</div><div style="font-size:16px;font-weight:700;color:#0D3349;letter-spacing:2px;">ALTAREQ</div></div>' +
      '<div style="padding:12px 16px;">' +
        '<div style="font-size:13px;font-weight:700;color:#0F172A;margin-bottom:8px;">Confirm Payment Details</div>' +
        '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Amount</span><span style="font-weight:600;color:#0F172A;" style="color:#E31E24;font-weight:700;">100 Dirhams</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Payee</span><span style="font-weight:600;color:#0F172A;">Noon</span></div>' +
        '<button style="background:linear-gradient(135deg,#00B4C8,#005f6b);color:white;border:none;border-radius:24px;padding:12px;width:calc(100% - 28px);margin:14px 14px 8px;font-size:13px;font-weight:600;cursor:pointer;opacity:0.5;">&#x1F512; Pay using AlTareq</button>' +
        '<button style="background:white;color:#E31E24;border:2px solid #E31E24;border-radius:24px;padding:11px;width:calc(100% - 28px);margin:0 14px 12px;font-size:13px;font-weight:700;cursor:pointer;">Cancel &#x2014; Customer taps this</button>' +
        '<div style="text-align:center;margin-top:10px;font-size:11px;color:#475569;">Tapping Cancel will return you to the merchant app.</div>' +
      '</div>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div class="sme-dev-label">PATCH — Rejected (Customer Cancelled)</div>' +
        '<div class="sme-api-badge sme-badge-patch">PATCH</div>' +
        '<code class="sme-dev-path">/payment-consents/{ConsentId}</code>' +
        '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "Status": </span><span class="sme-cs">"Rejected"</span><span class="sme-cv">,\n    "StatusReason": </span><span class="sme-cs">"CustomerCancelled"</span>\n<span class="sme-cv">  }\n}</span></pre>' +
      '</div>'
  },

  /* ── TPP REDIRECT TO APP ────────────────────────────────── */
  'tpp-redirect-to-app': {
    title: 'TPP — Deep Link Decision',
    desc: '<strong>What\'s happening:</strong> The TPP has initiated the payment and is redirecting the customer to ADCB. The device checks whether ProCash is installed. If yes — opens via deep link. If no — redirects to App Store (iOS) or Play Store (Android). <strong>Next:</strong> If ProCash opens, customer either unlocks (if logged in) or sees the login screen (if not).',
    screenHtml:
      '<div style="padding:16px;">' +
        '<div style="font-size:13px;font-weight:700;color:#0F172A;margin-bottom:14px;text-align:center;">Deep Link Flow</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">' +
          '<div style="padding:10px 12px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;text-align:center;">' +
            '<div style="font-size:11px;font-weight:700;color:#1E40AF;">TPP initiates Open Finance payment</div>' +
          '</div>' +
          '<div style="text-align:center;color:#CBD5E1;font-size:18px;">&#x2193;</div>' +
          '<div style="padding:10px 12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;text-align:center;">' +
            '<div style="font-size:11px;font-weight:700;color:#0F172A;">Device checks: ProCash installed?</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px;">' +
            '<div>' +
              '<div style="text-align:center;color:#22C55E;font-size:13px;font-weight:700;margin-bottom:4px;">YES &#x2193;</div>' +
              '<div style="padding:8px;background:#F0FDF4;border:1px solid #86EFAC;border-radius:8px;text-align:center;font-size:10px;font-weight:600;color:#15803D;">Open ProCash<br/>via deep link</div>' +
            '</div>' +
            '<div>' +
              '<div style="text-align:center;color:#EF4444;font-size:13px;font-weight:700;margin-bottom:4px;">NO &#x2193;</div>' +
              '<div style="padding:8px;background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;text-align:center;font-size:10px;font-weight:600;color:#B91C1C;">Redirect to<br/>App Store</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div class="sme-dev-label">Deep Link URI Structure</div>' +
        '<pre class="sme-code-block" style="word-break:break-all;"><span class="sme-cs">procash://open-finance/authorize</span><span class="sme-cv">\n  ?request_uri=</span><span class="sme-cs">urn:adcb:bwc:1234abcd</span><span class="sme-cv">\n  &amp;client_id=</span><span class="sme-cs">tpp-client-id-001</span></pre>' +
        '<div class="sme-dev-label" style="margin-top:12px;">Universal Link Fallback</div>' +
        '<pre class="sme-code-block"><span class="sme-ck">// iOS Universal Link / Android App Link\n</span><span class="sme-cs">https://altareq.adcb.ae/open-finance/authorize<br>  ?request_uri=urn:adcb:bwc:1234abcd</span></pre>' +
      '</div>'
  },

  /* ── IDENTIFY SUPERUSER ─────────────────────────────────── */
  'identify-superuser': {
    title: 'Eligibility — Superuser Check',
    desc: '<strong>What\'s happening:</strong> Customer just logged in. ADCB checks their profile — are they a Super User or Sole Owner? This determines whether they can proceed. <strong>Next:</strong> If Super User → directed to the consent details screen. If NOT → "Access Restricted" error shown, consent rejected, customer redirected to TPP.',
    screenHtml:
      '<div style="padding:16px;">' +
        '<div style="font-size:12px;font-weight:700;color:#0F172A;margin-bottom:14px;">ADCB Superuser Eligibility Check</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">' +
          '<div style="padding:10px 12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">' +
            '<div style="font-size:11px;font-weight:700;color:#475569;margin-bottom:3px;">Logged in as</div>' +
            '<div style="font-size:13px;font-weight:700;color:#0F172A;">MERTTEST</div>' +
          '</div>' +
          '<div style="padding:10px 12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">' +
            '<div style="font-size:11px;font-weight:700;color:#475569;margin-bottom:3px;">Role Check</div>' +
            '<div style="font-size:12px;color:#0F172A;">Is Super User / Sole Owner?</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
            '<div style="padding:8px;background:#F0FDF4;border:1px solid #86EFAC;border-radius:8px;text-align:center;">' +
              '<div style="font-size:11px;font-weight:700;color:#15803D;">YES</div>' +
              '<div style="font-size:9px;color:#475569;margin-top:2px;">Proceed to consent</div>' +
            '</div>' +
            '<div style="padding:8px;background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;text-align:center;">' +
              '<div style="font-size:11px;font-weight:700;color:#B91C1C;">NO</div>' +
              '<div style="font-size:9px;color:#475569;margin-top:2px;">Access restricted</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div class="sme-dev-label">Internal Role Check (ADCB Core)</div>' +
        '<pre class="sme-code-block"><span class="sme-ck">// ADCB internal check on ProCash login\n// Checks user role in SME profile\n</span><span class="sme-cv">UserRole.isSuperUser = </span><span class="sme-cn">true/false\n</span><span class="sme-cv">UserRole.isSoleOwner = </span><span class="sme-cn">true/false</span></pre>' +
        '<div style="margin-top:8px;padding:8px 12px;background:#1a1a2e;border-left:3px solid #F59E0B;border-radius:4px;font-size:11px;color:#FDE68A;">Gap G-01: No API defined for returning user role. ADCB needs to clarify how Nebras/OF Layer receives role confirmation.</div>' +
      '</div>'
  },

  /* ── CONFIRM PAYMENT ────────────────────────────────────── */
  'confirm-payment': {
    title: 'Confirm Payment — Pay Button Active',
    desc: '<strong>What\'s happening:</strong> Customer has reviewed all payment details and selected an account. The "Pay using AlTareq" button is now active. If NO account is selected, the button is disabled or shows inline validation. <strong>Next:</strong> Tapping "Pay using AlTareq" sends PATCH (AccountSelected) and directs the customer to ProCash MFA (PIN/biometric).',
    screenHtml:
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #E2E8F0;"><div style="display:flex;align-items:center;gap:6px;"><div style="width:22px;height:22px;background:#E31E24;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">&#x25B6;</div><div style="font-size:13px;font-weight:700;">Confirm Payment Details</div></div><div style="width:22px;height:22px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#666;">&#x2715;</div></div>' +
      '<div style="text-align:center;padding:10px;"><div style="font-size:13px;color:#0D3349;">&#x0627;&#x0644;&#x0637;&#x0627;&#x0631;&#x0642;</div><div style="font-size:16px;font-weight:700;color:#0D3349;letter-spacing:2px;">ALTAREQ</div></div>' +
      '<div style="padding:12px 16px;">' +
        '<div style="font-size:13px;font-weight:700;color:#0F172A;margin-bottom:8px;">Confirm Payment</div>' +
        '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Amount</span><span style="font-weight:600;color:#0F172A;" style="color:#E31E24;font-weight:700;">100 Dirhams</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Payee</span><span style="font-weight:600;color:#0F172A;">Noon</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">Date</span><span style="font-weight:600;color:#0F172A;">16 Apr 2026</span></div>' +
        '<div style="margin-top:10px;padding:10px 12px;background:#F0FDFA;border:1px solid #99F6E4;border-radius:8px;">' +
          '<div style="font-size:11px;color:#0F766E;font-weight:700;margin-bottom:2px;">Pay from</div>' +
          '<div style="font-size:13px;font-weight:700;color:#0F172A;">ADCB Current — **** 4521 &#x2713;</div>' +
        '</div>' +
        '<button style="background:linear-gradient(135deg,#00B4C8,#005f6b);color:white;border:none;border-radius:24px;padding:12px;width:calc(100% - 28px);margin:14px 14px 8px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(14,118,110,.35);">&#x1F512; Confirm &amp; Pay AED 100</button>' +
        '<button style="background:white;color:#0F172A;border:1px solid #E2E8F0;border-radius:24px;padding:11px;width:calc(100% - 28px);margin:0 14px 12px;font-size:13px;font-weight:600;cursor:pointer;">Cancel</button>' +
      '</div>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div class="sme-dev-label">PATCH — Account Confirmed</div>' +
        '<div class="sme-api-badge sme-badge-patch">PATCH</div>' +
        '<code class="sme-dev-path">/payment-consents/{ConsentId}</code>' +
        '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "Status": </span><span class="sme-cs">"AccountSelected"</span><span class="sme-cv">,\n    "DebtorAccount": {\n      "SchemeName": </span><span class="sme-cs">"IBAN"</span><span class="sme-cv">,\n      "Identification": </span><span class="sme-cs">"AE210610000000004521"</span>\n<span class="sme-cv">    }\n  }\n}</span></pre>' +
      '</div>'
  },

  /* ── PAYMENT EXECUTION ──────────────────────────────────── */
  'payment-execution': {
    title: 'Payment Execution — Processing',
    desc: '<strong>What\'s happening:</strong> The consent was authorised and the customer was redirected to the TPP. The TPP has now called POST /domestic-payments to execute the actual payment via the IPS/UAEFTS rail. This screen shows the payment processing state. <strong>Next:</strong> The TPP polls GET /domestic-payments/{id} to check status — Pending → AcceptedSettlementCompleted or Rejected.',
    screenHtml:
      '<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(160deg,#1C2B4A 0%,#0F766E 100%);padding:30px 20px;text-align:center;">' +
        '<div style="width:56px;height:56px;border:3px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:sme-spin 1s linear infinite;margin-bottom:20px;"></div>' +
        '<div style="color:#fff;font-size:16px;font-weight:700;margin-bottom:8px;">Processing Payment</div>' +
        '<div style="color:rgba(255,255,255,.7);font-size:12px;margin-bottom:20px;">Executing via IPS / UAEFTS rail</div>' +
        '<div style="background:rgba(255,255,255,.1);border-radius:10px;padding:14px 18px;text-align:left;width:100%;box-sizing:border-box;">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:rgba(255,255,255,.6);font-size:11px;">Amount</span><span style="color:#fff;font-size:12px;font-weight:700;">AED 100.00</span></div>' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:rgba(255,255,255,.6);font-size:11px;">Payee</span><span style="color:#fff;font-size:12px;font-weight:700;">Noon</span></div>' +
          '<div style="display:flex;justify-content:space-between;"><span style="color:rgba(255,255,255,.6);font-size:11px;">Rail</span><span style="color:#fff;font-size:12px;font-weight:700;">IPS (SIP)</span></div>' +
        '</div>' +
      '</div>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div class="sme-dev-label">POST — Create Domestic Payment</div>' +
        '<div class="sme-api-badge sme-badge-post">POST</div>' +
        '<code class="sme-dev-path">/domestic-payments</code>' +
        '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "ConsentId": </span><span class="sme-cs">"pcon-0001"</span><span class="sme-cv">,\n    "Initiation": {\n      "InstructedAmount": {\n        "Amount": </span><span class="sme-cs">"100.00"</span><span class="sme-cv">, "Currency": </span><span class="sme-cs">"AED"</span>\n<span class="sme-cv">      },\n      "CreditorAccount": {\n        "SchemeName": </span><span class="sme-cs">"IBAN"</span><span class="sme-cv">,\n        "Identification": </span><span class="sme-cs">"AE210610012345678901234"</span>\n<span class="sme-cv">      }\n    }\n  },\n  "Risk": {\n    "PaymentContextCode": </span><span class="sme-cs">"EcommerceGoods"</span><span class="sme-cv">,\n    "DeliveryAddress": null\n  }\n}</span></pre>' +
      '</div>'
  },

  /* ── TIMEOUT ERROR ──────────────────────────────────────── */
  'timeout-error': {
    title: 'System Error / Session Timeout',
    desc: '<strong>What\'s happening:</strong> Either a technical error occurred during the consent journey, or the customer\'s ProCash session timed out after 10 minutes of inactivity on the Consent Detail Screen. <strong>Next:</strong> Consent is rejected. Customer must return to the TPP app and initiate a new payment request.',
    screenHtml:
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #E2E8F0;"><div style="display:flex;align-items:center;gap:6px;"><div style="width:22px;height:22px;background:#E31E24;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">&#x25B6;</div><div style="font-size:13px;font-weight:700;">Confirm Payment Details</div></div><div style="width:22px;height:22px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#666;">&#x2715;</div></div>' +
      '<div style="text-align:center;padding:10px;"><div style="font-size:13px;color:#0D3349;">&#x0627;&#x0644;&#x0637;&#x0627;&#x0631;&#x0642;</div><div style="font-size:16px;font-weight:700;color:#0D3349;letter-spacing:2px;">ALTAREQ</div></div>' +
      '<div style="padding:30px 20px;text-align:center;">' +
        '<div style="width:56px;height:56px;border-radius:50%;background:#FEF3C7;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;">&#x26A0;</div>' +
        '<div style="font-size:16px;font-weight:700;color:#0F172A;margin-bottom:4px;">Technical Error</div>' +
        '<div style="font-size:13px;color:#475569;margin-bottom:8px;">We encountered a problem processing your request.</div>' +
        '<div style="font-size:11px;color:#94A3B8;margin-bottom:20px;">Error code: ADCB-OF-5001</div>' +
        '<button style="background:linear-gradient(135deg,#00B4C8,#005f6b);color:white;border:none;border-radius:24px;padding:11px 24px;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:8px;">Try Again</button>' +
        '<button style="background:white;color:#0F172A;border:1px solid #E2E8F0;border-radius:24px;padding:11px 24px;font-size:13px;font-weight:600;cursor:pointer;">Close</button>' +
      '</div>',
    apisHtml:
      '<div class="sme-dev-section">' +
        '<div class="sme-dev-label">HTTP 500 / 503 Error Response</div>' +
        '<pre class="sme-code-block"><span class="sme-cv">HTTP/1.1 </span><span class="sme-cn">500 Internal Server Error\n\n</span><span class="sme-cv">{\n  "Errors": [{\n    "ErrorCode": </span><span class="sme-cs">"UK.OBIE.Unexpected.SystemError"</span><span class="sme-cv">,\n    "Message": </span><span class="sme-cs">"An unexpected error occurred"</span><span class="sme-cv">,\n    "Url": </span><span class="sme-cs">"https://adcb.ae/errors/ADCB-OF-5001"</span>\n<span class="sme-cv">  }]\n}</span></pre>' +
      '</div>'
  }
};

/* ============================================================
   4. SME_SIP_ACS
   Acceptance Criteria groups by JIRA story
   ============================================================ */

var SME_SIP_ACS = [

  {
    id: 'DOF-1938',
    title: 'Login via ProCash',
    prereq: 'Customer has been redirected from TPP via deep link',
    acs: [
      {
        id: 'AC-01',
        title: 'Login fails — iPhone',
        given: ['Customer is on iPhone', 'ProCash app is installed', 'Customer has been redirected from TPP'],
        when: ['Customer enters incorrect credentials or token on the login screen'],
        then: ['An error message is displayed', 'Customer remains on the login screen', 'Consent status remains AwaitingAuthorisation']
      },
      {
        id: 'AC-02',
        title: 'Login fails — Android',
        given: ['Customer is on Android', 'ProCash app is installed', 'Customer has been redirected from TPP'],
        when: ['Customer enters incorrect credentials or token'],
        then: ['An error message is displayed', 'Customer remains on the login screen', 'Consent status remains AwaitingAuthorisation']
      },
      {
        id: 'AC-03',
        title: 'Login succeeds — iPhone',
        given: ['Customer is on iPhone', 'ProCash app is installed', 'Customer enters valid credentials'],
        when: ['Customer completes authentication (Mobile Token, Hard Token, SMS, or Face ID)'],
        then: ['Customer is authenticated successfully', 'Eligibility check is triggered', 'Consent screen is displayed if eligible']
      },
      {
        id: 'AC-04',
        title: 'Login succeeds — Android',
        given: ['Customer is on Android', 'ProCash app is installed', 'Customer enters valid credentials'],
        when: ['Customer completes authentication'],
        then: ['Customer is authenticated successfully', 'Eligibility check is triggered', 'Consent screen is displayed if eligible']
      }
    ]
  },

  {
    id: 'DOF-1380',
    title: 'Consent Details Screen',
    prereq: 'Customer is authenticated and eligible',
    acs: [
      {
        id: 'AC-01',
        title: 'Consent screen displays required fields',
        given: ['Customer is authenticated', 'Customer is a Super User / Sole Owner', 'Customer has at least one eligible CASA account'],
        when: ['Customer is redirected to the consent screen'],
        then: [
          'Amount and Currency are displayed in Dirhams',
          'Payee Name is displayed',
          'Date of payment is displayed',
          'Account Number (payee IBAN) is displayed',
          'Reference is displayed if provided by TPP',
          'Payment Frequency is NOT shown (SIP = one-off, not required)',
          'Payment Purpose is NOT shown in UI (stored in Nebras only)'
        ]
      }
    ]
  },

  {
    id: 'DOF-1985',
    title: 'View All Accounts',
    prereq: 'Customer is on consent / account selection screen',
    acs: [
      {
        id: 'AC-01',
        title: 'View All Accounts — iPhone',
        given: ['Customer is on iPhone', 'Customer has more than 3 eligible CASA accounts'],
        when: ['Customer taps "View All" link on the account list'],
        then: ['Full list of all eligible accounts is displayed', 'Customer can scroll through all accounts', 'Radio button selection is available on each account']
      },
      {
        id: 'AC-02',
        title: 'View All Accounts — Android',
        given: ['Customer is on Android', 'Customer has more than 3 eligible CASA accounts'],
        when: ['Customer taps "View All" link'],
        then: ['Full list of all eligible accounts is displayed', 'Customer can scroll through all accounts', 'Radio button selection is available on each account']
      }
    ]
  },

  {
    id: 'DOF-2233',
    title: 'TPP Redirect to ProCash',
    prereq: 'TPP has a valid payment consent and initiates redirect',
    acs: [
      {
        id: 'AC-01',
        title: 'iPhone — App installed, customer logged in',
        given: ['Customer is on iPhone', 'ProCash is installed', 'Customer is already logged in to ProCash'],
        when: ['TPP sends deep link to open ProCash'],
        then: ['ProCash opens directly to the consent/payment screen', 'Customer does not need to log in again']
      },
      {
        id: 'AC-02',
        title: 'iPhone — App installed, customer not logged in',
        given: ['Customer is on iPhone', 'ProCash is installed', 'Customer is not logged in'],
        when: ['TPP sends deep link to open ProCash'],
        then: ['ProCash opens to the login screen', 'After login, customer is taken to the consent screen']
      },
      {
        id: 'AC-03',
        title: 'iPhone — App not installed',
        given: ['Customer is on iPhone', 'ProCash is NOT installed'],
        when: ['TPP sends deep link'],
        then: ['Customer is redirected to the Apple App Store ProCash page', 'Payment flow is paused until app is installed']
      },
      {
        id: 'AC-04',
        title: 'Android — App installed, customer logged in',
        given: ['Customer is on Android', 'ProCash is installed', 'Customer is already logged in'],
        when: ['TPP sends deep link via Android App Link'],
        then: ['ProCash opens directly to consent screen', 'Customer does not need to log in again']
      },
      {
        id: 'AC-05',
        title: 'Android — App installed, customer not logged in',
        given: ['Customer is on Android', 'ProCash is installed', 'Customer is not logged in'],
        when: ['TPP sends deep link'],
        then: ['ProCash opens to the login screen', 'After login, customer is taken to the consent screen']
      },
      {
        id: 'AC-06',
        title: 'Android — App not installed',
        given: ['Customer is on Android', 'ProCash is NOT installed'],
        when: ['TPP sends deep link'],
        then: ['Customer is redirected to the Google Play Store ProCash page', 'Payment flow is paused until app is installed']
      }
    ]
  },

  {
    id: 'DOF-1986',
    title: 'Identify Superuser',
    prereq: 'Customer has logged in to ProCash',
    acs: [
      {
        id: 'AC-01',
        title: 'iPhone — Customer IS superuser',
        given: ['Customer is on iPhone', 'Customer is logged in to ProCash', 'Customer has Super User or Sole Owner role'],
        when: ['ADCB performs eligibility check'],
        then: ['Customer passes eligibility', 'Consent details screen is displayed', 'Account selection is available']
      },
      {
        id: 'AC-02',
        title: 'iPhone — Customer is NOT superuser',
        given: ['Customer is on iPhone', 'Customer is logged in', 'Customer does NOT have Super User or Sole Owner role'],
        when: ['ADCB performs eligibility check'],
        then: ['Access Restricted screen is displayed', '"Only Super Admin users have access" message shown', 'Consent is rejected with StatusReason: NotSuperUser', 'Customer is redirected back to TPP']
      },
      {
        id: 'AC-03',
        title: 'Android — Customer IS superuser',
        given: ['Customer is on Android', 'Customer is logged in', 'Customer has Super User or Sole Owner role'],
        when: ['ADCB performs eligibility check'],
        then: ['Customer passes eligibility', 'Consent details screen is displayed']
      },
      {
        id: 'AC-04',
        title: 'Android — Customer is NOT superuser',
        given: ['Customer is on Android', 'Customer is logged in', 'Customer does NOT have the required role'],
        when: ['ADCB performs eligibility check'],
        then: ['Access Restricted screen is displayed', 'Consent is rejected', 'Customer is redirected back to TPP']
      }
    ]
  },

  {
    id: 'DOF-2259',
    title: 'Select Account',
    prereq: 'Customer is on consent screen, has multiple eligible accounts',
    acs: [
      {
        id: 'AC-01',
        title: 'Select account — iPhone',
        given: ['Customer is on iPhone', 'Customer has 2 or more eligible CASA accounts', 'No account pre-selected by TPP'],
        when: ['Customer taps on an account from the list'],
        then: ['Selected account is highlighted with a radio button', 'Account details (name and available balance) are shown', 'Pay / Continue button becomes active']
      },
      {
        id: 'AC-02',
        title: 'Select account — Android',
        given: ['Customer is on Android', 'Customer has 2 or more eligible CASA accounts'],
        when: ['Customer taps on an account from the list'],
        then: ['Selected account is highlighted', 'Account details are shown', 'Pay button becomes active']
      }
    ]
  },

  {
    id: 'DOF-2260',
    title: 'Confirm Payment',
    prereq: 'Customer has selected an account or has single auto-selected account',
    acs: [
      {
        id: 'AC-01',
        title: 'Confirm payment — iPhone, account selected',
        given: ['Customer is on iPhone', 'Customer has selected a debit account'],
        when: ['Customer taps "Pay using AlTareq" or "Confirm & Pay"'],
        then: ['PIN / EFR screen is displayed', 'Payment amount and payee are confirmed on screen']
      },
      {
        id: 'AC-02',
        title: 'Confirm attempt — iPhone, no account selected',
        given: ['Customer is on iPhone', 'Customer has NOT selected a debit account', 'Multiple accounts are available'],
        when: ['Customer attempts to tap the Pay button'],
        then: ['Pay button remains disabled or error prompt is shown', 'Account selection is required before proceeding']
      },
      {
        id: 'AC-03',
        title: 'Confirm payment — Android, account selected',
        given: ['Customer is on Android', 'Customer has selected a debit account'],
        when: ['Customer taps the Pay button'],
        then: ['PIN / EFR screen is displayed', 'Payment details are confirmed']
      },
      {
        id: 'AC-04',
        title: 'Confirm attempt — Android, no account selected',
        given: ['Customer is on Android', 'No account selected'],
        when: ['Customer attempts to proceed without selecting an account'],
        then: ['Pay button is disabled or error is shown', 'Customer must select an account first']
      }
    ]
  },

  {
    id: 'DOF-2070',
    title: 'Cancel Payment',
    prereq: 'Customer is on any consent or account selection screen',
    acs: [
      {
        id: 'AC-01',
        title: 'Cancel via Cancel button — iPhone',
        given: ['Customer is on iPhone', 'Customer is on the consent details or account selection screen'],
        when: ['Customer taps the Cancel button'],
        then: ['Consent is updated to Rejected with StatusReason CustomerCancelled', 'Customer is redirected back to the TPP app', 'TPP callback receives rejected status']
      },
      {
        id: 'AC-02',
        title: 'Cancel via X button — iPhone',
        given: ['Customer is on iPhone', 'Customer is on any consent screen'],
        when: ['Customer taps the X (close) button'],
        then: ['Same behaviour as Cancel button', 'Consent is rejected', 'Customer returns to TPP']
      },
      {
        id: 'AC-03',
        title: 'Cancel via Cancel button — Android',
        given: ['Customer is on Android', 'Customer is on the consent screen'],
        when: ['Customer taps the Cancel button'],
        then: ['Consent is rejected with CustomerCancelled', 'Customer is redirected to TPP', 'Android back gesture is treated equivalently']
      },
      {
        id: 'AC-04',
        title: 'Cancel via X button — Android',
        given: ['Customer is on Android', 'Customer taps X or uses Android back button'],
        when: ['Customer navigates away from consent screen'],
        then: ['Consent is rejected', 'Customer is returned to TPP app']
      }
    ]
  },

  {
    id: 'DOF-2258',
    title: 'No Eligible Accounts',
    prereq: 'Customer is authenticated but has no eligible CASA accounts',
    acs: [
      {
        id: 'AC-01',
        title: 'No eligible accounts — iPhone',
        given: ['Customer is on iPhone', 'Customer is authenticated', 'Customer has no eligible CASA accounts in AED'],
        when: ['ADCB performs account eligibility check'],
        then: ['"No Accounts Available for Payment" screen is displayed', 'Consent is rejected', 'Customer can return to TPP app']
      },
      {
        id: 'AC-02',
        title: 'No eligible accounts — Android',
        given: ['Customer is on Android', 'Customer is authenticated', 'No eligible CASA accounts exist'],
        when: ['ADCB performs account eligibility check'],
        then: ['"No Accounts Available for Payment" screen is displayed', 'Consent is rejected', 'Customer can return to TPP app']
      }
    ]
  },

  {
    id: 'DOF-2426',
    title: 'Timeout and Error Handling',
    prereq: 'Customer is in the consent or authorisation flow',
    acs: [
      {
        id: 'AC-01',
        title: 'Technical error — iPhone',
        given: ['Customer is on iPhone', 'A system or API error occurs during the payment flow'],
        when: ['ADCB systems return a 500 or unexpected error'],
        then: ['Technical Error screen is displayed', 'Error code is shown (ADCB-OF-5001)', '"Try Again" and "Return to App" options are available']
      },
      {
        id: 'AC-02',
        title: 'Technical error — Android',
        given: ['Customer is on Android', 'A system error occurs'],
        when: ['ADCB systems return a 500 or unexpected error'],
        then: ['Technical Error screen is displayed with error code', 'Customer can retry or return to TPP']
      },
      {
        id: 'AC-03',
        title: 'Session timeout (10 min) — iPhone',
        given: ['Customer is on iPhone', 'Customer has been inactive for more than 10 minutes in the auth window'],
        when: ['10-minute authorisation window expires'],
        then: ['"Authorisation Expired" screen is displayed', 'Consent is rejected with StatusReason AuthWindowExpired', 'Customer is directed to return to TPP and start again']
      },
      {
        id: 'AC-04',
        title: 'Session timeout — Android',
        given: ['Customer is on Android', 'Auth window has expired'],
        when: ['Timeout occurs'],
        then: ['"Authorisation Expired" screen is displayed', 'Consent is rejected', 'Customer is directed to return to TPP']
      }
    ]
  },

  {
    id: 'DOF-1965',
    title: 'Payment Execution',
    prereq: 'Consent is Authorised, TPP has received auth code',
    acs: [
      {
        id: 'AC-01',
        title: 'TPP initiates payment execution',
        given: [
          'TPP has exchanged auth code for access token',
          'Consent status is Authorised',
          'TPP calls POST /domestic-payments with valid ConsentId'
        ],
        when: ['TPP sends the POST /domestic-payments request'],
        then: [
          'ADCB validates ConsentId, amount, and debtor account',
          'Payment is submitted to IPS / UAEFTS rail',
          'Response includes DomesticPaymentId and Status: AcceptedSettlementInProcess',
          'Payment execution follows the same retail delivery as standard SIP'
        ]
      }
    ]
  },
  {
    id: 'DOF-2828',
    title: 'SME SIP Frontend — Align UI to Standards v2.1',
    prereq: 'Customer authenticated and passed eligibility. v2.1 standards active.',
    acs: [
      {
        id: 'AC-01',
        title: 'Account selected at TPP — consent screen layout',
        given: [
          'TPP has pre-selected the debtor account in consent initiation',
          'Standards v2.1-final is active'
        ],
        when: ['Customer is shown the consent screen'],
        then: [
          'Heading: "Confirm Payment Details"',
          'Subtitle: "[TPP name] needs your permission to make the payment below."',
          'Payment fields: Amount, Payee Name, Account Number, Date, Reference, Payment Purpose',
          'Section: "Account selected for the payment at [TPP name]"',
          'Pre-selected account shown with ADCB red play icon',
          'Buttons: "Pay using AlTareq" + "Cancel"'
        ]
      },
      {
        id: 'AC-02',
        title: 'Account selected at Bank — consent screen layout',
        given: [
          'No account pre-selected by TPP',
          'Customer has more than 1 eligible account'
        ],
        when: ['Customer is shown the consent screen'],
        then: [
          'Heading: "Confirm Payment Details"',
          'Subtitle: "[TPP name] needs your permission..."',
          'Payment fields including Payment Purpose',
          'Section: "Please select the account to pay from"',
          'All eligible accounts shown as radio button list with balances',
          'Buttons: "Pay using AlTareq" + "Cancel"'
        ]
      },
      {
        id: 'AC-03',
        title: 'Only 1 account available — consent screen layout',
        given: [
          'Customer has exactly 1 eligible CASA account'
        ],
        when: ['Customer is shown the consent screen'],
        then: [
          'Heading: "Confirm Payment Details"',
          'Section: "Account to pay from" (no radio button, auto-shown)',
          'Account shown with ADCB red play icon + balance',
          'Payment Purpose displayed',
          'Buttons: "Pay using AlTareq" + "Cancel"'
        ]
      },
      {
        id: 'AC-04',
        title: 'Redirection screen — TPP branding',
        given: [
          'Customer has confirmed consent and passed EFR/PIN'
        ],
        when: ['Redirect to TPP is triggered'],
        then: [
          'Background: AlTareq teal to dark blue gradient',
          'TPP app icon (logo from TPP registration) is displayed',
          'TPP name shown prominently (e.g. "Noon Ltd")',
          'Text: "You\'ll be redirected back to [TPP name], don\'t close the window."',
          'Spinner animation',
          '"Powered by AlTareq" at bottom'
        ]
      }
    ]
  }
];

/* ============================================================
   5. SME_SIP_ARCH
   Architecture overview: systems, sequence, security, components
   ============================================================ */

var SME_SIP_ARCH = {

  systems: [
    {
      name: 'TPP App',
      subtitle: 'Merchant / Initiating Party',
      details: [
        'Initiates payment consent via PAR',
        'Sends deep link to ProCash',
        'Exchanges auth code for token',
        'Calls POST /domestic-payments'
      ],
      cssClass: 'sme-arch-tpp'
    },
    {
      name: 'Nebras Platform',
      subtitle: 'OF Hub — CBUAE',
      details: [
        'Routes consent requests',
        'Validates TPP credentials (mTLS)',
        'Orchestrates FAPI 2.0 flow',
        'Provides CoP query routing'
      ],
      cssClass: 'sme-arch-nebras'
    },
    {
      name: 'ADCB OF Layer',
      subtitle: 'LFI Open Finance Gateway',
      details: [
        'Processes consent creation',
        'Performs eligibility checks',
        'Returns account list',
        'Authorises and executes payment'
      ],
      cssClass: 'sme-arch-adcb'
    },
    {
      name: 'ProCash Mobile',
      subtitle: 'ADCB Customer App',
      details: [
        'Handles deep link redirect',
        'Authenticates customer (EFR/PIN)',
        'Displays AlTareq consent UI',
        'Submits PIN authorisation'
      ],
      cssClass: 'sme-arch-procash'
    }
  ],

  sequence: [
    { phase: 1, from: 'TPP',    to: 'Nebras',  action: 'POST /as/par — Pushed Authorisation Request',         protocol: 'mTLS + JAR' },
    { phase: 2, from: 'Nebras', to: 'ADCB',    action: 'Route PAR to LFI — consent pre-registration',          protocol: 'mTLS' },
    { phase: 3, from: 'TPP',    to: 'ProCash', action: 'Deep link redirect with request_uri',                   protocol: 'Universal Link / App Link' },
    { phase: 4, from: 'ProCash',to: 'ADCB',    action: 'Customer login + eligibility check',                    protocol: 'Internal (ProCash API)' },
    { phase: 5, from: 'ADCB',   to: 'ProCash', action: 'Return eligible accounts + consent details',            protocol: 'GET /accounts, GET /payment-consents/{id}' },
    { phase: 6, from: 'ProCash',to: 'ADCB',    action: 'PATCH /payment-consents — account selected + PIN auth', protocol: 'FAPI 2.0 + SCA' },
    { phase: 7, from: 'ADCB',   to: 'Nebras',  action: 'Auth code issued — consent Authorised',                 protocol: 'OAuth 2.0 auth code' },
    { phase: 8, from: 'TPP',    to: 'Nebras',  action: 'Token exchange — POST /as/token',                       protocol: 'PKCE + mTLS' },
    { phase: 9, from: 'TPP',    to: 'ADCB',    action: 'POST /domestic-payments — payment execution',           protocol: 'Bearer token + mTLS' }
  ],

  security: [
    { tag: 'FAPI 2.0',  desc: 'Financial-grade API profile — all endpoints must comply with FAPI 2.0 security baseline.' },
    { tag: 'mTLS',      desc: 'Mutual TLS on all connections between TPP, Nebras hub, and ADCB OF layer.' },
    { tag: 'JAR',       desc: 'JWT-Secured Authorisation Requests — all PAR payloads must be signed JWTs.' },
    { tag: 'PKCE',      desc: 'Proof Key for Code Exchange — mandatory for all authorisation code flows.' },
    { tag: 'SCA',       desc: 'Strong Customer Authentication — EFR/PIN entry satisfies SCA requirement for payment authorisation.' }
  ],

  components: [
    { name: 'AlTareq',    desc: 'CBUAE-branded consent journey UI embedded within ProCash. Provides the stepper (Consent → Authorize → Complete) and payment details layout.' },
    { name: 'Nebras',     desc: 'The OF Hub operated by CBUAE. Routes consent requests, validates TPP registration, and enforces compliance rules including CoP.' },
    { name: 'ProCash',    desc: 'ADCB\'s mobile banking app for SME customers. Handles authentication (EFR/PIN/Face ID) and renders the AlTareq consent screens.' },
    { name: 'CASA',       desc: 'Current Account and Savings Account held at ADCB. Only eligible CASA accounts in AED are returned for SME SIP payments.' },
    { name: 'IPS/UAEFTS', desc: 'UAE Instant Payment System and UAE Funds Transfer System — the underlying payment rails that execute the SIP once authorised.' }
  ],

  glossary: [
    { term: 'PAR', full: 'Pushed Authorisation Request', plain: 'Before the TPP can redirect you to your bank, it sends a sealed request to the hub saying "I want to start a payment." The hub checks it\'s genuine and gives back a one-time ticket (request_uri). Think of it as getting a visitor pass before entering the building.' },
    { term: 'mTLS', full: 'Mutual TLS (Transport Layer Security)', plain: 'Normal HTTPS means the website proves its identity to you. mTLS goes both ways — the TPP also has to prove its identity to the bank. Both sides show their certificates. Like two people at a door both showing their ID badges before either one can enter.' },
    { term: 'FAPI 2.0', full: 'Financial-grade API Security Profile', plain: 'A set of security rules specifically designed for banking. It says: "normal web security isn\'t good enough for moving money — use these extra-strict rules." Every API call in Open Finance must follow FAPI 2.0.' },
    { term: 'PKCE', full: 'Proof Key for Code Exchange', plain: 'When the TPP sends you to the bank, it creates a secret code and sends a scrambled version. When the bank sends you back, the TPP proves it\'s the same app by showing the original secret. This prevents someone from hijacking the redirect and stealing the authorisation.' },
    { term: 'SCA', full: 'Strong Customer Authentication', plain: 'You must prove you\'re really you using at least two different methods — e.g. something you know (PIN) and something you have (your phone). Just a password isn\'t enough. This is why you enter a PIN or use Face ID during the payment flow.' },
    { term: 'JAR', full: 'JWT-Secured Authorisation Request', plain: 'Instead of sending payment details as plain text, the TPP wraps them in a digitally signed envelope (a JWT). The bank can verify the envelope wasn\'t tampered with in transit. Like a wax-sealed letter — you can tell if someone opened it.' },
    { term: 'CoP', full: 'Confirmation of Payee', plain: 'Before you send money, the system checks: "does the name you typed match the actual name on that bank account?" This catches typos and prevents you from accidentally paying the wrong person or getting scammed.' },
    { term: 'OAuth 2.0', full: 'Open Authorization 2.0', plain: 'The standard way to let one app (the TPP) access your data at another app (your bank) without giving it your password. You log in directly at your bank, approve the request, and the bank gives the TPP a time-limited token instead.' },
    { term: 'EFR', full: 'Electronic Fund Release', plain: 'The final step where ADCB releases the money. In practice, this is your PIN entry or biometric confirmation in ProCash. Once you pass EFR, the payment is authorised and sent to the payment rail.' },
    { term: 'Deep Link', full: 'App-to-App Direct Navigation', plain: 'A special URL that opens a specific screen inside a mobile app instead of a website. When the TPP redirects you, the deep link goes straight to ProCash\'s consent screen — no browser, no extra steps.' },
    { term: 'IBAN', full: 'International Bank Account Number', plain: 'A standardised format for identifying bank accounts across borders. In the UAE it starts with "AE" followed by 21 digits. Every CASA account at ADCB has one. v2.1 requires IBAN format for all domestic creditor accounts.' },
    { term: 'CASA', full: 'Current Account / Savings Account', plain: 'The standard bank accounts you use day-to-day. For SME SIP, only AED CASA accounts are eligible — no foreign currency accounts, no fixed deposits, no investment accounts.' }
  ]
};

/* ============================================================
   6. SME_SIP_APIS
   API reference: request/response HTML for each endpoint
   ============================================================ */

var SME_SIP_APIS = [

  {
    id: 'get-consent',
    method: 'GET',
    path: '/payment-consents/{ConsentId}',
    desc: 'Retrieve the current state and details of a payment consent. Called by ProCash to display the consent details screen. <span style="background:#E8F5F0;color:#1A6B4A;padding:2px 6px;border-radius:3px;font-size:11px;font-weight:700;">v2.1:</span> paymentPurpose now shown in ProCash consent UI if provided by TPP.',
    requestHtml:
      '<pre class="sme-code-block"><span class="sme-ck">// Required Headers\n</span><span class="sme-cv">Authorization: </span><span class="sme-cs">Bearer {access_token}\n</span><span class="sme-cv">x-fapi-auth-date: </span><span class="sme-cs">Thu, 16 Apr 2026 10:00:00 GMT\n</span><span class="sme-cv">x-fapi-customer-ip-address: </span><span class="sme-cs">192.168.1.1\n</span><span class="sme-cv">x-fapi-interaction-id: </span><span class="sme-cs">550e8400-e29b</span></pre>',
    responseHtml:
      '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "ConsentId": </span><span class="sme-cs">"pcon-0001"</span><span class="sme-cv">,\n    "Status": </span><span class="sme-cs">"AwaitingAuthorisation"</span><span class="sme-cv">,\n    "CreationDateTime": </span><span class="sme-cs">"2026-04-16T10:00:00Z"</span><span class="sme-cv">,\n    "StatusUpdateDateTime": </span><span class="sme-cs">"2026-04-16T10:00:00Z"</span><span class="sme-cv">,\n    "Initiation": {\n      "InstructedAmount": { "Amount": </span><span class="sme-cs">"100.00"</span><span class="sme-cv">, "Currency": </span><span class="sme-cs">"AED"</span><span class="sme-cv"> },\n      "CreditorAccount": {\n        "SchemeName": </span><span class="sme-cs">"IBAN"</span><span class="sme-cv">,\n        "Identification": </span><span class="sme-cs">"AE210610012345678901234"</span><span class="sme-cv">,\n        "Name": </span><span class="sme-cs">"Noon"</span>\n<span class="sme-cv">      },\n      "EndToEndIdentification": </span><span class="sme-cs">"ORD-20260416-001"</span>\n<span class="sme-cv">    }\n  },\n  "Links": { "Self": </span><span class="sme-cs">"https://api.adcb.ae/open-banking/v3.1/payment-consents/pcon-0001"</span><span class="sme-cv"> },\n  "Meta": { "TotalPages": </span><span class="sme-cn">1</span><span class="sme-cv"> }\n}</span></pre>'
  },

  {
    id: 'get-accounts',
    method: 'GET',
    path: '/accounts',
    desc: 'Returns all eligible CASA accounts for the authenticated customer. Used to populate account selection on the consent screen.',
    requestHtml:
      '<pre class="sme-code-block"><span class="sme-ck">// Customer bearer token required (user context)\n</span><span class="sme-cv">Authorization: </span><span class="sme-cs">Bearer {customer_access_token}\n</span><span class="sme-cv">x-fapi-interaction-id: </span><span class="sme-cs">550e8400-e29b</span></pre>',
    responseHtml:
      '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "Account": [\n      {\n        "AccountId": </span><span class="sme-cs">"acc-4521"</span><span class="sme-cv">,\n        "Status": </span><span class="sme-cs">"Enabled"</span><span class="sme-cv">,\n        "Currency": </span><span class="sme-cs">"AED"</span><span class="sme-cv">,\n        "AccountType": </span><span class="sme-cs">"Business"</span><span class="sme-cv">,\n        "AccountSubType": </span><span class="sme-cs">"CurrentAccount"</span><span class="sme-cv">,\n        "Nickname": </span><span class="sme-cs">"ADCB Current"</span><span class="sme-cv">,\n        "Account": [{\n          "SchemeName": </span><span class="sme-cs">"IBAN"</span><span class="sme-cv">,\n          "Identification": </span><span class="sme-cs">"AE210610000000004521"</span><span class="sme-cv">,\n          "Name": </span><span class="sme-cs">"MERTTEST LLC"</span>\n<span class="sme-cv">        }]\n      }\n    ]\n  }\n}</span></pre>'
  },

  {
    id: 'patch-consent',
    method: 'PATCH',
    path: '/payment-consents/{ConsentId}',
    desc: 'Updates consent status. Three scenarios: AccountSelected (customer chose debit account), Authorised (PIN entered successfully), Rejected (cancelled, not eligible, or error).',
    requestHtml:
      '<pre class="sme-code-block"><span class="sme-ck">// Scenario A: Account Selected\n</span><span class="sme-cv">{\n  "Data": {\n    "Status": </span><span class="sme-cs">"AccountSelected"</span><span class="sme-cv">,\n    "DebtorAccount": {\n      "SchemeName": </span><span class="sme-cs">"IBAN"</span><span class="sme-cv">,\n      "Identification": </span><span class="sme-cs">"AE210610000000004521"</span>\n<span class="sme-cv">    }\n  }\n}\n\n</span><span class="sme-ck">// Scenario B: Authorised (PIN OK)\n</span><span class="sme-cv">{\n  "Data": {\n    "Status": </span><span class="sme-cs">"Authorised"</span><span class="sme-cv">,\n    "AuthorisationCode": </span><span class="sme-cs">"eyJhbGci..."</span>\n<span class="sme-cv">  }\n}\n\n</span><span class="sme-ck">// Scenario C: Rejected\n</span><span class="sme-cv">{\n  "Data": {\n    "Status": </span><span class="sme-cs">"Rejected"</span><span class="sme-cv">,\n    "StatusReason": </span><span class="sme-cs">"CustomerCancelled | NotSuperUser | AuthWindowExpired | SystemError"</span>\n<span class="sme-cv">  }\n}</span></pre>',
    responseHtml:
      '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "ConsentId": </span><span class="sme-cs">"pcon-0001"</span><span class="sme-cv">,\n    "Status": </span><span class="sme-cs">"Authorised"</span><span class="sme-cv">,\n    "StatusUpdateDateTime": </span><span class="sme-cs">"2026-04-16T10:08:32Z"</span>\n<span class="sme-cv">  }\n}</span></pre>',
    errorsHtml:
      '<pre class="sme-code-block"><span class="sme-cn">400 </span><span class="sme-cv">— Invalid status transition\n</span><span class="sme-cn">403 </span><span class="sme-cv">— Consent does not belong to this customer\n</span><span class="sme-cn">409 </span><span class="sme-cv">— Consent already in terminal state</span></pre>'
  },

  {
    id: 'post-payment',
    method: 'POST',
    path: '/domestic-payments',
    desc: 'Creates a domestic instant payment. Called by the TPP after receiving the authorisation code and exchanging it for an access token.',
    requestHtml:
      '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "ConsentId": </span><span class="sme-cs">"pcon-0001"</span><span class="sme-cv">,\n    "Initiation": {\n      "InstructionIdentification": </span><span class="sme-cs">"ADCB-SIP-20260416-001"</span><span class="sme-cv">,\n      "EndToEndIdentification": </span><span class="sme-cs">"ORD-20260416-001"</span><span class="sme-cv">,\n      "LocalInstrument": </span><span class="sme-cs">"UAE.OBIE.SIP"</span><span class="sme-cv">,\n      "InstructedAmount": {\n        "Amount": </span><span class="sme-cs">"100.00"</span><span class="sme-cv">,\n        "Currency": </span><span class="sme-cs">"AED"</span>\n<span class="sme-cv">      },\n      "CreditorAccount": {\n        "SchemeName": </span><span class="sme-cs">"IBAN"</span><span class="sme-cv">,\n        "Identification": </span><span class="sme-cs">"AE210610012345678901234"</span><span class="sme-cv">,\n        "Name": </span><span class="sme-cs">"Noon"</span>\n<span class="sme-cv">      },\n      "DebtorAccount": {\n        "SchemeName": </span><span class="sme-cs">"IBAN"</span><span class="sme-cv">,\n        "Identification": </span><span class="sme-cs">"AE210610000000004521"</span>\n<span class="sme-cv">      }\n    }\n  },\n  "Risk": {\n    "PaymentContextCode": </span><span class="sme-cs">"EcommerceGoods"</span><span class="sme-cv">,\n    "MerchantCategoryCode": </span><span class="sme-cs">"5399"</span><span class="sme-cv">,\n    "MerchantCustomerIdentification": </span><span class="sme-cs">"NOON-CUST-12345"</span><span class="sme-cv">,\n    "DeliveryAddress": null\n  }\n}</span></pre>',
    responseHtml:
      '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "DomesticPaymentId": </span><span class="sme-cs">"dpmt-0001"</span><span class="sme-cv">,\n    "ConsentId": </span><span class="sme-cs">"pcon-0001"</span><span class="sme-cv">,\n    "Status": </span><span class="sme-cs">"AcceptedSettlementInProcess"</span><span class="sme-cv">,\n    "CreationDateTime": </span><span class="sme-cs">"2026-04-16T10:09:00Z"</span>\n<span class="sme-cv">  }\n}</span></pre>'
  },

  {
    id: 'get-payment',
    method: 'GET',
    path: '/domestic-payments/{DomesticPaymentId}',
    desc: 'Retrieves the status of a submitted domestic payment. TPP polls this endpoint to confirm settlement.',
    requestHtml:
      '<pre class="sme-code-block"><span class="sme-cv">Authorization: </span><span class="sme-cs">Bearer {access_token}\n</span><span class="sme-cv">x-fapi-interaction-id: </span><span class="sme-cs">550e8400-e29b</span></pre>',
    responseHtml:
      '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "DomesticPaymentId": </span><span class="sme-cs">"dpmt-0001"</span><span class="sme-cv">,\n    "Status": </span><span class="sme-cs">"AcceptedCreditSettlementCompleted"</span><span class="sme-cv">,\n    "StatusUpdateDateTime": </span><span class="sme-cs">"2026-04-16T10:09:05Z"</span>\n<span class="sme-cv">  }\n}</span></pre>'
  },

  {
    id: 'get-refund',
    method: 'GET',
    path: '/payment-consents/{ConsentId}/refund',
    desc: 'Returns the refund account details associated with a payment consent. Used if a reversal is needed.',
    requestHtml:
      '<pre class="sme-code-block"><span class="sme-cv">Authorization: </span><span class="sme-cs">Bearer {access_token}</span></pre>',
    responseHtml:
      '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "Refund": {\n      "Account": {\n        "SchemeName": </span><span class="sme-cs">"IBAN"</span><span class="sme-cv">,\n        "Identification": </span><span class="sme-cs">"AE210610000000004521"</span><span class="sme-cv">,\n        "Name": </span><span class="sme-cs">"MERTTEST LLC"</span>\n<span class="sme-cv">      }\n    }\n  }\n}</span></pre>'
  },

  {
    id: 'oauth2',
    method: 'OAUTH2',
    path: 'PAR + Token Exchange',
    desc: 'Two-step OAuth 2.0 authorisation flow: (1) TPP sends PAR to get request_uri; (2) TPP exchanges auth code for access token after customer authorises.',
    requestHtml:
      '<pre class="sme-code-block"><span class="sme-ck">// Step 1: POST /as/par\n</span><span class="sme-cv">{\n  "response_type": </span><span class="sme-cs">"code"</span><span class="sme-cv">,\n  "client_id": </span><span class="sme-cs">"tpp-client-id-001"</span><span class="sme-cv">,\n  "redirect_uri": </span><span class="sme-cs">"https://tpp.example/callback"</span><span class="sme-cv">,\n  "scope": </span><span class="sme-cs">"payments openid"</span><span class="sme-cv">,\n  "code_challenge": </span><span class="sme-cs">"s256-pkce-value"</span><span class="sme-cv">,\n  "code_challenge_method": </span><span class="sme-cs">"S256"</span><span class="sme-cv">,\n  "request": </span><span class="sme-cs">"&lt;signed-JAR-JWT&gt;"</span>\n<span class="sme-cv">}\n\n</span><span class="sme-ck">// Step 2: POST /as/token (after auth)\n</span><span class="sme-cv">grant_type=</span><span class="sme-cs">authorization_code</span><span class="sme-cv">\n&amp;code=</span><span class="sme-cs">eyJhbGci...</span><span class="sme-cv">\n&amp;redirect_uri=</span><span class="sme-cs">https://tpp.example/callback</span><span class="sme-cv">\n&amp;code_verifier=</span><span class="sme-cs">pkce-verifier-value</span></pre>',
    responseHtml:
      '<pre class="sme-code-block"><span class="sme-ck">// PAR Response\n</span><span class="sme-cv">{\n  "request_uri": </span><span class="sme-cs">"urn:adcb:bwc:1234abcd"</span><span class="sme-cv">,\n  "expires_in": </span><span class="sme-cn">90\n</span><span class="sme-cv">}\n\n</span><span class="sme-ck">// Token Response\n</span><span class="sme-cv">{\n  "access_token": </span><span class="sme-cs">"eyJhbGciOiJSUzI1..."</span><span class="sme-cv">,\n  "token_type": </span><span class="sme-cs">"Bearer"</span><span class="sme-cv">,\n  "expires_in": </span><span class="sme-cn">3600</span><span class="sme-cv">,\n  "scope": </span><span class="sme-cs">"payments openid"</span>\n<span class="sme-cv">}</span></pre>'
  },

  {
    id: 'cop-query',
    method: 'POST',
    path: '/customers/action/cop-query',
    desc: 'Confirmation of Payee query. Validates that the payee name matches the account registered against the IBAN. Mandatory for new beneficiaries.',
    requestHtml:
      '<pre class="sme-code-block"><span class="sme-cv">{\n  "Name": {\n    "fullName": </span><span class="sme-cs">"Noon Commerce LLC"</span>\n<span class="sme-cv">  },\n  "Account": {\n    "SchemeName": </span><span class="sme-cs">"IBAN"</span><span class="sme-cv">,\n    "Identification": </span><span class="sme-cs">"AE210610012345678901234"</span>\n<span class="sme-cv">  }\n}</span></pre>',
    responseHtml:
      '<pre class="sme-code-block"><span class="sme-cv">{\n  "Data": {\n    "MatchResult": </span><span class="sme-cs">"ExactMatch"</span><span class="sme-cv">,\n    "MatchedName": </span><span class="sme-cs">"Noon Commerce LLC"</span><span class="sme-cv">,\n    "AccountStatus": </span><span class="sme-cs">"Active"</span><span class="sme-cv">,\n    "FurtherActionRequired": </span><span class="sme-cn">false\n  </span><span class="sme-cv">}\n}</span></pre>',
    errorsHtml:
      '<pre class="sme-code-block"><span class="sme-ck">// Possible MatchResult values:\n</span><span class="sme-cs">"ExactMatch"</span><span class="sme-cv">   — name matches perfectly\n</span><span class="sme-cs">"PartialMatch"</span><span class="sme-cv"> — close but not exact (show warning)\n</span><span class="sme-cs">"NoMatch"</span><span class="sme-cv">     — does not match (show red warning)\n</span><span class="sme-cs">"Unavailable"</span><span class="sme-cv"> — LFI cannot verify at this time\n\n</span><span class="sme-ck">// Penalty: 250 AED if TPP skips CoP for new beneficiary</span></pre>'
  }
];

/* ============================================================
   7. SME_SIP_GAPS
   Gap analysis: critical, medium, compliance, missing stories
   ============================================================ */

var SME_SIP_GAPS = {

  resolved: [
    'G-10 (Payment Purpose now shown in UI) — resolved by DOF-2828',
    'G-13 (AlTareq CX mandates Payment Purpose on consent screen) — confirmed by v2.1 wireframes',
    'Screen title updated to "Confirm Payment Details" — resolved by DOF-2828',
    'TPP name and permission text now present on consent screen — resolved by DOF-2828'
  ],

  critical: [
    {
      id: 'G-01',
      story: 'DOF-1986 Identify Superuser',
      issue: 'No API or data contract defined for returning user role to the OF Layer',
      why: 'ADCB needs to confirm to Nebras/OF layer that the authenticated user is a Super User. Without a defined mechanism, the eligibility check cannot be proven to the TPP.',
      question: 'What API or token claim communicates Super User status from ProCash to the ADCB OF Layer?'
    },
    {
      id: 'G-02',
      story: 'DOF-2260 Confirm Payment',
      issue: 'Consent screen shown to user before account selection is confirmed — PATCH sequence unclear',
      why: 'The current flow shows payment details before the user selects an account. It is unclear whether the PATCH /payment-consents (AccountSelected) must complete before proceeding to PIN, or if it can be combined.',
      question: 'Is PATCH AccountSelected a separate call before PIN, or is it combined with the Authorised PATCH?'
    },
    {
      id: 'G-03',
      story: 'DOF-2426 Timeout/Error',
      issue: '10-minute authorisation window: is it enforced by ADCB or Nebras?',
      why: 'If Nebras enforces the window, the error handling must align with Nebras error codes. If ADCB enforces it independently, the rejection flow may differ.',
      question: 'Which system owns the 10-minute timeout: Nebras (consent expiry) or ADCB (session management)?'
    },
    {
      id: 'G-04',
      story: 'DOF-1965 Payment Execution',
      issue: 'SIP delivery instructions for SME not differentiated from retail SIP',
      why: 'The AC states "follows the same retail delivery" but SME accounts may have different IPS routing, daily limits, or velocity controls compared to retail customers.',
      question: 'Are there any SME-specific IPS/UAEFTS routing rules, limits, or velocity checks distinct from retail SIP?'
    },
    {
      id: 'G-04b',
      story: 'DOF-2828 v2.1 Alignment',
      issue: 'TPP name and app icon source not defined',
      why: 'v2.1 consent screen and redirect screen show the TPP\'s display name and app icon. No story defines where ProCash fetches these from.',
      question: 'Where does ProCash get the TPP display name and logo? Consent object, Nebras participant directory, or hardcoded? Needs to be confirmed before frontend development.'
    }
  ],

  medium: [
    {
      id: 'G-05',
      story: 'DOF-2233 TPP Redirect',
      issue: 'Universal Link / App Link configuration not specified in acceptance criteria',
      question: 'Which Universal Link domain is registered for ProCash? Is the ADCB deep link scheme documented in the ADCB developer portal?'
    },
    {
      id: 'G-06',
      story: 'DOF-1380 Consent Details',
      issue: 'Reference field conditionally shown — no AC for what happens when Reference is absent',
      question: 'Should the Reference row be hidden entirely when not provided, or shown as "N/A"?'
    },
    {
      id: 'G-07',
      story: 'DOF-1985 View All',
      issue: 'Pagination / account list size limit not defined for large account sets',
      question: 'Is there a maximum number of accounts returned by GET /accounts for SME customers? If > 50, is pagination required?'
    },
    {
      id: 'G-08',
      story: 'DOF-2259 Select Account',
      issue: 'Account balance display: is real-time balance required or is a cached value acceptable?',
      question: 'Should GET /accounts return live balances, or is a cached/near-real-time balance acceptable for display on the account selection screen?'
    },
    {
      id: 'G-09',
      story: 'DOF-2258 No Eligible Accounts',
      issue: 'No AC covers the case where the customer has CASA accounts but none in AED',
      question: 'If all CASA accounts are in foreign currency (e.g. USD), should the "No Accounts" screen cite the currency ineligibility reason?'
    },
    {
      id: 'G-09b',
      story: 'DOF-2828 v2.1 Alignment',
      issue: 'Payment Purpose display rule not defined — if TPP doesn\'t pass a value, should the field be hidden or show a placeholder?',
      question: 'Is Payment Purpose only shown when passed by TPP (same rule as Payment Reference)? What if it is blank?'
    },
    {
      id: 'G-10',
      story: 'DOF-2070 Cancel',
      issue: '<strong style="color:#15803D;">RESOLVED by DOF-2828.</strong> Android back button behaviour now covered — treated as Cancel (PATCH Rejected).',
      question: 'Resolved — confirmed by v2.1-final alignment.'
    }
  ],

  compliance: [
    {
      id: 'G-11',
      area: 'FAPI 2.0',
      observation: 'None of the ACs explicitly mention x-fapi-auth-date, x-fapi-customer-ip-address, or x-fapi-interaction-id headers being validated. These are mandatory under FAPI 2.0.',
      reference: 'CBUAE Open Finance Standards v2.0 — Section 7.3 FAPI Headers'
    },
    {
      id: 'G-12',
      area: 'SCA / EFR',
      observation: 'The PIN screen ACs do not specify the lockout policy after 3 failed attempts. CBUAE SCA requirements mandate a defined lockout duration.',
      reference: 'CBUAE Open Finance Standards v2.0 — SCA Requirements'
    },
    {
      id: 'G-13',
      area: 'CoP',
      observation: '<strong style="color:#15803D;">PARTIALLY RESOLVED by DOF-2828.</strong> Payment Purpose confirmed on consent screen. CoP PartialMatch display remains open — no AC covers whether the SME user sees the CoP warning in ProCash.',
      reference: 'CBUAE CoP Standards — TPP Obligations / v2.1-final'
    },
    {
      id: 'G-14',
      area: 'Data Retention',
      observation: 'No AC or story covers logging and audit trail requirements for the SME SIP authorisation event. CBUAE mandates 5-year retention of consent and payment audit logs.',
      reference: 'CBUAE Open Finance Standards v2.0 — Section 12 Audit & Logging'
    }
  ],

  missing: [
    {
      id: 'G-15',
      gap: 'Face ID / Biometric Authentication story missing',
      action: 'Create a new story covering Face ID authorisation as an alternative to PIN/EFR for SME SIP payments. Include iOS (Face ID) and Android (Fingerprint/Face) variants.'
    },
    {
      id: 'G-16',
      gap: 'Hard Token and SMS Token authentication paths have no dedicated ACs',
      action: 'DOF-1938 only has 4 ACs. Add ACs for Hard Token and SMS OTP authentication methods to ensure all auth paths are tested.'
    },
    {
      id: 'G-17',
      gap: 'TPP pre-selected account (DebtorAccount in consent) has no dedicated acceptance criteria',
      action: 'Create a story or AC covering the scenario where the TPP pre-specifies the DebtorAccount in the consent initiation (shown as "Connected Account" in UI).'
    },
    {
      id: 'G-18',
      gap: 'GET /domestic-payments/{id} polling / status check story missing',
      action: 'Create a story for how the TPP monitors payment status after POST /domestic-payments. Include polling interval, final status determination, and timeout behaviour.'
    },
    {
      id: 'G-19',
      gap: 'Non-SME customer accidentally lands on SME SIP flow — no story',
      action: 'Add a story for what happens when a retail (non-SME) ProCash customer is redirected via a TPP that sent an SME SIP consent. Is the error the same as "Access Restricted"?'
    },
    {
      id: 'G-20',
      gap: 'v2.1 Creditor field — domestic payments now IBAN only, existing test data may use plain account numbers',
      action: 'Verify all SIP test scenarios use IBAN format for CreditorAccount.Identification. Update test data that uses plain account number format.'
    },
    {
      id: 'G-21',
      gap: 'v2.1 file upload grant changed from Authorization Code to Client Credentials — check if SME SIP file upload tests exist',
      action: 'Update to Client Credentials grant per v2.1 if file upload scenarios are in scope for SME.'
    },
    {
      id: 'G-22',
      gap: 'DOF-2828 changes consent screens — may require CX re-certification with Nebras before go-live',
      action: 'Has CX re-certification been submitted to Nebras for the v2.1 screen changes? Nebras must validate before production.'
    }
  ]
};
