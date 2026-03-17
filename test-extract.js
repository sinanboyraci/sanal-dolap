import { JSDOM } from 'jsdom';

const test = async () => {
    try {
        const response = await fetch("https://www.network.com.tr/kahverengi-erkek-deri-el-cantasi-59695", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "Sec-Ch-Ua": "\"Google Chrome\";v=\"123\", \"Not:A-Brand\";v=\"8\", \"Chromium\";v=\"123\"",
                "Sec-Ch-Ua-Mobile": "?0",
                "Sec-Ch-Ua-Platform": "\"Windows\"",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Upgrade-Insecure-Requests": "1"
            }
        });
        const text = await response.text();
        const dom = new JSDOM(text);
        const doc = dom.window.document;

        console.log("og:image", doc.querySelector('meta[property="og:image"]')?.getAttribute('content'));

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
