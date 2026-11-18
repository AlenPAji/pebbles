// Read-only smoke check of the built Next app on the separately verified dev branch.
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const { createServer } = require("node:net");
const { setTimeout: delay } = require("node:timers/promises");
const { Pool } = require("@neondatabase/serverless");
const { parse } = require("dotenv");

async function main() {
  const local = parse(readFileSync(".env.local"));
  const connection = process.env.PEBBLES_DEV_DATABASE_URL || local.POSTGRES_URL;
  const host = new URL(connection).hostname;
  assert.match(host, /^ep-[a-z0-9.-]+\.neon\.tech$/);
  assert.equal(host, process.env.PEBBLES_VERIFIED_DEV_HOST, "Confirm the development endpoint first");
  const pool = new Pool({ connectionString: connection, connectionTimeoutMillis: 15000 });
  let server;
  let diagnostics = "";
  try {
    const { rows } = await pool.query(`
      SELECT v.id, v.product_id, v.sku, c.name AS color, coalesce(v.price_override,p.price) AS price
      FROM product_variants v JOIN products p ON p.id=v.product_id JOIN product_colors c ON c.id=v.product_color_id
      WHERE v.deleted_at IS NULL AND c.deleted_at IS NULL AND p.deleted_at IS NULL
      ORDER BY v.id LIMIT 2`);
    assert(rows.length, "The read-only smoke check requires an existing development product");
    const listener = createServer();
    listener.listen(0, "localhost");
    await once(listener, "listening");
    const port = listener.address().port;
    await new Promise(resolve => listener.close(resolve));
    // NextURL normalizes loopback IPs to localhost. Use the same Host header for Clerk's rewrite.
    const origin = "http://localhost:" + port;
    server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "-H", "localhost", "-p", String(port)], {
      env: {...process.env, POSTGRES_URL: connection}, stdio: "pipe", windowsHide: true
    });
    await new Promise((resolve,reject) => {
      const timer = setTimeout(()=>reject(new Error("Local Next startup timed out")),30000);
      server.stdout.on("data", chunk => {if(chunk.toString().includes("Ready")) {clearTimeout(timer);resolve();}});
      server.stderr.on("data", chunk => { diagnostics = (diagnostics + chunk.toString()).slice(-8000); });
      server.once("exit",()=>{clearTimeout(timer);reject(new Error("Local Next server stopped"));});
    });
    const list = await fetch(origin+"/products");
    assert.equal(list.status,200,"Product listing");
    const listing = await list.text();
    assert(listing.includes("/products/"),"Listing returned catalogue links");
    const detail = await fetch(origin+"/products/"+rows[0].product_id);
    assert.equal(detail.status,200,"Product detail");
    const html = await detail.text();
    assert(html.includes("Add to bag") && html.includes("Colour"),"Detail renders variant purchase controls");
    const quote = await fetch(origin+"/api/cart/quote",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({items:rows.map(r=>({productId:r.product_id,variantId:r.id,quantity:1}))})});
    assert.equal(quote.status,200,"Cart quote");
    const items=await quote.json();
    assert.equal(items.length,rows.length);
    for (const row of rows) {
      const item=items.find(i=>i.variantId===row.id);
      assert.equal(item.price,Number(row.price));
      assert.equal(item.colorName,row.color);
      assert(Number.isInteger(item.available));
    }
    console.log("PASS: storefront listing, product colour selector and database-backed cart prices for "+rows.length+" variants.");
  } catch(error) {
    // Keep private URLs, credentials, SQL parameters and response payloads out of logs.
    const messages = diagnostics.split("\n").filter(line => /Error:|code:|hostname:/.test(line)).map(line =>
      line.trim().replace(/(?:https?|postgres(?:ql)?):\/\/\S+/gi,match=>{ try {return new URL(match).origin;} catch {return "[endpoint]";} }).replace(/(?:sk|pk|rzp)_(?:test|live)_\S+/g,"[key]").split("params:")[0].slice(0,160));
    if(messages.length) console.error(messages.slice(-8).join("\n"));
    throw error;
  } finally {
    if(server && server.exitCode===null) {
      const exited=once(server,"exit");
      server.kill();
      await Promise.race([exited,delay(2000)]);
    }
    await pool.end();
  }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
