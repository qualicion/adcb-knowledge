/* ============================================================
   ADCB Open Finance — LFI API Knowledge Base Data
   All 35 LFI endpoints, categories, and glossary.
   Source: UAE Open Finance Standards v2.1-final · API Hub v8
   ============================================================ */

var LFI_API_ENDPOINTS = [
  // Unconsented GETs
  { method:'GET',   endpoint:'/products',                                                     category:'Unconsented',           family:'Bank Product Data',      purpose:'Product catalogue (rates, features, eligibility)',                   mib:'no',    piiLabel:'None',     piiRank:0 },
  { method:'GET',   endpoint:'/open-data/products',                                           category:'Unconsented',           family:'Bank Open Data (v8+)',   purpose:'Public product discovery feed',                                     mib:'no',    piiLabel:'None',     piiRank:0 },
  { method:'GET',   endpoint:'/open-data/atm',                                                category:'Unconsented',           family:'Bank Open Data (v8+)',   purpose:'ATM and branch locations',                                          mib:'no',    piiLabel:'None',     piiRank:0 },
  { method:'GET',   endpoint:'/health',                                                       category:'Unconsented',           family:'Health Check',           purpose:'LFI availability monitoring (used by API Hub)',                     mib:'no',    piiLabel:'None',     piiRank:0 },
  // Bank Data Sharing GETs
  { method:'GET',   endpoint:'/accounts',                                                     category:'Bank Data Sharing',     family:'Account list',           purpose:'List all consented accounts',                                       mib:'yes',   piiLabel:'Med',      piiRank:1 },
  { method:'GET',   endpoint:'/accounts/{accountId}',                                         category:'Bank Data Sharing',     family:'Account detail',         purpose:'Single account detail',                                             mib:'yes',   piiLabel:'Med',      piiRank:1 },
  { method:'GET',   endpoint:'/accounts/{accountId}/balances',                                category:'Bank Data Sharing',     family:'Balances',               purpose:'Current and available balances',                                    mib:'yes',   piiLabel:'High',     piiRank:2 },
  { method:'GET',   endpoint:'/accounts/{accountId}/transactions',                            category:'Bank Data Sharing',     family:'Transactions',           purpose:'Transaction history (100/page, max 13 months)',                     mib:'yes',   piiLabel:'High',     piiRank:2 },
  { method:'GET',   endpoint:'/accounts/{accountId}/standing-orders',                         category:'Bank Data Sharing',     family:'Standing orders',        purpose:'Recurring payment instructions',                                    mib:'yes',   piiLabel:'High',     piiRank:2 },
  { method:'GET',   endpoint:'/accounts/{accountId}/direct-debits',                           category:'Bank Data Sharing',     family:'Direct debits',          purpose:'Direct debit mandates',                                             mib:'yes',   piiLabel:'High',     piiRank:2 },
  { method:'GET',   endpoint:'/accounts/{accountId}/beneficiaries',                           category:'Bank Data Sharing',     family:'Beneficiaries',          purpose:'Saved beneficiary list',                                            mib:'yes',   piiLabel:'High',     piiRank:2 },
  { method:'GET',   endpoint:'/accounts/{accountId}/scheduled-payments',                      category:'Bank Data Sharing',     family:'Scheduled payments',     purpose:'Future dated payments',                                             mib:'yes',   piiLabel:'High',     piiRank:2 },
  { method:'GET',   endpoint:'/customer',                                                     category:'Bank Data Sharing',     family:'Customer demographics',  purpose:'Party / customer personal data',                                    mib:'yes',   piiLabel:'Very High',piiRank:3 },
  { method:'GET',   endpoint:'/accounts/{accountId}/customer',                                category:'Bank Data Sharing',     family:'Customer per account',   purpose:'Customer linked to specific account',                               mib:'yes',   piiLabel:'Very High',piiRank:3 },
  { method:'GET',   endpoint:'/statements',                                                   category:'Bank Data Sharing',     family:'Statements',             purpose:'Statement list',                                                    mib:'yes',   piiLabel:'High',     piiRank:2 },
  { method:'GET',   endpoint:'/accounts/{accountId}/statements',                              category:'Bank Data Sharing',     family:'Statements',             purpose:'Statements for specific account',                                   mib:'yes',   piiLabel:'High',     piiRank:2 },
  { method:'GET',   endpoint:'/accounts/{accountId}/statements/{statementId}',                category:'Bank Data Sharing',     family:'Statements',             purpose:'Single statement detail',                                           mib:'yes',   piiLabel:'High',     piiRank:2 },
  { method:'GET',   endpoint:'/accounts/{accountId}/statements/{statementId}/transactions',   category:'Bank Data Sharing',     family:'Statements',             purpose:'Transactions within a statement',                                   mib:'yes',   piiLabel:'High',     piiRank:2 },
  // Service Status GETs
  { method:'GET',   endpoint:'/payments/{paymentId}',                                         category:'Service Status',        family:'Payment status',         purpose:'Payment status / detail (SLA: 500ms)',                              mib:'bound', piiLabel:'High',     piiRank:2 },
  { method:'GET',   endpoint:'/payment-consents/{consentId}/refund',                          category:'Service Status',        family:'Refund status',          purpose:'Refund account details (400 & 404 both accepted)',                  mib:'bound', piiLabel:'Med',      piiRank:1 },
  { method:'GET',   endpoint:'/fx-conversions/{conversionId}',                                category:'Service Status',        family:'FX status',              purpose:'FX quote / conversion status',                                      mib:'bound', piiLabel:'Med',      piiRank:1 },
  { method:'GET',   endpoint:'/account-opening-requests/{requestId}',                         category:'Service Status',        family:'Account opening',        purpose:'Dynamic Account Opening request status',                           mib:'bound', piiLabel:'High',     piiRank:2 },
  // Insurance Data Sharing
  { method:'GET',   endpoint:'/policies',                                                     category:'Insurance',             family:'Policies',               purpose:'Policy list (Motor, Health, Home, Travel, Life)',                   mib:'yes',   piiLabel:'High',     piiRank:2 },
  { method:'GET',   endpoint:'/policies/{policyId}',                                          category:'Insurance',             family:'Policies',               purpose:'Single policy detail',                                              mib:'yes',   piiLabel:'High',     piiRank:2 },
  { method:'GET',   endpoint:'/claims',                                                       category:'Insurance',             family:'Claims',                 purpose:'Claims list',                                                       mib:'yes',   piiLabel:'High',     piiRank:2 },
  { method:'GET',   endpoint:'/policies/{policyId}/claims',                                   category:'Insurance',             family:'Claims',                 purpose:'Claims for specific policy',                                        mib:'yes',   piiLabel:'High',     piiRank:2 },
  // POST / Mutating
  { method:'POST',  endpoint:'/payments',                                                     category:'POST / Mutating',       family:'Service Initiation',     purpose:'Single instant, scheduled, international, multi-payment, bulk',     mib:'yes',   piiLabel:'High',     piiRank:2 },
  { method:'POST',  endpoint:'/customers/action/cop-query',                                   category:'POST / Mutating',       family:'Pre-payment check',      purpose:'Confirmation of Payee — carries beneficiary PII',                   mib:'no',    piiLabel:'Med',      piiRank:1 },
  { method:'POST',  endpoint:'/fx-conversions',                                               category:'POST / Mutating',       family:'FX Initiation',          purpose:'FX quote / conversion initiation (SLA: 5s quote)',                  mib:'yes',   piiLabel:'Med',      piiRank:1 },
  { method:'POST',  endpoint:'/account-opening-requests',                                     category:'POST / Mutating',       family:'Account Opening',        purpose:'Dynamic Account Opening',                                           mib:'yes',   piiLabel:'High',     piiRank:2 },
  { method:'POST',  endpoint:'/leads',                                                        category:'POST / Mutating',       family:'Bank Product Data',      purpose:'Product lead / application submission',                             mib:'no',    piiLabel:'Optional', piiRank:1 },
  { method:'POST',  endpoint:'/users/register',                                               category:'POST / Mutating',       family:'User Ops / CAAP',        purpose:'CAAP user registration (identity challenge / OTP)',                 mib:'caap',  piiLabel:'High',     piiRank:2 },
  { method:'POST',  endpoint:'/users/deregister',                                             category:'POST / Mutating',       family:'User Ops / CAAP',        purpose:'CAAP user de-registration',                                         mib:'caap',  piiLabel:'Med',      piiRank:1 },
  { method:'POST',  endpoint:'/consent/event/{operation}',                                    category:'POST / Mutating',       family:'Consent Events',         purpose:'Consent event notification (LFI to API Hub)',                       mib:'infra', piiLabel:'None',     piiRank:0 },
  { method:'PATCH', endpoint:'/consent/event/{operation}',                                    category:'POST / Mutating',       family:'Consent Events',         purpose:'Consent event update (LFI to API Hub)',                             mib:'infra', piiLabel:'None',     piiRank:0 }
];

