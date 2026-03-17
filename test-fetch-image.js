const test = async () => {
    try {
        const imageUrl = "https://stbu.boyner.com.tr/mnresize/1138/1630/productimages/5003186001_01.jpg?v=1773119814";
        console.log("Fetching image:", imageUrl);
        const response = await fetch(imageUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": new URL(imageUrl).origin
            }
        });
        console.log("STATUS:", response.status);
        console.log("CONTENT-TYPE:", response.headers.get("content-type"));
        const buffer = await response.arrayBuffer();
        console.log("BUFFER SIZE:", buffer.byteLength);
    } catch (e) {
        console.error("FAIL", e);
    }
};
test();
