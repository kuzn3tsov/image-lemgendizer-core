/**
 * Shared constants for LemGendary Image Processor
 * @module constants/sharedConstants
 */

// ===== ERROR CODES =====
export const ErrorCodes = {
    // File errors
    INVALID_FILE: 'INVALID_FILE',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    UNSUPPORTED_TYPE: 'UNSUPPORTED_TYPE',

    // Dimension errors
    INVALID_DIMENSIONS: 'INVALID_DIMENSIONS',
    INVALID_WIDTH: 'INVALID_WIDTH',
    INVALID_HEIGHT: 'INVALID_HEIGHT',
    INVALID_DIMENSION: 'INVALID_DIMENSION',
    DIMENSION_EXCEEDS_MAX: 'DIMENSION_EXCEEDS_MAX',

    // Quality/Format errors
    INVALID_QUALITY: 'INVALID_QUALITY',
    INVALID_FORMAT: 'INVALID_FORMAT',

    // Crop errors
    INVALID_CROP_DIMENSIONS: 'INVALID_CROP_DIMENSIONS',
    INVALID_CROP_MODE: 'INVALID_CROP_MODE',
    INVALID_CROP_ALGORITHM: 'INVALID_CROP_ALGORITHM',

    // Resize errors
    INVALID_MODE: 'INVALID_MODE',
    INVALID_ALGORITHM: 'INVALID_ALGORITHM',

    // Rename errors
    EMPTY_PATTERN: 'EMPTY_PATTERN',
    INVALID_CHARS: 'INVALID_CHARS',
    PATTERN_ERROR: 'PATTERN_ERROR',

    // Optimization errors
    INVALID_COMPRESSION_MODE: 'INVALID_COMPRESSION_MODE',
    INVALID_BROWSER_SUPPORT: 'INVALID_BROWSER_SUPPORT',

    // Template errors
    MISSING_TEMPLATE_ID: 'MISSING_TEMPLATE_ID',
    TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',

    // General errors
    MISSING_INFO: 'MISSING_INFO',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    PROCESSING_ERROR: 'PROCESSING_ERROR'
};

// ===== WARNING CODES =====
export const WarningCodes = {
    // File warnings
    LARGE_FILE: 'LARGE_FILE',
    CONTENT_LOSS: 'CONTENT_LOSS',
    TRANSPARENCY_LOSS: 'TRANSPARENCY_LOSS',
    AVIF_BROWSER_SUPPORT: 'AVIF_BROWSER_SUPPORT',
    UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
    LOSSLESS_QUALITY_CONFLICT: 'LOSSLESS_QUALITY_CONFLICT',

    // Dimension warnings
    SMALL_WIDTH: 'SMALL_WIDTH',
    SMALL_HEIGHT: 'SMALL_HEIGHT',
    LARGE_DIMENSIONS: 'LARGE_DIMENSIONS',
    VERY_SMALL_DIMENSION: 'VERY_SMALL_DIMENSION',
    VERY_LARGE_DIMENSION: 'VERY_LARGE_DIMENSION',
    VERY_SMALL_SOURCE: 'VERY_SMALL_SOURCE',
    VERY_LARGE_SOURCE: 'VERY_LARGE_SOURCE',
    EXTREME_UPSCALE: 'EXTREME_UPSCALE',
    EXTREME_DOWNSCALE: 'EXTREME_DOWNSCALE',
    ASPECT_RATIO_CHANGE: 'ASPECT_RATIO_CHANGE',

    // Crop warnings
    NON_INTEGER_DIMENSION: 'NON_INTEGER_DIMENSION',
    FORCE_SQUARE_NO_ASPECT: 'FORCE_SQUARE_NO_ASPECT',
    EXTREME_ASPECT_RATIO: 'EXTREME_ASPECT_RATIO',
    SMALL_CROP_SIZE: 'SMALL_CROP_SIZE',
    LARGE_CROP_SIZE: 'LARGE_CROP_SIZE',
    EXTREME_ASPECT_AI: 'EXTREME_ASPECT_AI',
    UPSCALE_DISABLED: 'UPSCALE_DISABLED',
    SOURCE_TOO_SMALL: 'SOURCE_TOO_SMALL',
    VERY_SMALL_CROP: 'VERY_SMALL_CROP',
    IMAGE_TOO_SMALL: 'IMAGE_TOO_SMALL',
    ASPECT_MISMATCH: 'ASPECT_MISMATCH',

    // Format warnings
    SVG_SKIPPED: 'SVG_SKIPPED',
    FAVICON_RESIZE: 'FAVICON_RESIZE',
    AVIF_QUALITY_RANGE: 'AVIF_QUALITY_RANGE',

    // Rename warnings
    NO_PLACEHOLDERS: 'NO_PLACEHOLDERS',
    LONG_PATTERN: 'LONG_PATTERN',
    MISSING_UNIQUE_ID: 'MISSING_UNIQUE_ID',
    INVALID_MAX_LENGTH: 'INVALID_MAX_LENGTH',
    SPECIAL_CHARS_ENABLED: 'SPECIAL_CHARS_ENABLED',
    NO_NAME_CHANGE: 'NO_NAME_CHANGE',
    VERY_LONG_FILENAME: 'VERY_LONG_FILENAME',
    UNREPLACED_VARIABLES: 'UNREPLACED_VARIABLES',
    SPECIAL_CHARS_DETECTED: 'SPECIAL_CHARS_DETECTED'
};

