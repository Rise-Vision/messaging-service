const defaultOrigin = process.env.NODE_ENV === "test" ?
"*" :
"https://www.risevision.com";

module.exports = (req, resp) => {
  const requestingOrigin = req.get("origin") || "";
  const allowedOrigin = requestingOrigin.endsWith("risevision.com") ?
    requestingOrigin :
    defaultOrigin;

  resp.set({
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": req.get("access-control-request-headers") || "*"
  });
};
