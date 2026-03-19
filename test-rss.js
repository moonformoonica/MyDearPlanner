const https = require("https");

https
  .get(
    "https://api.rss2json.com/v1/api.json?rss_url=https://www.pinterest.com/m00dygurllll/campur-dlu-deh-ya-rapihinnya-kpn.rss",
    (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        console.log(JSON.parse(data).status);
      });
    },
  )
  .on("error", (err) => {
    console.log("Error: " + err.message);
  });
