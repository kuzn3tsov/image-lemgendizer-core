export default [
    {
        "id": "web-hero",
        "name": "WebHero",
        "displayName": "Hero Banner",
        "width": 1920,
        "height": 1080,
        "platform": "web",
        "category": "web",
        "icon": "fas fa-desktop",
        "description": "Full-width hero banner for websites",
        "aspectRatio": "16:9",
        "recommendedFormats": [
            "webp",
            "jpg"
        ],
        "maxFileSize": "200KB",
        "notes": "Optimize for fast loading, consider responsive breakpoints"
    },
    {
        "id": "web-blog",
        "name": "WebBlog",
        "displayName": "Blog Featured Image",
        "width": 1200,
        "height": 630,
        "platform": "web",
        "category": "web",
        "icon": "fas fa-blog",
        "description": "Blog post featured image (Open Graph optimal)",
        "aspectRatio": "1.91:1",
        "recommendedFormats": [
            "webp",
            "jpg"
        ],
        "maxFileSize": "100KB",
        "notes": "Also works for social media sharing previews"
    },
    {
        "id": "web-content",
        "name": "WebContent",
        "displayName": "Content Image",
        "width": 1200,
        "height": "flex",
        "platform": "web",
        "category": "web",
        "icon": "fas fa-image",
        "description": "General content images within articles/pages",
        "aspectRatio": "flexible",
        "recommendedFormats": [
            "webp",
            "jpg",
            "png"
        ],
        "maxFileSize": "150KB",
        "notes": "Flexible height that maintains natural aspect ratio"
    },
    {
        "id": "web-thumb",
        "name": "WebThumb",
        "displayName": "Thumbnail",
        "width": 300,
        "height": 300,
        "platform": "web",
        "category": "web",
        "icon": "fas fa-square",
        "description": "Small thumbnails for galleries, products, listings",
        "aspectRatio": "1:1",
        "recommendedFormats": [
            "webp",
            "jpg"
        ],
        "maxFileSize": "30KB",
        "notes": "Keep file size small for grid views"
    },
    {
        "id": "web-card",
        "name": "WebCard",
        "displayName": "Card Image",
        "width": 400,
        "height": 300,
        "platform": "web",
        "category": "web",
        "icon": "fas fa-id-card",
        "description": "Images for feature cards, product cards, etc.",
        "aspectRatio": "4:3",
        "recommendedFormats": [
            "webp",
            "jpg"
        ],
        "maxFileSize": "50KB",
        "notes": "Common card aspect ratio"
    },
    {
        "id": "web-og",
        "name": "WebOpenGraph",
        "displayName": "Open Graph Image",
        "width": 1200,
        "height": 630,
        "platform": "web",
        "category": "web",
        "icon": "fas fa-share",
        "description": "Social sharing preview image",
        "aspectRatio": "1.91:1",
        "recommendedFormats": [
            "jpg",
            "png"
        ],
        "maxFileSize": "100KB",
        "notes": "Essential for social media link sharing"
    }
]