// ===== PROCESSOR TYPES =====
export const ProcessorTypes = {
    RESIZE: 'resize',
    CROP: 'crop',
    OPTIMIZE: 'optimize',
    RENAME: 'rename',
    TEMPLATE: 'template',
    FAVICON: 'favicon',
    PDF: 'pdf'
};

// ===== TASK TYPES =====
export const TaskTypes = {
    GENERAL: 'general',
    FAVICON: 'favicon',
    TEMPLATE: 'template',
    OPTIMIZATION_ONLY: 'optimization_only',
    RESIZE_ONLY: 'resize_only',
    CROP_ONLY: 'crop_only',
    BATCH: 'batch'
};

// ===== OPTIMIZATION LEVELS =====
export const OptimizationLevels = {
    NONE: 'none',
    STANDARD: 'standard',
    BALANCED: 'balanced',
    HIGH_QUALITY: 'high_quality',
    MAXIMUM_QUALITY: 'maximum_quality',
    MAXIMUM_COMPRESSION: 'maximum_compression',
    AGGRESSIVE: 'aggressive'
};

// ===== RESIZE ALGORITHMS =====
export const ResizeAlgorithms = {
    LANCZOS3: 'lanczos3',
    BILINEAR: 'bilinear',
    NEAREST: 'nearest',
    CUBIC: 'cubic',
    MITCHELL: 'mitchell'
};

// ===== RESIZE MODES =====
export const ResizeModes = {
    AUTO: 'auto',
    WIDTH: 'width',
    HEIGHT: 'height',
    LONGEST: 'longest',
    SHORTEST: 'shortest',
    FIT: 'fit'
};

// ===== CROP MODES =====
export const CropModes = {
    SMART: 'smart',
    FACE: 'face',
    OBJECT: 'object',
    SALIENCY: 'saliency',
    ENTROPY: 'entropy',
    CENTER: 'center',
    TOP: 'top',
    BOTTOM: 'bottom',
    LEFT: 'left',
    RIGHT: 'right',
    TOP_LEFT: 'top-left',
    TOP_RIGHT: 'top-right',
    BOTTOM_LEFT: 'bottom-left',
    BOTTOM_RIGHT: 'bottom-right'
};

// ===== OPTIMIZATION FORMATS =====
export const OptimizationFormats = {
    AUTO: 'auto',
    WEBP: 'webp',
    JPEG: 'jpeg',
    JPG: 'jpg',
    PNG: 'png',
    AVIF: 'avif',
    SVG: 'svg',
    ICO: 'ico',
    PDF: 'pdf',
    EPS: 'eps',
    AI: 'ai',
    ORIGINAL: 'original'
};

// ===== COMPRESSION MODES =====
export const CompressionModes = {
    BALANCED: 'balanced',
    AGGRESSIVE: 'aggressive',
    ADAPTIVE: 'adaptive',
    LOSSLESS: 'lossless'
};

// ===== QUALITY TARGETS =====
export const QualityTargets = {
    SMALLEST: 'smallest',
    BALANCED: 'balanced',
    BEST: 'best'
};

// ===== BROWSER SUPPORT =====
export const BrowserSupport = {
    MODERN: 'modern',
    LEGACY: 'legacy',
    ALL: 'all'
};

