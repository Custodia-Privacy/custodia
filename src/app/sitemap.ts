import { MetadataRoute } from 'next'

const BASE_URL = 'https://app.custodia-privacy.com'

const blogSlugs = [
  'gdpr-compliance-small-business',
  'ai-privacy-policy-generator',
  'cookie-consent-management-tool',
  'ccpa-compliance-small-business',
  'google-consent-mode-v2',
  'dsar-guide-small-business',
  'us-state-privacy-laws-guide',
  'gdpr-for-saas-companies',
  'privacy-compliance-ecommerce',
  'website-privacy-audit-checklist',
  'onetrust-alternative-small-business',
  'cookiebot-alternative',
  'google-analytics-4-gdpr-compliance',
  'wordpress-gdpr-compliance',
  'shopify-gdpr-compliance',
  'gdpr-fines-list',
  'data-processing-agreement-gdpr',
  'gdpr-us-companies',
  'gdpr-data-breach-notification',
  'gdpr-legitimate-interest',
  'privacy-policy-generator',
  'gdpr-vs-ccpa',
  'gdpr-right-to-erasure',
  'email-marketing-gdpr-consent',
  'privacy-by-design-gdpr',
  'wix-gdpr-compliance',
  'squarespace-gdpr-compliance',
  'hubspot-gdpr-compliance',
  'facebook-pixel-gdpr',
  'hotjar-gdpr-compliance',
  'mailchimp-gdpr-compliance',
  'gdpr-for-startups',
  'gdpr-for-nonprofits',
  'cookie-policy-template',
  'gdpr-for-freelancers',
  'intercom-gdpr-compliance',
  'stripe-gdpr-compliance',
  'gdpr-consent-management',
  'pipeda-compliance-guide',
  'gdpr-data-retention-policy',
  'gdpr-third-party-vendors',
  'privacy-impact-assessment',
  'uk-gdpr-compliance',
  'gdpr-for-agencies',
  'gdpr-penalties-guide',
  'gdpr-records-of-processing-activities',
  'gdpr-data-portability',
  'gdpr-marketing-emails',
  'website-privacy-policy-guide',
  'gdpr-employee-data',
  'gdpr-b2b-saas',
  'gdpr-data-mapping',
  'gdpr-healthcare',
  'gdpr-international-data-transfers',
  'gdpr-mobile-apps',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/scan`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/features`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...staticPages, ...blogPages]
}