var LFI_API_CATEGORIES = [
  { key:'unconsented',  label:'Unconsented GETs',      color:'#1A6B4A', count:4,  filter:'Unconsented',       desc:'No customer authentication. No Consent Manager. No PII in the response. These power product comparison and ATM finder features.' },
  { key:'datasharing',  label:'Bank Data Sharing GETs', color:'#B8860B', count:14, filter:'Bank Data Sharing', desc:'Consented (AISP-style). CAAP authentication via AlTareq. PII in response. This is what the MIB consent flow is for.' },
  { key:'service',      label:'Service Status GETs',    color:'#2B4B8A', count:4,  filter:'Service Status',    desc:'Read-only lookups for resources created via POST. Consent already established at creation — no fresh MIB journey needed.' },
  { key:'insurance',    label:'Insurance Data Sharing', color:'#6A3A7A', count:4,  filter:'Insurance',         desc:'Insurance equivalent of Bank Data Sharing. Full consent journey via AlTareq. Only relevant if LFI has insurance products.' },
  { key:'post',         label:'POST / Mutating APIs',   color:'#5A5A5A', count:9,  filter:'POST / Mutating',   desc:'Service initiation, lead submission, user operations, consent events. Mixed consent profile — some trigger full MIB, others don\'t.' }
];