// ===== TEMPLATE CATEGORIES =====
export const TemplateCategories = {
    WEB: 'web',
    SOCIAL: 'social',
    LOGO: 'logo',
    ECOMMERCE: 'ecommerce',
    PRINT: 'print',
    FAVICON: 'favicon',
    MOBILE: 'mobile',
    DESKTOP: 'desktop',
    GENERAL: 'general',
    FLEXIBLE: 'flexible'
};

export const TemplateCategoryKeys = ['web', 'social', 'logo', 'ecommerce', 'print', 'favicon', 'mobile', 'desktop', 'general', 'flexible'];

// ===== IMAGE MIME TYPES =====
export const ImageMimeTypes = {
    JPEG: 'image/jpeg',
    PNG: 'image/png',
    WEBP: 'image/webp',
    GIF: 'image/gif',
    SVG: 'image/svg+xml',
    BMP: 'image/bmp',
    TIFF: 'image/tiff',
    AVIF: 'image/avif',
    ICO: 'image/x-icon',
    MICROSOFT_ICO: 'image/vnd.microsoft.icon',
    PDF: 'application/pdf',
    EPS: 'application/postscript',
    AI: 'application/illustrator'
};

// ===== FILE EXTENSIONS =====
export const FileExtensions = {
    JPEG: 'jpg',
    JPG: 'jpg',
    PNG: 'png',
    WEBP: 'webp',
    GIF: 'gif',
    SVG: 'svg',
    BMP: 'bmp',
    TIFF: 'tiff',
    TIF: 'tiff',
    AVIF: 'avif',
    ICO: 'ico',
    PDF: 'pdf',
    EPS: 'eps',
    AI: 'ai'
};

// ===== ASPECT RATIOS =====
export const AspectRatios = {
    // Standard ratios
    SQUARE: '1:1',
    FOUR_THREE: '4:3',
    THREE_TWO: '3:2',
    SIXTEEN_TEN: '16:10',
    SIXTEEN_NINE: '16:9',
    TWENTYONE_NINE: '21:9',
    THREE_FOUR: '3:4',
    TWO_THREE: '2:3',
    TWO_ONE: '2:1',
    FIVE_TWO: '5:2',
    FIVE_THREE: '5:3',
    FOUR_ONE: '4:1',
    THREE_ONE: '3:1',
    NINE_SIXTEEN: '9:16',
    NINETEEN_TEN: '1.91:1',
    TWENTYSEVEN_TEN: '2.7:1',

    // Print & document ratios
    LETTER_PORTRAIT: '8.5:11',
    LETTER_LANDSCAPE: '11:8.5',
    LEGAL_PORTRAIT: '8.5:14',
    LEGAL_LANDSCAPE: '14:8.5',
    TABLOID_PORTRAIT: '11:17',
    TABLOID_LANDSCAPE: '17:11',
    A4_PORTRAIT: '210:297',
    A4_LANDSCAPE: '297:210',

    // Specialized ratios
    GATEFOLD: '17:11',
    RACK_CARD_PORTRAIT: '4:9',
    RACK_CARD_LANDSCAPE: '9:4',
    TRIFOLD: '8.5:11',

    // Flexible/variable
    FLEXIBLE: 'flexible',
    VARIABLE: 'variable'
};

// ===== PLATFORM CONSTANTS =====
export const PlatformTypes = {
    // Web & Browser
    WEB: 'web',
    BROWSER: 'browser',
    RESPONSIVE: 'responsive',

    // Mobile
    MOBILE: 'mobile',
    IOS: 'ios',
    ANDROID: 'android',
    TABLET: 'tablet',

    // Desktop
    DESKTOP: 'desktop',
    WINDOWS: 'windows',
    MAC: 'mac',

    // Browsers
    SAFARI: 'safari',
    CHROME: 'chrome',
    FIREFOX: 'firefox',
    EDGE: 'edge',

    // Social Media
    FACEBOOK: 'facebook',
    TWITTER: 'twitter',
    INSTAGRAM: 'instagram',
    LINKEDIN: 'linkedin',
    YOUTUBE: 'youtube',
    PINTEREST: 'pinterest',
    TIKTOK: 'tiktok',

    // E-commerce
    SHOPIFY: 'shopify',
    WOOCOMMERCE: 'woocommerce',
    AMAZON: 'amazon',
    EBAY: 'ebay',
    MAGENTO: 'magento',
    BIGCOMMERCE: 'bigcommerce',

    // Print
    PRINT: 'print',

    // Media
    PHOTO: 'photo',
    VIDEO: 'video',
    EMAIL: 'email',

    // Display
    RETINA: 'retina',
    HIGH_DPI: 'high-dpi',

    // Categories
    GALLERY: 'gallery',
    ECOMMERCE: 'ecommerce',
    BLOG: 'blog',
    ARTICLE: 'article',
    CONTENT: 'content',
    UI: 'ui',
    CARDS: 'cards',
    APP: 'app'
};

