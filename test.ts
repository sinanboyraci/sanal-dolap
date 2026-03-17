import fetch from 'node-fetch';

async function test() {
  const url = 'https://iad.microlink.io/FJQYPcXKvkbHI1-stMFjI9cb7BG8MG1fr5ELn7zTZokiFmLWwk7HVqdsH3JXyV4vAS1693KsRpN-rOYZPxx3nQ.png';
  const res = await fetch(url);
  console.log(res.status, res.headers.get('content-type'));
}
test();
