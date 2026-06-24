import fetch from "node-fetch";

async function test() {
  try {
    console.log("Fetching local endpoint...");
    const res = await fetch("http://localhost:3000/api/partner/vpa/matching-sims?plate=29AF12039");
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

test();