// ===== COMMON USES =====
export const CommonUses = {
    // Favicon & Icons
    WEBSITE_ICON: 'website-icon',
    BROWSER_TAB: 'browser-tab',
    MOBILE_APP: 'mobile-app',
    HOME_SCREEN: 'home-screen',
    PINNED_TAB: 'pinned-tab',
    WINDOWS_APP: 'windows-app',
    START_MENU: 'start-menu',
    HIGH_DPI: 'high-dpi',
    PWA: 'pwa',
    COMPLETE_PACKAGE: 'complete-package',

    // Logo & Branding
    WEBSITE_HEADER: 'website-header',
    EMAIL_SIGNATURE: 'email-signature',
    DOCUMENTATION: 'documentation',
    SOCIAL_MEDIA: 'social-media',
    PROFILE: 'profile',
    BUSINESS_CARD: 'business-card',
    BROCHURE: 'brochure',
    SIGNAGE: 'signage',
    PHOTO_PROTECTION: 'photo-protection',
    BRANDING: 'branding',
    VIDEO_OVERLAY: 'video-overlay',
    STORE: 'store',
    AVATAR: 'avatar',

    // Social Media
    COVER: 'cover',
    BANNER: 'banner',
    SHARED_POST: 'shared-post',
    LINK_PREVIEW: 'link-preview',
    FEED_POST: 'feed-post',
    ALBUM: 'album',
    STORIES: 'stories',
    REELS: 'reels',
    IGTV: 'igtv',
    TWEET: 'tweet',
    SCREENSHOT: 'screenshot',
    PRODUCT_IMAGE: 'product-image',
    PORTRAIT_IMAGE: 'portrait-image',
    PROFESSIONAL: 'professional',
    NETWORKING: 'networking',
    CHANNEL_ICON: 'channel-icon',
    CHANNEL_ART: 'channel-art',
    THUMBNAIL: 'thumbnail',
    VIDEO_PREVIEW: 'video-preview',
    PIN: 'pin',
    VERTICAL_IMAGE: 'vertical-image',
    INFOGRAPHIC: 'infographic',
    VERTICAL_CONTENT: 'vertical-content',
    VIDEO_COVER: 'video-cover',

    // Web & Content
    WEBSITE_HERO: 'website-hero',
    LANDING_PAGE: 'landing-page',
    BLOG_POST: 'blog-post',
    ARTICLE: 'article',
    ARTICLE_CONTENT: 'article-content',
    PAGE_CONTENT: 'page-content',
    GALLERY_THUMBNAIL: 'gallery-thumbnail',
    PRODUCT_THUMBNAIL: 'product-thumbnail',
    FEATURE_CARD: 'feature-card',
    PRODUCT_CARD: 'product-card',
    UI_COMPONENT: 'ui-component',
    SOCIAL_SHARING: 'social-sharing',
    ADVERTISING: 'advertising',
    HEADER: 'header',
    SIDEBAR: 'sidebar',

    // E-commerce
    PRODUCT_MAIN: 'product-main',
    CATALOG: 'catalog',
    GALLERY: 'gallery',
    PRODUCT_DETAIL: 'product-detail',
    ALTERNATIVE_VIEW: 'alternative-view',
    ZOOM_VIEW: 'zoom-view',
    HIGH_DETAIL: 'high-detail',
    PRODUCT_INSPECTION: 'product-inspection',
    PRODUCT_HEADER: 'product-header',
    FEATURED_IMAGE: 'featured-image',
    PRODUCT_GRID: 'product-grid',
    QUICK_VIEW: 'quick-view',
    VARIANT: 'variant',
    OPTION: 'option',
    COLOR_SWATCH: 'color-swatch',
    MARKETPLACE: 'marketplace',
    LIFESTYLE: 'lifestyle',
    IN_USE: 'in-use',
    CONTEXT: 'context',
    SPECIFICATIONS: 'specifications',
    COLLECTION: 'collection',
    CATEGORY: 'category',
    DEPARTMENT: 'department',
    AUCTION: 'auction',
    FEATURED: 'featured',
    PROMOTED: 'promoted',

    // Print & Marketing
    MARKETING: 'marketing',
    PROMOTION: 'promotion',
    INFORMATION: 'information',
    CREATIVE: 'creative',
    PRESENTATION: 'presentation',
    PREMIUM: 'premium',
    LUXURY: 'luxury',
    TOURISM: 'tourism',
    ALTERNATIVE: 'alternative',
    CORPORATE: 'corporate',
    COMMUNICATION: 'communication',
    UPDATES: 'updates',
    ORGANIZATION: 'organization',
    PUBLICATION: 'publication',
    NEWSPAPER: 'newspaper',
    ANNOUNCEMENT: 'announcement',
    INDOOR: 'indoor',
    EVENT: 'event',
    CONFERENCE: 'conference',
    EXHIBITION: 'exhibition',
    RETAIL: 'retail',
    REPORT: 'report',
    EDUCATION: 'education',
    DIGITAL: 'digital',
    VERSATILE: 'versatile',

    // General
    SHARING: 'sharing',
    CONTENT: 'content',
    ONLINE_SHOP: 'online-shop'
};

