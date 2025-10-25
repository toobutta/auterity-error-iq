

# Deployment & Subscription Management Guid

e

#

# Auterity Error-IQ Multi-Deployment Architectu

r

e

#

## How the System Detects Subscription Type

s

#

# 🔍 SUBSCRIPTION DETECTION ARCHITECTUR

E

#

## **

1. Environment-Based Detectio

n

* *

```typescript
// Environment Variable Detection
const detectDeploymentFromEnv = (): DeploymentType => {
  const envType = import.meta.env.VITE_DEPLOYMENT_TYPE as DeploymentType;

  if (envType && ['saas', 'white-label', 'self-hosted'].includes(envType)) {

    return envType;
  }

  // Fallback detection methods
  return detectDeploymentFromContext();
};

```

#

## **

2. License Key Validation

* *

```

typescript
// License Key Detection for White-label/Self-hosted

const validateLicenseKey = (key: string) => {
  const licenseKey = Array.from(licenseKeys.values())
    .find(lk => lk.key === key);

  if (!licenseKey) {
    return { isValid: false, error: 'License key not found' };
  }

  if (licenseKey.expiresAt && licenseKey.expiresAt < new Date()) {
    return { isValid: false, error: 'License key has expired' };
  }

  return {
    isValid: true,
    deploymentType: licenseKey.deploymentType,
    features: licenseKey.features,
    subscription: licenseKey.subscriptionId
  };
};

```

#

## **

3. Domain-Based Detectio

n

* *

```

typescript
// Domain Pattern Detection for White-label

const detectDeploymentFromDomain = (): DeploymentType => {
  const hostname = window.location.hostname;

  // SaaS domains
  if (hostname === 'app.auterity.com' ||
      hostname.includes('auterity-saas')) {

    return 'saas';
  }

  // White-label pattern (custom domains)

  if (hostname !== 'localhost' &&
      !hostname.includes('auterity.com')) {
    return 'white-label';

  }

  // Default to SaaS
  return 'saas';
};

```

#

## **

4. Subscription Context Provider

* *

```

typescript
// React Context for Subscription State
const SubscriptionContext = React.createContext<SubscriptionContextType | null>(null);

export const FeatureGateProvider: React.FC<FeatureGateProviderProps> = ({ children }) => {
  const [subscription, setSubscription] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        //

 1. Check environment variables

        const envType = import.meta.env.VITE_DEPLOYMENT_TYPE;

        //

 2. Check license key from localStorage/API

        const licenseKey = localStorage.getItem('license_key');
        if (licenseKey) {
          const validation = subscriptionService.validateLicenseKey(licenseKey);
          if (validation.isValid) {
            // Load subscription based on license
            const sub = await loadSubscriptionByLicense(licenseKey);
            setSubscription(sub);
            setPlan(subscriptionService.getCurrentPlan());
          }
        }

        //

 3. Check domain-based detectio

n

        const domainType = detectDeploymentFromDomain();

        //

 4. Load appropriate subscription plan

        const sub = subscriptionService.getCurrentSubscription();
        setSubscription(sub);
        setPlan(subscriptionService.getCurrentPlan());

      } catch (error) {
        console.error('Failed to load subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscription();
  }, []);

  // ... rest of context implementation
};

```

--

- #

# 🌐 DEPLOYMENT TYPE CONFIGURATION

S

#

## **SaaS Enterprise Deployment

* *

```

json
// .env configuration
{
  "VITE_DEPLOYMENT_TYPE": "saas",
  "VITE_API_BASE_URL": "https://api.auterity.com",
  "VITE_FEATURE_FLAGS": {
    "multiTenant": true,
    "enterpriseFeatures": true,
    "whiteLabel": false
  }
}

```

```

typescript
// SaaS-specific features

const saasFeatures = {
  multiTenant: true,
  sharedInfrastructure: true,
  centralizedUpdates: true,
  enterpriseSupport: true,
  complianceReporting: true,
  backupAndRecovery: true
};

```

#

## **White-label Deployment

* *

```

json
// Client-specific configuration

{
  "VITE_DEPLOYMENT_TYPE": "white-label",

  "VITE_CLIENT_NAME": "Acme Corp",
  "VITE_CLIENT_DOMAIN": "workflow.acme.com",
  "VITE_BRAND_COLORS": {
    "primary": "

#FF6B35",

    "secondary": "

#004E89"

  },
  "VITE_CUSTOM_FEATURES": {
    "apiIntegrations": ["salesforce", "sap"],
    "customModels": true,
    "whiteLabelSupport": true
  }
}

```

