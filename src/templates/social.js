export default [
    // Instagram
    {
        "id": "instagram-profile",
        "name": "InstagramProfile",
        "displayName": "Profile Picture",
        "width": 320,
        "height": 320,
        "platform": "instagram",
        "category": "social",
        "icon": "fab fa-instagram",
        "description": "Instagram profile picture (displays as circular 110×110 in app)",
        "aspectRatio": "1:1",
        "recommendedFormats": [
            "jpg",
            "webp"
        ],
        "maxFileSize": "100KB",
        "notes": "Upload at 320×320 for best quality, will be cropped to circle"
    },
    {
        "id": "instagram-square",
        "name": "InstagramSquare",
        "displayName": "Square Post",
        "width": 1080,
        "height": 1080,
        "platform": "instagram",
        "category": "social",
        "icon": "fas fa-square",
        "description": "Instagram square photo/video posts",
        "aspectRatio": "1:1",
        "recommendedFormats": [
            "jpg",
            "webp"
        ],
        "maxFileSize": "8MB",
        "notes": "Optimal for grid view, displays at 600×600"
    },
    {
        "id": "instagram-portrait",
        "name": "InstagramPortrait",
        "displayName": "Portrait Post",
        "width": 1080,
        "height": 1350,
        "platform": "instagram",
        "category": "social",
        "icon": "fas fa-portrait",
        "description": "Instagram portrait (vertical) posts",
        "aspectRatio": "4:5",
        "recommendedFormats": [
            "jpg",
            "webp"
        ],
        "maxFileSize": "8MB",
        "notes": "Takes more space in feed, good for full-body shots"
    },
    {
        "id": "instagram-landscape",
        "name": "InstagramLandscape",
        "displayName": "Landscape Post",
        "width": 1080,
        "height": 566,
        "platform": "instagram",
        "category": "social",
        "icon": "fas fa-landscape",
        "description": "Instagram landscape (horizontal) posts",
        "aspectRatio": "1.91:1",
        "recommendedFormats": [
            "jpg",
            "webp"
        ],
        "maxFileSize": "8MB",
        "notes": "Good for group photos and scenery"
    },
    {
        "id": "instagram-stories",
        "name": "InstagramStoriesReels",
        "displayName": "Stories & Reels",
        "width": 1080,
        "height": 1920,
        "platform": "instagram",
        "category": "social",
        "icon": "fas fa-film",
        "description": "Instagram Stories, Reels, and IGTV covers",
        "aspectRatio": "9:16",
        "recommendedFormats": [
            "jpg",
            "webp"
        ],
        "maxFileSize": "4MB",
        "notes": "Full-screen vertical format, safe area: center 1080×1420"
    },

    // Facebook
    {
        "id": "facebook-profile",
        "name": "FacebookProfile",
        "displayName": "Profile Picture",
        "width": 180,
        "height": 180,
        "platform": "facebook",
        "category": "social",
        "icon": "fab fa-facebook",
        "description": "Facebook profile picture (displays as 170×170 on desktop)",
        "aspectRatio": "1:1",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "5MB",
        "notes": "Minimum 180×180, displays as circular"
    },
    {
        "id": "facebook-cover",
        "name": "FacebookCoverBanner",
        "displayName": "Cover Photo",
        "width": 851,
        "height": 315,
        "platform": "facebook",
        "category": "social",
        "icon": "fas fa-panorama",
        "description": "Facebook page and profile cover photo",
        "aspectRatio": "~2.7:1",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "100KB",
        "notes": "Displays as 820×312 on desktop, mobile crops sides"
    },
    {
        "id": "facebook-shared",
        "name": "FacebookSharedImage",
        "displayName": "Shared Image",
        "width": 1200,
        "height": 630,
        "platform": "facebook",
        "category": "social",
        "icon": "fas fa-share-alt",
        "description": "Optimal size for shared links and images in feed",
        "aspectRatio": "1.91:1",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "8MB",
        "notes": "Ideal for link previews and engagement"
    },
    {
        "id": "facebook-square",
        "name": "FacebookSquarePost",
        "displayName": "Square Post",
        "width": 1200,
        "height": 1200,
        "platform": "facebook",
        "category": "social",
        "icon": "fas fa-square",
        "description": "Facebook square post images",
        "aspectRatio": "1:1",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "8MB",
        "notes": "Good for product shots and albums"
    },
    {
        "id": "facebook-stories",
        "name": "FacebookStories",
        "displayName": "Facebook Stories",
        "width": 1080,
        "height": 1920,
        "platform": "facebook",
        "category": "social",
        "icon": "fas fa-scroll",
        "description": "Facebook Stories (full-screen vertical)",
        "aspectRatio": "9:16",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "4MB",
        "notes": "Same as Instagram Stories format"
    },

    // Twitter/X
    {
        "id": "twitter-profile",
        "name": "XProfile",
        "displayName": "Profile Picture",
        "width": 400,
        "height": 400,
        "platform": "twitter",
        "category": "social",
        "icon": "fab fa-twitter",
        "description": "Twitter/X profile picture (displays as 200×200)",
        "aspectRatio": "1:1",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "2MB",
        "notes": "Upload at 400×400, displays as circular"
    },
    {
        "id": "twitter-header",
        "name": "XHeaderBanner",
        "displayName": "Header Banner",
        "width": 1500,
        "height": 500,
        "platform": "twitter",
        "category": "social",
        "icon": "fas fa-panorama",
        "description": "Twitter/X header banner",
        "aspectRatio": "3:1",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "5MB",
        "notes": "Minimum 1500×500, important content in center"
    },
    {
        "id": "twitter-landscape",
        "name": "XLandscapePost",
        "displayName": "Landscape Post",
        "width": 1600,
        "height": 900,
        "platform": "twitter",
        "category": "social",
        "icon": "fas fa-id-card",
        "description": "Twitter/X landscape image in tweet",
        "aspectRatio": "16:9",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "5MB",
        "notes": "Optimal for screenshots and wide images"
    },
    {
        "id": "twitter-square",
        "name": "XSquarePost",
        "displayName": "Square Post",
        "width": 1080,
        "height": 1080,
        "platform": "twitter",
        "category": "social",
        "icon": "fas fa-square",
        "description": "Twitter/X square image in tweet",
        "aspectRatio": "1:1",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "5MB",
        "notes": "Good for product images and infographics"
    },
    {
        "id": "twitter-portrait",
        "name": "XPortraitPost",
        "displayName": "Portrait Post",
        "width": 1080,
        "height": 1350,
        "platform": "twitter",
        "category": "social",
        "icon": "fas fa-portrait",
        "description": "Twitter/X portrait (vertical) image",
        "aspectRatio": "4:5",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "5MB",
        "notes": "Similar to Instagram portrait format"
    },

    // LinkedIn
    {
        "id": "linkedin-profile",
        "name": "LinkedInProfile",
        "displayName": "Profile Picture",
        "width": 400,
        "height": 400,
        "platform": "linkedin",
        "category": "social",
        "icon": "fab fa-linkedin",
        "description": "LinkedIn profile picture (displays as circular)",
        "aspectRatio": "1:1",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "8MB",
        "notes": "Upload at 400×400, minimum 300×300"
    },
    {
        "id": "linkedin-cover",
        "name": "LinkedInPersonalCover",
        "displayName": "Personal Cover Photo",
        "width": 1584,
        "height": 396,
        "platform": "linkedin",
        "category": "social",
        "icon": "fas fa-panorama",
        "description": "LinkedIn personal profile cover photo",
        "aspectRatio": "4:1",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "8MB",
        "notes": "Displays as 1400×425, keep important content centered"
    },
    {
        "id": "linkedin-landscape",
        "name": "LinkedInLandscapePost",
        "displayName": "Landscape Post",
        "width": 1200,
        "height": 627,
        "platform": "linkedin",
        "category": "social",
        "icon": "fas fa-id-card",
        "description": "LinkedIn landscape post images",
        "aspectRatio": "1.91:1",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "5MB",
        "notes": "Optimal for shared links and articles"
    },
    {
        "id": "linkedin-square",
        "name": "LinkedInSquarePost",
        "displayName": "Square Post",
        "width": 1200,
        "height": 1200,
        "platform": "linkedin",
        "category": "social",
        "icon": "fas fa-square",
        "description": "LinkedIn square post images",
        "aspectRatio": "1:1",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "5MB",
        "notes": "Good for infographics and product images"
    },
    {
        "id": "linkedin-portrait",
        "name": "LinkedInPortraitPost",
        "displayName": "Portrait Post",
        "width": 720,
        "height": 900,
        "platform": "linkedin",
        "category": "social",
        "icon": "fas fa-portrait",
        "description": "LinkedIn portrait (vertical) post images",
        "aspectRatio": "4:5",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "5MB",
        "notes": "Less common but supported format"
    },

    // YouTube
    {
        "id": "youtube-channel",
        "name": "YouTubeChannelIcon",
        "displayName": "Channel Icon",
        "width": 800,
        "height": 800,
        "platform": "youtube",
        "category": "social",
        "icon": "fab fa-youtube",
        "description": "YouTube channel profile picture",
        "aspectRatio": "1:1",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "2MB",
        "notes": "Displays as 98×98 in most places"
    },
    {
        "id": "youtube-banner",
        "name": "YouTubeBanner",
        "displayName": "Channel Banner",
        "width": 2048,
        "height": 1152,
        "platform": "youtube",
        "category": "social",
        "icon": "fas fa-panorama",
        "description": "YouTube channel banner/header",
        "aspectRatio": "16:9",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "6MB",
        "notes": "Safe area for mobile: 1546×423, important content centered"
    },
    {
        "id": "youtube-thumbnail",
        "name": "YouTubeThumbnail",
        "displayName": "Video Thumbnail",
        "width": 1280,
        "height": 720,
        "platform": "youtube",
        "category": "social",
        "icon": "fas fa-video",
        "description": "YouTube video thumbnail",
        "aspectRatio": "16:9",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "2MB",
        "notes": "Minimum 640×480, 16:9 recommended for all devices"
    },

    // Pinterest
    {
        "id": "pinterest-profile",
        "name": "PinterestProfile",
        "displayName": "Profile Picture",
        "width": 165,
        "height": 165,
        "platform": "pinterest",
        "category": "social",
        "icon": "fab fa-pinterest",
        "description": "Pinterest profile picture (displays as circular)",
        "aspectRatio": "1:1",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "10MB",
        "notes": "Upload at 165×165, displays as circular"
    },
    {
        "id": "pinterest-standard",
        "name": "PinterestStandardPin",
        "displayName": "Standard Pin",
        "width": 1000,
        "height": 1500,
        "platform": "pinterest",
        "category": "social",
        "icon": "fas fa-thumbtack",
        "description": "Pinterest standard vertical pin",
        "aspectRatio": "2:3",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "10MB",
        "notes": "Height should be 1.2–2.5 times the width for optimal display"
    },
    {
        "id": "pinterest-square",
        "name": "PinterestSquarePin",
        "displayName": "Square Pin",
        "width": 1000,
        "height": 1000,
        "platform": "pinterest",
        "category": "social",
        "icon": "fas fa-square",
        "description": "Pinterest square pin",
        "aspectRatio": "1:1",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "10MB",
        "notes": "Good for infographics and step-by-step guides"
    },
    {
        "id": "pinterest-story",
        "name": "PinterestStoryPin",
        "displayName": "Story Pin",
        "width": 1080,
        "height": 1920,
        "platform": "pinterest",
        "category": "social",
        "icon": "fas fa-scroll",
        "description": "Pinterest Story pin (full-screen vertical)",
        "aspectRatio": "9:16",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "10MB",
        "notes": "Similar format to Instagram/Facebook Stories"
    },

    // TikTok
    {
        "id": "tiktok-profile",
        "name": "TikTokProfile",
        "displayName": "Profile Picture",
        "width": 200,
        "height": 200,
        "platform": "tiktok",
        "category": "social",
        "icon": "fab fa-tiktok",
        "description": "TikTok profile picture",
        "aspectRatio": "1:1",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "5MB",
        "notes": "Upload at 200×200, minimum 20×20"
    },
    {
        "id": "tiktok-video",
        "name": "TikTokVideoCover",
        "displayName": "Video Cover",
        "width": 1080,
        "height": 1920,
        "platform": "tiktok",
        "category": "social",
        "icon": "fas fa-video",
        "description": "TikTok video cover/thumbnail",
        "aspectRatio": "9:16",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "5MB",
        "notes": "Full-screen vertical format, same as video dimensions"
    }
]