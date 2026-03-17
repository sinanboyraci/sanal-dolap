const test = async () => {
    try {
        const url = "https://www.network.com.tr/kahverengi-erkek-deri-el-cantasi-59695";
        console.log("Fetching:", url);
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
            }
        });
        console.log("STATUS:", response.status);
        console.log("TYPE:", response.headers.get("content-type"));
        const text = await response.text();
        console.log("BODY START:", text.substring(0, 500));
    } catch (e) {
        console.error("FAIL", e);
    }
};
test();