```

typescript
// White-label theme configuration

const whiteLabelTheme = {
  logo: '/white-label/logo.png',

  favicon: '/white-label/favicon.ico',

  colors: {
    primary: '

#FF6B35',

    secondary: '

#004E89',

    accent: '

#00B4D8'

  },
  fonts: {
    heading: 'CustomFont, sans-serif',

    body: 'CustomFont, sans-serif'

  },
  navigation: {
    hideAuterityBranding: true,
    customMenuItems: ['client-dashboard', 'client-reports']

  }
};

```

#

## **Self-hosted Deployment

* *

```

json
// Self-hosted configuration

{
  "VITE_DEPLOYMENT_TYPE": "self-hosted",

  "VITE_API_BASE_URL": "http://localhost:3001",
  "VITE_LICENSE_KEY": "XXXX-XXXX-XXXX-XXXX",

  "VITE_OFFLINE_MODE": true,
  "VITE_CUSTOM_CONFIG": {
    "gpuSupport": true,
    "localModels": true,
    "customIntegrations": true,
    "airGapped": false
  }
}

```

```

typescript
// Self-hosted feature flags

const selfHostedFeatures = {
  localDeployment: true,
  customIntegrations: true,
  localModels: true,
  offlineMode: true,
  customSecurity: true,
  fullControl: true
};

```

--

- #

# 🔑 LICENSE KEY MANAGEMEN

T

#

## **License Key Generation

* *

```

typescript
// Server-side license generation

const generateLicenseKey = (subscriptionData: SubscriptionData): string => {
  const payload = {
    subscriptionId: subscriptionData.id,
    deploymentType: subscriptionData.deploymentType,
    features: subscriptionData.features,
    expiresAt: subscriptionData.expiresAt,
    issuedAt: new Date(),
    version: '1.0'

  };

  // Encrypt payload
  const encrypted = encrypt(JSON.stringify(payload), process.env.LICENSE_SECRET);

  // Generate human-readable key

  const segments = [];
  for (let i = 0; i < 4; i++) {

    let segment = '';
    for (let j = 0; j < 5; j++) {

      segment += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(

        Math.floor(Math.random()

 * 36)

      );
    }
    segments.push(segment);
  }

  return segments.join('-');

};

```

#

## **License Validation Flow

* *

```

typescript
// Client-side license validation

const validateLicenseFlow = async (licenseKey: string) => {
  try {
    //

 1. Check local cache first

    const cached = localStorage.getItem(`license_${licenseKey}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.expiresAt > Date.now()) {
        return parsed;
      }
    }

    //

 2. Validate with server

    const response = await fetch('/api/license/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({ licenseKey })
    });

    const validation = await response.json();

    if (validation.isValid) {
      // Cache valid license
      localStorage.setItem(`license_${licenseKey}`, JSON.stringify(validation));
      return validation;
    }

    throw new Error(validation.error || 'Invalid license');

  } catch (error) {
    console.error('License validation failed:', error);
    throw error;
  }
};

```

--

- #

# 🎯 FEATURE GATING IMPLEMENTATIO

N

#

## **Component-Level Feature Gating

* *

```

tsx
// Feature Gate Component Usage
const MyComponent = () => {
  return (
    <div>
      {/

* Always available feature */}

      <BasicWorkflowBuilder />

      {/

* Professiona

l

+ feature */}

      <FeatureGate
        feature="temporalWorkflows"
        fallback={
          <UpgradePrompt
            title="Advanced Orchestration"
            description="Unlock Temporal workflow orchestration"
            requiredPlan="professional"
          />
        }
      >
        <TemporalWorkflowManager />
      </FeatureGate>

      {/

* Enterprise-only feature */}

      <FeatureGate
        feature="novitaAI"
        showUpgradePrompt={true}
        upgradeMessage="Access 200

+ AI models with Novita AI"

      >
        <NovitaAIModelBrowser />
      </FeatureGate>
    </div>
  );
};

```

#

## **API-Level Feature Gating

* *

```

typescript
// Backend API feature gating
const featureGatedAPI = (requiredFeature: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const subscription = getSubscriptionFromRequest(req);
    const plan = subscriptionService.getCurrentPlan();

    if (!plan.features[requiredFeature] ||
        plan.features[requiredFeature] === 'disabled') {
      return res.status(403).json({
        error: 'Feature not available in current plan',
        requiredFeature,
        currentPlan: plan.name,
        upgradeUrl: '/billing/upgrade'
      });
    }

    next();
  };
};

// Usage in routes
app.get('/api/enterprise/models',
  featureGatedAPI('novitaAI'),
  getEnterpriseModels
);

app.post('/api/workflows/temporal',
  featureGatedAPI('temporalWorkflows'),
  createTemporalWorkflow
);

```

#

## **Database-Level Feature Gating

* *

```

sql
- - Feature-flagged database queries

SELECT

 * FROM ai_models

WHERE deployment_type = $1
  AND ($2 = 'enterprise' OR is_enterprise_only = false)
  AND ($2 = 'professional' OR NOT requires_professional)
