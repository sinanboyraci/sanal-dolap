async function proxyImage() {
    const targetUrl = "https://gecicidenetlemesistemi.vercel.app/api/proxy-image?url=" + encodeURIComponent("https://iad.microlink.io/DpbmicvBpUw_efL5nELRmDMHn1BX8HnakJPo4KEvbBnOha4aRubSUJ31ebhDP46QLnb0Oq0l6_yT8_QqgK_r4w.png");
    try {
        const response = await fetch(targetUrl);
        console.log(response.status);
    } catch(e) {
        console.error(e);
    }
}
proxyImage();
