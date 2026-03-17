async function proxyImage() {
    const targetUrl = "https://iad.microlink.io/DpbmicvBpUw_efL5nELRmDMHn1BX8HnakJPo4KEvbBnOha4aRubSUJ31ebhDP46QLnb0Oq0l6_yT8_QqgK_r4w.png";
    try {
        const response = await fetch(targetUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
              "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
            }
          });
          console.log(response.status);
    } catch(e) {
        console.error(e);
    }
}
proxyImage();