ORDER BY name;

- - Usage-based limits

SELECT COUNT(*) as usage_count

FROM api_requests
WHERE subscription_id = $1
  AND created_at >= CURRENT_DATE

 - INTERVAL '30 days'

HAVING COUNT(*) < (SELECT api_limit FROM subscriptions WHERE id = $1)

;

```

--

- #

# 🔄 SUBSCRIPTION MANAGEMENT WORKFLOW

S

#

## **Plan Upgrade Flow

* *

```

typescript
// Client-side upgrade flow

const handlePlanUpgrade = async (targetPlanId: string) => {
  try {
    //

 1. Validate upgrade eligibility

    const currentPlan = subscriptionService.getCurrentPlan();
    const canUpgrade = validateUpgradePath(currentPlan.id, targetPlanId);

    if (!canUpgrade) {
      throw new Error('Invalid upgrade path');
    }

    //

 2. Calculate prorated amount

    const proration = calculateProration(currentPlan, targetPlanId);

    //

 3. Process payment (if required)

    const paymentIntent = await createPaymentIntent({
      amount: proration.amount,
      planId: targetPlanId
    });

    //

 4. Confirm upgrade

    const upgradeResult = await subscriptionService.upgradeSubscription(targetPlanId);

    if (upgradeResult) {
      //

 5. Update local state

      await refreshSubscription();

      //

 6. Show success message

      showNotification({
        type: 'success',
        title: 'Upgrade Successful',
        message: `Successfully upgraded to ${targetPlanId}`
      });

      //

 7. Redirect to new features

      navigate('/welcome/upgrade');
    }

  } catch (error) {
    showNotification({
      type: 'error',
      title: 'Upgrade Failed',
      message: error.message
    });
  }
};

```

#

## **License Key Activation Flow

* *

```

typescript
// White-label license activation

const activateLicense = async (licenseKey: string) => {
  try {
    //

 1. Validate license key format

    if (!isValidLicenseFormat(licenseKey)) {
      throw new Error('Invalid license key format');
    }

    //

 2. Contact license server

    const validation = await validateLicenseKey(licenseKey);

    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    //

 3. Store license locally

    localStorage.setItem('license_key', licenseKey);
    localStorage.setItem('license_data', JSON.stringify(validation));

    //

 4. Update subscription

    await subscriptionService.loadSubscriptionByLicense(validation);

    //

 5. Apply white-label themin

g

    if (validation.deploymentType === 'white-label') {

      await applyWhiteLabelTheme(validation.branding);
    }

    //

 6. Refresh application

    window.location.reload();

  } catch (error) {
    console.error('License activation failed:', error);
    throw error;
  }
};

```

--

- #

# 📊 USAGE TRACKING & BILLIN

G

#

## **Usage-Based Billing

* *

```

typescript
// Real-time usage tracking

const trackUsage = (event: UsageEvent) => {
  const subscription = subscriptionService.getCurrentSubscription();

  // Track different usage types
  switch (event.type) {
    case 'api_call':
      incrementUsage(subscription.id, 'apiCalls', 1);
      break;

    case 'model_inference':
      incrementUsage(subscription.id, 'modelInferences', 1);
      trackCost(subscription.id, event.modelCost);
      break;

    case 'workflow_execution':
      incrementUsage(subscription.id, 'workflowRuns', 1);
      break;

    case 'storage':
      incrementUsage(subscription.id, 'storageBytes', event.bytes);
      break;
  }

  // Check limits and send alerts
  checkUsageLimits(subscription.id);
};

// Background usage sync
setInterval(() => {
  syncUsageToServer();
}, 60000); // Every minute

```

#

## **Billing Integration

* *

```

typescript
// Stripe integration for SaaS billing
const createSubscription = async (planId: string, paymentMethod: string) => {
  const plan = subscriptionService.getPlan(planId);

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{
      price_data: {
        currency: plan.pricing.currency,
        product_data: {
          name: plan.name,
          description: plan.description
        },
        unit_amount: plan.pricing.monthly

 * 100, // Convert to cents

        recurring: {
          interval: 'month'
        }
      }
    }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent']
  });

  return subscription;
};

```

--

- #

# 🚨 MONITORING & ALERT

S

#

## **Subscription Health Monitoring

* *

```