var LFI_API_GLOSSARY = [
  { term:'LFI',         full:'Licensed Financial Institution',                   plain:'A CBUAE-licensed entity (bank, insurer) that must expose Open Finance APIs. In this context: ADCB.' },
  { term:'TPP',         full:'Third Party Provider',                              plain:'The fintech app calling the LFI APIs on behalf of the customer. Minimum capital: AED 1,000,000.' },
  { term:'MIB',         full:'Mobile In-Browser',                                 plain:'The consent journey a customer goes through when a TPP requests access. PAR → AlTareq → CAAP auth → consent → token back to TPP.' },
  { term:'CAAP',        full:'Centralized Auth & Authorization Platform',         plain:'UAE-specific approach — customers authenticate via the AlTareq app (EFR + UAE Pass) rather than each bank\'s own consent screens.' },
  { term:'PAR / RAR',   full:'Pushed / Rich Authorization Request',               plain:'OAuth 2.0 mechanism to convey detailed consent scope. Max 2 RAR objects per PAR request.' },
  { term:'PII',         full:'Personally Identifiable Information',               plain:'Name, address, account numbers, transaction history, balances — anything that identifies a specific customer.' },
  { term:'CoP',         full:'Confirmation of Payee',                             plain:'Mandatory beneficiary-name verification before any payment. Returns Exact Match / Partial Match / No Match.' },
  { term:'Ozone Connect',full:'LFI API Surface',                                 plain:'The LFI-facing API surface each bank must build. Consumed by the central API Hub over mTLS.' },
  { term:'API Hub v8',  full:'Central Hub Specification',                         plain:'Current API Hub version, aligned with Standards v2.1-final (Jan 2026). Operated by Nebras under the AlTareq brand.' }
];
