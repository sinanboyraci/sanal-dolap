import { JSDOM } from 'jsdom';

const test = async () => {
    try {
        const response = await fetch("https://www.boyner.com.tr/clarks-siyah-erkek-deri-sneaker-craft-swift-p-15007697", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            }
        });
        const text = await response.text();
        const dom = new JSDOM(text);
        const doc = dom.window.document;

        console.log("og:image", doc.querySelector('meta[property="og:image"]')?.getAttribute('content'));
        console.log("twitter:image", doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content'));
        console.log("image_src", doc.querySelector('link[rel="image_src"]')?.getAttribute('href'));

        const allImages = Array.from(doc.querySelectorAll('img'));
        const possibleImages = allImages
            .map(img => img.getAttribute('src') || img.getAttribute('data-src'))
            .filter(src => src && (src.includes('jpg') || src.includes('jpeg') || src.includes('png') || src.includes('webp')))
            .filter(src => !src?.includes('logo') && !src?.includes('icon') && !src?.includes('avatar') && !src?.includes('svg'));

        console.log("OTHER IMAGES:", possibleImages);
    } catch (e) {
        console.error("FAIL", e);
    }
};
test();