typescript
// Proactive subscription monitoring
const monitorSubscriptionHealth = () => {
  const subscription = subscriptionService.getCurrentSubscription();
  const health = subscriptionService.getSubscriptionHealth();

  // Check for issues
  if (health.status === 'warning' || health.status === 'critical') {
    // Send alerts
    sendAlert({
      type: 'subscription_health',
      severity: health.status,
      message: `Subscription health: ${health.status}`,
      issues: health.issues,
      recommendations: health.recommendations
    });
  }

  // Check usage limits
  const usageLimits = subscriptionService.checkUsageLimits();
  if (!usageLimits.withinLimits) {
    sendAlert({
      type: 'usage_limit',
      severity: 'warning',
      message: 'Usage limits exceeded',
      violations: usageLimits.violations
    });
  }

  // Check renewal dates
  if (health.nextRenewal) {
    const daysUntilRenewal = Math.ceil(
      (health.nextRenewal.getTime()

 - Date.now()) / (100

0

 * 6

0

 * 6

0

 * 24)

    );

    if (daysUntilRenewal <= 30) {
      sendAlert({
        type: 'renewal_reminder',
        severity: daysUntilRenewal <= 7 ? 'critical' : 'warning',
        message: `Subscription renews in ${daysUntilRenewal} days`
      });
    }
  }
};

// Run health checks every 6 hours
setInterval(monitorSubscriptionHealth, 6

 * 6

0

 * 6

0

 * 1000)

;

```

--

- #

# 🔐 SECURITY CONSIDERATION

S

#

## **License Key Security

* *

```

typescript
// Secure license key storage
const secureLicenseStorage = {
  store: (key: string, data: any) => {
    // Encrypt before storing
    const encrypted = encrypt(JSON.stringify(data), getEncryptionKey());
    localStorage.setItem(`license_${hash(key)}`, encrypted);
  },

  retrieve: (key: string) => {
    const encrypted = localStorage.getItem(`license_${hash(key)}`);
    if (!encrypted) return null;

    try {
      const decrypted = decrypt(encrypted, getEncryptionKey());
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  },

  clear: (key: string) => {
    localStorage.removeItem(`license_${hash(key)}`);
  }
};

```

#

## **Feature Access Control

* *

```

typescript
// Server-side access control

const enforceFeatureAccess = (userId: string, feature: string) => {
  const subscription = getUserSubscription(userId);
  const plan = subscriptionService.getCurrentPlan();

  // Check feature entitlement
  const entitlement = plan.features[feature];

  if (!entitlement || entitlement === 'disabled') {
    throw new ForbiddenError(`Feature ${feature} not available in plan ${plan.name}`);
  }

  // Check usage limits
  const usage = getCurrentUsage(userId, feature);
  const limits = getFeatureLimits(plan.id, feature);

  if (usage >= limits) {
    throw new QuotaExceededError(`Feature ${feature} usage limit exceeded`);
  }

  return true;
};

```

--

- #

# 📱 DEPLOYMENT-SPECIFIC UI/

U

X

#

## **SaaS Enterprise UI

* *

```

┌─ SaaS Dashboard ──────────────────────────────────────┐
│  🏢 Enterprise Features    ⚙️ Account Settings         │
│                                                             │
│  ┌─ Multi-tenant Overview ──────────────────────────────┐   │

│  │  🏢 Organizations: 15    👥 Users: 450               │   │
│  │  📊 Total Workflows: 2,340    🎯 Success Rate: 98%   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ Enterprise Features ─────────────────────────────────┐   │
│  │  ✅ Temporal Workflows    ✅ Weights & Biases         │   │
│  │  ✅ Postman Postbot       ✅ TestSigma                │   │
│  │  ✅ Novita AI            ✅ Advanced Analytics        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

```

#

## **White-label UI

* *

```

┌─ Acme Corp Workflow Studio ─────────────────────────────┐
│  🏢 Acme Corp    ⚙️ Settings    📞 Support               │
│                                                             │
│  ┌─ Custom Dashboard ───────────────────────────────────┐   │
│  │  🎨 Acme Workflows: 45    📈 Success Rate: 97%       │   │
│  │  🤖 AI Models Used: 12    💰 Cost Saved: $2,340      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ Branded Features ────────────────────────────────────┐   │
│  │  ✅ Custom Integrations   ✅ White-label Support      │   │

│  │  ✅ Client-specific Models ✅ Branded Analytics       │   │

│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

```

#

## **Self-hosted UI

* *

```

┌─ Self-hosted Deployment ────────────────────────────────┐

│  🏠 Local Instance    ⚙️ Admin    🔧 Maintenance         │
│                                                             │
│  ┌─ System Health ──────────────────────────────────────┐   │
│  │  🖥️ Server: Healthy    💾 Storage: 67%               │   │
│  │  🧠 GPU Usage: 45%      🔄 Active Workflows: 8       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ Local Features ──────────────────────────────────────┐   │
│  │  ✅ Local AI Models     ✅ Custom Integrations        │   │
│  │  ✅ Offline Mode        ✅ Full Data Control          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

```

This comprehensive deployment and subscription guide demonstrates how the Auterity Error-IQ platform intelligently detects and adapts to different deployment models while maintaining consistent feature availability and user experience across SaaS, white-label, and self-hosted environments

.
