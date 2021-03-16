module.exports = {
  wrongAuthorization: {
    code: 403,
    msg: "Not authorized"
  },
  missingId: {
    code: 400,
    msg: "Endpoint or display id (id) is required"
  },
  missingDisplayId: {
    code: 400,
    msg: "Display id (displayId) is required"
  },
  missingTopic: {
    code: 400,
    msg: "Topic (topic) is required"
  },

  noHandler: {
    code: 400,
    msg: "Request has no handler"
  }
};