// ===== DEFAULT VALUES =====
export const Defaults = {
    // Task defaults
    TASK_NAME: 'Untitled Task',
    TASK_DESCRIPTION: 'Image processing task',
    MAX_BATCH_SIZE: 50,

    // Resize defaults
    RESIZE_ALGORITHM: ResizeAlgorithms.LANCZOS3,
    RESIZE_MODE: ResizeModes.LONGEST,
    MAX_DIMENSION: 10000,
    MIN_DIMENSION: 10,
    DEFAULT_DIMENSION: 1000,

    // Crop defaults
    CROP_MODE: CropModes.CENTER,
    CROP_ALGORITHM: ResizeAlgorithms.LANCZOS3,
    DEFAULT_CROP_WIDTH: 500,
    DEFAULT_CROP_HEIGHT: 500,
    MIN_CROP_SIZE: 50,
    MAX_CROP_SIZE: 10000,
    CONFIDENCE_THRESHOLD: 70,

    // Optimization defaults
    OPTIMIZATION_FORMAT: OptimizationFormats.AUTO,
    OPTIMIZATION_QUALITY: 85,
    COMPRESSION_MODE: CompressionModes.ADAPTIVE,
    BROWSER_SUPPORT: [BrowserSupport.MODERN, BrowserSupport.LEGACY],
    QUALITY_TARGET: QualityTargets.BALANCED,
    PROGRESSIVE: true,
    STRIP_METADATA: true,
    PRESERVE_TRANSPARENCY: true,
    ANALYZE_CONTENT: true,
    OPTIMIZATION_FIRST: false,
    OPTIMIZE_ANIMATION: true,

    // Rename defaults
    RENAME_PATTERN: '{name}-{dimensions}',
    DEFAULT_SEPARATOR: '-',
    MAX_FILENAME_LENGTH: 255,
    DATE_FORMAT: 'YYYY-MM-DD',
    TIME_FORMAT: 'HH-mm-ss',
    PRESERVE_EXTENSION: true,
    ADD_INDEX: true,
    ADD_TIMESTAMP: false,
    USE_PADDED_INDEX: true,
    REPLACE_SPACES: true,
    SPACE_REPLACEMENT: '-',
    KEEP_SPECIAL_CHARS: false,

    // Favicon defaults
    FAVICON_SIZES: [16, 32, 48, 64, 128, 256],
    FAVICON_FORMATS: ['png', 'ico'],
    GENERATE_MANIFEST: true,
    GENERATE_HTML: true,
    INCLUDE_APPLE_TOUCH: true,
    INCLUDE_ANDROID: true,
    ROUND_CORNERS: false,
    BACKGROUND_COLOR: '#ffffff',
    PADDING: 0,

    // Validation defaults
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    MIN_FILE_SIZE: 1,

    // Template defaults
    DEFAULT_CATEGORY: TemplateCategories.GENERAL
};

// ===== PROCESSING ORDER =====
export const ProcessingOrder = [
    ProcessorTypes.RESIZE,
    ProcessorTypes.CROP,
    ProcessorTypes.OPTIMIZE,
    ProcessorTypes.RENAME
];

// ===== SEVERITY LEVELS =====
export const SeverityLevels = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
};