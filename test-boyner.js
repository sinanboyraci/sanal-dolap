const test = async () => {
    try {
        const response = await fetch("https://www.boyner.com.tr/clarks-siyah-erkek-deri-sneaker-craft-swift-p-15007697", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            }
        });
        console.log("STATUS:", response.status);
        const text = await response.text();
        console.log("BODY START:", text.substring(0, 500));
    } catch (e) {
        console.error("FAIL", e);
    }
};
test();
