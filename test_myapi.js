async function proxyImage() {
    const targetUrl = "https://sanaldolabim.vercel.app/api/scrape-product?url=" + encodeURIComponent("https://www.network.com.tr/siyah-kemerli-yun-karo-kaban-142270");
    try {
        const response = await fetch(targetUrl);
        console.log(response.status);
        console.log(await response.text());
    } catch(e) {
        console.error(e);
    }
}
proxyImage();
