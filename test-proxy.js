async function test() {
  const url = "http://localhost:3000/api/proxy-image?url=" + encodeURIComponent("https://shop.mango.com/tr/kadin/tisort-ve-ust-kisa-kollu/pamuklu-basit-tisort_67040448.html");
  const res = await fetch(url);
  console.log(res.status, res.headers.get("content-type"));
  const text = await res.text();
  console.log(text.includes("og:image") || text.includes("product-image") ? "Found image tags" : "No image tags found");
}

test();
