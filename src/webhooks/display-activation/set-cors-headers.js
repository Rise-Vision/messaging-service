// const defaultOrigin = "*";

module.exports = (req, resp) => {
  // const requestingOrigin = req.get("origin") || "";
  // const allowedOrigin = requestingOrigin.endsWith("risevision.com") ?
  //   requestingOrigin :
  //   defaultOrigin;

  resp.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*"
  });
};
